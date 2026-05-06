export interface FKRef {
  column: string;
  refTable: string;
  refPk: string;
  refLabel: string;
}

export interface TableConfig {
  tableName: string;
  apiRoute: string;
  pk: string;
  sensitiveFields: string[];
  fks: FKRef[];
  labelColumn: string;
  columns: { name: string; type: string }[];
}

export type Row = Record<string, unknown>;
