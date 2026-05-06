export interface ColumnDef {
  name: string;
  type: string;       // SQLite affinity: TEXT, INTEGER, REAL, BLOB, NUMERIC
  nullable: boolean;
  adoType: number;    // raw ADODB DataTypeEnum value from Access
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
}

export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  password?: string;
  tables?: string[];  // if omitted, convert all tables
  verbose?: boolean;
}
