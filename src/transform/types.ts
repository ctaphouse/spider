// Maps ADODB DataTypeEnum values to SQLite type affinities.
// ADODB reference: https://learn.microsoft.com/en-us/sql/ado/reference/ado-api/datatypeenum
// SQLite affinities: https://www.sqlite.org/datatype3.html

const ADODB_TO_SQLITE: Record<number, string> = {
  2:   "INTEGER",  // adSmallInt
  3:   "INTEGER",  // adInteger
  4:   "REAL",     // adSingle
  5:   "REAL",     // adDouble
  6:   "NUMERIC",  // adCurrency
  7:   "TEXT",     // adDate
  11:  "INTEGER",  // adBoolean  (0 / -1 in Access → stored as 0/1)
  14:  "NUMERIC",  // adDecimal
  16:  "INTEGER",  // adTinyInt
  17:  "INTEGER",  // adUnsignedTinyInt
  18:  "INTEGER",  // adUnsignedSmallInt
  19:  "INTEGER",  // adUnsignedInt
  20:  "INTEGER",  // adBigInt
  21:  "INTEGER",  // adUnsignedBigInt
  72:  "TEXT",     // adGUID
  128: "BLOB",     // adBinary
  129: "TEXT",     // adChar
  130: "TEXT",     // adWChar
  131: "NUMERIC",  // adNumeric
  133: "TEXT",     // adDBDate
  134: "TEXT",     // adDBTime
  135: "TEXT",     // adDBTimeStamp
  200: "TEXT",     // adVarChar
  201: "TEXT",     // adLongVarChar  (Memo)
  202: "TEXT",     // adVarWChar
  203: "TEXT",     // adLongVarWChar (Memo / rich text)
  204: "BLOB",     // adVarBinary
  205: "BLOB",     // adLongVarBinary (OLE Object)
};

export function toSQLiteType(adoType: number): string {
  return ADODB_TO_SQLITE[adoType] ?? "TEXT";
}

// Access Boolean fields come through as -1 (true) / 0 (false).
// Normalise to 1 / 0 for SQLite.
export function normaliseValue(adoType: number, value: unknown): unknown {
  if (adoType === 11 && typeof value === "number") {
    return value !== 0 ? 1 : 0;
  }
  return value;
}
