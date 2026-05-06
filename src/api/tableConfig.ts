export interface FKRef {
  column: string;      // FK column in this table
  refTable: string;    // apiRoute key of the referenced table
  refPk: string;       // PK column in the referenced table
  refLabel: string;    // column to show as the human-readable label in dropdowns
}

export interface TableConfig {
  tableName: string;       // actual SQLite table name
  apiRoute: string;        // URL segment: /api/<apiRoute>
  pk: string;              // hardcoded PK (PRAGMA returns pk=0 for all cols)
  sensitiveFields: string[];
  fks: FKRef[];
  labelColumn: string;     // column used as human-readable label in FK dropdowns
}

export const TABLE_CONFIGS: Record<string, TableConfig> = {
  accounts: {
    tableName: "Account",
    apiRoute: "accounts",
    pk: "Id",
    labelColumn: "Account",
    sensitiveFields: [
      "AccountNumber",
      "RecoveryCode1", "RecoveryCode2", "RecoveryCode3",
      "RecoveryCode4", "RecoveryCode5",
    ],
    fks: [
      { column: "UserID",          refTable: "users",          refPk: "Id", refLabel: "User"          },
      { column: "PasscodeID",      refTable: "passcodes",      refPk: "Id", refLabel: "Passcode"      },
      { column: "CategoryID",      refTable: "categories",     refPk: "Id", refLabel: "Category"      },
      { column: "PaymentMethodID", refTable: "paymentMethods", refPk: "Id", refLabel: "PaymentMethod" },
      { column: "StatusId",        refTable: "statuses",       refPk: "Id", refLabel: "Status"        },
    ],
  },
  categories: {
    tableName: "Category",
    apiRoute: "categories",
    pk: "Id",
    labelColumn: "Category",
    sensitiveFields: [],
    fks: [],
  },
  passcodes: {
    tableName: "Passcode",
    apiRoute: "passcodes",
    pk: "Id",
    labelColumn: "Notes",
    sensitiveFields: ["Passcode"],
    fks: [],
  },
  paymentMethods: {
    tableName: "PaymentMethod",
    apiRoute: "paymentMethods",
    pk: "Id",
    labelColumn: "PaymentMethod",
    sensitiveFields: [],
    fks: [],
  },
  statuses: {
    tableName: "Status",
    apiRoute: "statuses",
    pk: "Id",
    labelColumn: "Status",
    sensitiveFields: [],
    fks: [],
  },
  users: {
    tableName: "User",
    apiRoute: "users",
    pk: "Id",
    labelColumn: "User",
    sensitiveFields: [],
    fks: [],
  },
};

export const TABLE_CONFIG_LIST = Object.values(TABLE_CONFIGS);
