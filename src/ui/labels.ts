/** Plural display names used in the sidebar nav */
export const TABLE_NAV_LABELS: Record<string, string> = {
  accounts:       "Accounts",
  categories:     "Categories",
  passcodes:      "Passcodes",
  paymentMethods: "Payment Methods",
  statuses:       "Statuses",
  users:          "Users",
};

/** Singular names used as FK column headers and form field labels */
export const TABLE_SINGULAR: Record<string, string> = {
  accounts:       "Account",
  categories:     "Category",
  passcodes:      "Passcode",
  paymentMethods: "Payment Method",
  statuses:       "Status",
  users:          "User",
};

/**
 * Display-name overrides for individual columns.
 * Applied in DataGrid headers and RecordModal field labels
 * for any column that isn't a FK (those use TABLE_SINGULAR).
 */
export const COLUMN_DISPLAY: Record<string, string> = {
  AccountNumber: "Account Number",
  PaymentMethod: "Payment Method",
};

/** Strip the "tbl" prefix Access uses and return a plain display name */
export function stripTbl(tableName: string): string {
  return tableName.startsWith("tbl") ? tableName.slice(3) : tableName;
}
