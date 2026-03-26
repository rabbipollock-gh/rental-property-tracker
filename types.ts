export interface Payment {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  note: string;
}

export interface Fee {
  id: string;
  date: string;
  amount: number;
  category?: string;
  description: string;
}

export interface Adjustment {
  id: string;
  date: string;
  amount: number; // Can be negative
  reason: string;
}

export interface ExpenseSplit {
  amount: number;
  category: string;
  description?: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  vendor?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly';
  propertyId?: string; // For future phase 2 Support
  isSplit?: boolean;
  splits?: ExpenseSplit[];
}

export interface Notice {
  id: string;
  date: string;
  type: string; // e.g., '3-Day Pay or Quit', '30-Day Notice'
  status: string; // e.g., 'Served', 'Resolved', 'Pending'
  notes: string;
}

export interface MonthRecord {
  id: string; // Format: "YYYY-MM"
  year: number;
  month: number; // 1-12
  monthlyRent: number;
  dueDate: string; // YYYY-MM-DD
  payments: Payment[];
  manualFees: Fee[];
  adjustments: Adjustment[];
  expenses: Expense[];
  notices: Notice[];
  lateFeeOverride?: number; // Optional manual override for late fees
  // Calculated fields stored for caching or computed on fly
}

export interface PropertySettings {
  landlordName: string;
  landlordAddress: string;
  landlordEmail: string;
  gmailAppPassword?: string;
  savedContacts?: string[];
  tenantName: string;
  tenantAddress: string;
  tenantEmail: string;
  tenantName2?: string;
  tenantEmail2?: string;
  propertyAddress: string;
  securityDepositAmount?: number;
  securityDepositHeld?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  feeCategories?: string[];
  expenseCategories?: string[];
}

export interface ImportLog {
  type: 'info' | 'warning' | 'error';
  message: string;
  row?: number;
  data?: any;
}

export interface ImportResult {
  success: boolean;
  logs: ImportLog[];
  rowsProcessed: number;
  rowsImported: number;
}

export interface AppData {
  settings: PropertySettings;
  records: MonthRecord[];
  propertyExpenses: Expense[];
}

export interface MonthStats {
  totalRent: number;
  totalPayments: number;
  totalManualFees: number;
  totalAdjustments: number;
  flatLateFee: number;
  dailyLateFee: number;
  totalLateFees: number;
  totalOwed: number; 
  remainingBalance: number;
  rentOwed: number;
  lateFeesOwed: number;
  manualFeesOwed: number;
  evictionFeesOwed: number;
  otherFeesOwed: number;
  isPaidOff: boolean;
  daysLate: number;
}

export interface EditTarget {
  type: 'payment' | 'fee' | 'adjustment' | 'expense' | null;
  item: Payment | Fee | Adjustment | Expense | null;
  monthId?: string; // Empty if global expense
}