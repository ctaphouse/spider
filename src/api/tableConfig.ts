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
    tableName: "tblAccount",
    apiRoute: "accounts",
    pk: "AccountID",
    labelColumn: "Account",
    sensitiveFields: [
      "AccountNumber",
      "RecoveryCode1", "RecoveryCode2", "RecoveryCode3",
      "RecoveryCode4", "RecoveryCode5",
    ],
    fks: [
      { column: "UserID",          refTable: "users",          refPk: "UserID",          refLabel: "User"          },
      { column: "PasscodeID",      refTable: "passcodes",      refPk: "PasscodeID",      refLabel: "Comment"       },
      { column: "CategoryID",      refTable: "categories",     refPk: "CategoryID",      refLabel: "Category"      },
      { column: "PaymentMethodID", refTable: "paymentMethods", refPk: "PaymentMethodID", refLabel: "PaymentMethod" },
      { column: "StatusId",        refTable: "statuses",       refPk: "Id",              refLabel: "Status"        },
    ],
  },
  categories: {
    tableName: "tblCategory",
    apiRoute: "categories",
    pk: "CategoryID",
    labelColumn: "Category",
    sensitiveFields: [],
    fks: [],
  },
  passcodes: {
    tableName: "tblPasscode",
    apiRoute: "passcodes",
    pk: "PasscodeID",
    labelColumn: "Comment",
    sensitiveFields: ["Passcode"],
    fks: [],
  },
  paymentMethods: {
    tableName: "tblPaymentMethod",
    apiRoute: "paymentMethods",
    pk: "PaymentMethodID",
    labelColumn: "PaymentMethod",
    sensitiveFields: [],
    fks: [],
  },
  statuses: {
    tableName: "tblStatus",
    apiRoute: "statuses",
    pk: "Id",
    labelColumn: "Status",
    sensitiveFields: [],
    fks: [],
  },
  users: {
    tableName: "tblUser",
    apiRoute: "users",
    pk: "UserID",
    labelColumn: "User",
    sensitiveFields: [],
    fks: [],
  },
};

export const TABLE_CONFIG_LIST = Object.values(TABLE_CONFIGS);
