export type RoleCode =
  | "SUPER_ADMIN"
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "FINANCE"
  | "STAFF"
  | "TENANT";

export type UnitStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "MAINTENANCE"
  | "INACTIVE";

export type LeaseStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED";

export type BillingCycle =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI_ANNUAL"
  | "YEARLY";

export type InvoiceStatus =
  | "DRAFT"
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "VERIFIED"
  | "FAILED"
  | "REJECTED"
  | "REFUNDED";

export type ComplaintStatus =
  | "NEW"
  | "REVIEWED"
  | "IN_PROGRESS"
  | "WAITING_TENANT"
  | "RESOLVED"
  | "CLOSED";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
  };
  errors?: Record<string, string[]>;
}

export interface OrganizationBankAccount {
  id: string;
  organization_id: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface PropertyItem {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  status: "ACTIVE" | "ARCHIVED";
  units_count?: number;
  occupied_units_count?: number;
}

export interface UnitItem {
  id: string;
  organization_id: string;
  property_id: string;
  unit_number: string;
  floor_number?: number;
  area_sqm?: string;
  rental_price: string;
  status: UnitStatus;
}

export interface InvoiceItemRow {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  lease_id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  issue_date: string;
  due_date: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid_amount: string;
  status: InvoiceStatus;
  items?: InvoiceItemRow[];
}
