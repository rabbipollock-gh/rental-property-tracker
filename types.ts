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
  propertyId?: string; // Phase 8: Links expense to a specific property (if global)
  unitId?: string; // Phase 8: Links to a specific unit (e.g. Duplex side A)
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
  leaseId?: string; // Phase 8: The active lease generating this baseline rent
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

export interface Unit {
  id: string;
  name: string; // e.g. "Apt 1", "Unit B", "Main House"
}

export interface Property {
  id: string;
  name: string; // e.g. "Main Street Duplex"
  address: string;
  units: Unit[];
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  coTenantName?: string;
  coTenantEmail?: string;
  phone?: string;
}

export interface Lease {
  id: string;
  propertyId: string;
  unitId?: string;
  tenantId: string;
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'Lease' | 'Receipt' | 'Tax' | 'Other';
  url: string;
  dateAdded: string;
  propertyId?: string;
  tenantId?: string;
  monthId?: string;
}

export interface AppData {
  settings: PropertySettings;
  properties?: Property[];
  tenants?: Tenant[];
  leases?: Lease[];
  documents?: DocumentItem[];
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