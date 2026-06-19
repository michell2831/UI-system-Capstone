// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'subsystem_admin' | 'staff' | 'opcr_evaluator'

export type OfficeCode = 'ADMIN_OFFICE' | 'ACADEMIC_OFFICE' | 'OSAS'

export interface JwtPayload {
  sub: string
  name: string
  email: string
  role: UserRole
  office_id: string
  office_code: OfficeCode
  office_name: string
  iat: number
  exp: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  office_id: string
  office_code: OfficeCode
  office_name: string
  is_active: boolean
  created_at: string
}

// ─── Office ──────────────────────────────────────────────────────────────────

export interface Office {
  id: string
  name: string
  code: OfficeCode
}

// ─── Service (from OPCR catalogue) ───────────────────────────────────────────

export type ServiceCategory =
  | 'Medical'
  | 'Dental'
  | 'Administrative'
  | 'Enrollment'
  | 'Grade & Records'
  | 'Accreditation'
  | 'Research & Extension'
  | 'Training & Seminar'
  | 'ID Services'
  | 'Consultation'
  | 'Counseling'
  | 'Recommendation'
  | 'Activity Permit'
  | 'Verification'
  | 'Records'
  | 'Credentials'
  | 'Good Moral'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  client_type: string
  office_id: string
  office_code: OfficeCode
  sla_target_seconds: number
  sla_display: string
  is_active: boolean
  is_na?: boolean  // EMS-004: N/A services are excluded from the service selector
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'in_progress' | 'completed'
export type DocumentaryStatus = 'complete' | 'incomplete' | 'for_compliance'
export type SlaStatus = 'compliant' | 'non_compliant' | 'pending_computation' | 'overridden'

// ─── Audit ────────────────────────────────────────────────────────────────────

/** Classifies every write operation that generates an audit log entry (EMS-024) */
export type ActionType =
  | 'CREATE'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT'
  | 'DOCUMENTARY_CHANGE'
  | 'REMARKS_UPDATE'

export interface AuditTimelineItem {
  id: string
  event: string
  timestamp: string
  created_by_name: string
}

export interface Transaction {
  id: string
  service_id: string
  service_name: string
  service_category: ServiceCategory
  office_id: string
  office_name: string
  assigned_to: string | null
  assigned_to_name: string | null
  created_by: string
  created_by_name: string
  time_in: string
  time_out: string | null
  status: TransactionStatus
  documentary_status: DocumentaryStatus
  processing_time_seconds: number | null
  sla_target_seconds: number
  sla_status: SlaStatus
  is_sla_breached: boolean
  is_overridden?: boolean
  override_reason?: string
  override_document_name?: string
  original_time_in?: string
  client_name: string
  client_type?: string | null
  student_number?: string | null
  course?: string | null
  year_level?: string | null
  contact_number?: string | null
  organization?: string | null
  org_level?: string | null
  service_specific_data?: Record<string, unknown> | null
  audit_timeline?: AuditTimelineItem[]
  remarks: string | null
  intake_data?: Record<string, string> | null
  is_locked: boolean      // EMS-025: set true atomically when status → completed
  created_at: string
  updated_at: string
}

export interface TransactionStatusHistory {
  id: string
  transaction_id: string
  action_type: ActionType            // EMS-024: classifies the write operation
  old_status: TransactionStatus | null
  new_status: TransactionStatus
  documentary_old: DocumentaryStatus | null
  documentary_new: DocumentaryStatus | null
  old_value: string | null           // EMS-024: human-readable previous value
  new_value: string | null           // EMS-024: human-readable new value
  changed_by: string
  changed_by_name: string
  changed_at: string
  remarks: string | null
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface CreateTransactionDto {
  service_id: string
  assigned_to?: string
  client_name: string
  client_type?: string
  student_number?: string
  course?: string
  year_level?: string
  contact_number?: string
  organization?: string
  org_level?: string
  remarks?: string
  documentation_status?: DocumentaryStatus
  service_specific_data?: Record<string, unknown>
  intake_data?: Record<string, string>  // EMS-004: dynamic intake form data
}

export interface UpdateTransactionStatusDto {
  status: TransactionStatus
  remarks?: string
  override_document_name?: string
}

export interface UpdateDocumentaryStatusDto {
  documentary_status: DocumentaryStatus
  remarks?: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_transactions: number
  pending: number
  in_progress: number
  completed: number
  compliant: number
  non_compliant: number
  pending_computation: number
  sla_breach_count: number
  compliance_rate: number
}

// ─── Auth forms ──────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}
