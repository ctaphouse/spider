<#
.SYNOPSIS
  Reads an .accdb (or .mdb) file via the ACE OLEDB provider and outputs JSON.
.PARAMETER DbPath
  Full path to the Access database file.
.PARAMETER Password
  Optional database password.
.NOTES
  Requires the Microsoft Access Database Engine (ACE) to be installed.
  Download: https://www.microsoft.com/en-us/download/details.aspx?id=54920
  The bitness of the engine must match this PowerShell process (64-bit preferred).
#>
param(
  [Parameter(Mandatory)][string]$DbPath,
  [string]$Password = ""
)

$ErrorActionPreference = "Stop"

$connStr = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$DbPath;Persist Security Info=False;"
if ($Password) { $connStr += "Jet OLEDB:Database Password=$Password;" }

$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connStr)

# Enumerate user tables (TABLE_TYPE = "TABLE" excludes system/linked tables)
$schemaRS = $conn.OpenSchema(20) # adSchemaTables
$tableNames = [System.Collections.Generic.List[string]]::new()
while (-not $schemaRS.EOF) {
  if ($schemaRS.Fields["TABLE_TYPE"].Value -eq "TABLE") {
    $tableNames.Add($schemaRS.Fields["TABLE_NAME"].Value)
  }
  $schemaRS.MoveNext()
}
$schemaRS.Close()

$output = [System.Collections.Generic.List[object]]::new()

foreach ($tableName in $tableNames) {
  $rs = New-Object -ComObject ADODB.Recordset
  # adOpenStatic (3), adLockReadOnly (1) — safe for read-only export
  $rs.Open("SELECT * FROM [$tableName]", $conn, 3, 1)

  $columns = [System.Collections.Generic.List[object]]::new()
  for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
    $f = $rs.Fields.Item($i)
    $columns.Add([ordered]@{ name = $f.Name; adoType = [int]$f.Type })
  }

  $rows = [System.Collections.Generic.List[object]]::new()
  while (-not $rs.EOF) {
    $row = [ordered]@{}
    for ($i = 0; $i -lt $rs.Fields.Count; $i++) {
      $f   = $rs.Fields.Item($i)
      $val = $f.Value
      if ($null -eq $val -or $val -is [System.DBNull]) {
        $row[$f.Name] = $null
      } elseif ($val -is [DateTime]) {
        $row[$f.Name] = $val.ToString("yyyy-MM-ddTHH:mm:ss")
      } elseif ($val -is [byte[]]) {
        $row[$f.Name] = [Convert]::ToBase64String($val)
      } else {
        $row[$f.Name] = $val
      }
    }
    $rows.Add($row)
    $rs.MoveNext()
  }
  $rs.Close()

  $output.Add([ordered]@{
    name    = $tableName
    columns = $columns.ToArray()
    rows    = $rows.ToArray()
  })
}

$conn.Close()

# -Compress keeps it on one line; depth 5 covers: tables > table > columns/rows > item > value
$output | ConvertTo-Json -Depth 5 -Compress
