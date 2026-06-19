import type { User, Office, Service, Transaction, TransactionStatusHistory } from '@/types'
import { parseSlaToSeconds } from './timeUtils'

// ─── Offices ─────────────────────────────────────────────────────────────────

export const OFFICES: Office[] = [
  { id: 'off-1', name: 'Administrative Office', code: 'ADMIN_OFFICE' },
  { id: 'off-2', name: 'Academic Office', code: 'ACADEMIC_OFFICE' },
  { id: 'off-3', name: 'Office of Student Affairs and Services', code: 'OSAS' },
]

// ─── Users (mock ARMS-synced) ─────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  // Administrative Office
  {
    id: 'usr-1', name: 'John Michael Garcia', email: 'Garcia@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-2', name: 'Kenneth Yulip', email: 'Yulip@pup.edu.ph',
    role: 'staff', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'usr-3', name: 'Ryan Bill Donayre', email: 'Donayre@pup.edu.ph',
    role: 'staff', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-03T00:00:00Z',
  },
  // Academic Office
  {
    id: 'usr-4', name: 'Ramon Dela Cruz', email: 'rdelacruz@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-04T00:00:00Z',
  },
  {
    id: 'usr-5', name: 'Lucia Gonzales', email: 'lgonzales@pup.edu.ph',
    role: 'staff', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'usr-6', name: 'Paolo Ramos', email: 'pramos@pup.edu.ph',
    role: 'staff', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-06T00:00:00Z',
  },
  // OSAS
  {
    id: 'usr-7', name: 'Mikhail Reveche', email: 'ebautista@pup.edu.ph',
    role: 'subsystem_admin', office_id: 'off-3', office_code: 'OSAS',
    office_name: 'OSAS', is_active: true, created_at: '2026-01-07T00:00:00Z',
  },
  {
    id: 'usr-8', name: 'Marco Flores', email: 'mflores@pup.edu.ph',
    role: 'staff', office_id: 'off-3', office_code: 'OSAS',
    office_name: 'OSAS', is_active: true, created_at: '2026-01-08T00:00:00Z',
  },
  // OPCR Evaluator (cross-office)
  {
    id: 'usr-9', name: 'Pau Carillio', email: 'Pau@pup.edu.ph',
    role: 'opcr_evaluator', office_id: 'off-1', office_code: 'ADMIN_OFFICE',
    office_name: 'Administrative Office', is_active: true, created_at: '2026-01-09T00:00:00Z',
  },
  // ─── Sprint 3 Demo Accounts — Academic Office ─────────────────────────────
  {
    id: 'usr-10', name: 'Dr. Ana Reyes', email: 'academic_admin@ems.ph',
    role: 'subsystem_admin', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'usr-11', name: 'Ben Santos', email: 'academic_staff@ems.ph',
    role: 'staff', office_id: 'off-2', office_code: 'ACADEMIC_OFFICE',
    office_name: 'Academic Office', is_active: true, created_at: '2026-01-11T00:00:00Z',
  },
]

// Mock credentials for demo login
export const MOCK_CREDENTIALS: Record<string, { password: string; userId: string }> = {
  'msantos@pup.edu.ph': { password: 'admin123', userId: 'usr-1' },
  'jreyes@pup.edu.ph': { password: 'staff123', userId: 'usr-2' },
  'rdela@pup.edu.ph': { password: 'admin123', userId: 'usr-4' },
  'lgonzales@pup.edu.ph': { password: 'staff123', userId: 'usr-5' },
  'ebautista@pup.edu.ph': { password: 'admin123', userId: 'usr-7' },
  'mflores@pup.edu.ph': { password: 'staff123', userId: 'usr-8' },
  'rlim@pup.edu.ph': { password: 'opcr123', userId: 'usr-9' },
  // convenience aliases
  'admin@ems.ph': { password: 'admin123', userId: 'usr-1' },
  'staff@ems.ph': { password: 'staff123', userId: 'usr-2' },
  'opcr@ems.ph':  { password: 'opcr123',  userId: 'usr-9' },
  // Sprint 3 demo accounts — Academic Office
  'academic_admin@ems.ph': { password: 'demo123', userId: 'usr-10' },
  'academic_staff@ems.ph': { password: 'demo123', userId: 'usr-11' },
}

// ─── Services (from OPCR SLA CSV) ────────────────────────────────────────────

const svc = (
  id: string,
  name: string,
  category: string,
  clientType: string,
  officeId: string,
  officeCode: string,
  slaDisplay: string,
): Service => ({
  id,
  name,
  category: category as Service['category'],
  client_type: clientType,
  office_id: officeId,
  office_code: officeCode as Service['office_code'],
  sla_target_seconds: parseSlaToSeconds(slaDisplay),
  sla_display: slaDisplay,
  is_active: true,
  is_na: false,   // EMS-004: default to false; set true for N/A (placeholder) services
})

export const MOCK_SERVICES: Service[] = [
  // Administrative Office – Medical
  svc('svc-1', 'Emergency Medical Consultation — WITH REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '22 min'),
  svc('svc-2', 'Emergency Medical Consultation — WITHOUT REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '18 min'),
  svc('svc-3', 'Non-Emergency Medical Consultation (New Patient)', 'Medical', 'Student & Dependents', 'off-1', 'ADMIN_OFFICE', '30 min'),
  svc('svc-4', 'Non-Emergency Medical Consultation (Follow-up)', 'Medical', 'Student & Dependents', 'off-1', 'ADMIN_OFFICE', '28 min'),
  svc('svc-5', 'Medical Certificate — Sick Note / Excuse Slip', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '8 min'),
  svc('svc-6', 'Medical Clearance for Enrollment (Normal)', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '15 min'),
  svc('svc-7', 'Medical Clearance for OJT — WITHOUT REFERRAL', 'Medical', 'Student', 'off-1', 'ADMIN_OFFICE', '12 min'),
  svc('svc-8', 'Annual Medical Clearance — WITHOUT REFERRAL', 'Medical', 'Faculty & Admin', 'off-1', 'ADMIN_OFFICE', '12 min'),
  // Administrative Office – Dental
  svc('svc-9', 'Emergency Dental Consultation — WITH REFERRAL', 'Dental', 'Faculty & Admin', 'off-1', 'ADMIN_OFFICE', '13 min'),
  svc('svc-10', 'Non-Emergency Dental Consultation (New Patient)', 'Dental', 'Student', 'off-1', 'ADMIN_OFFICE', '31 min'),
  svc('svc-11', 'Dental Clearance — WITHOUT REFERRAL', 'Dental', 'Student', 'off-1', 'ADMIN_OFFICE', '9 min'),
  // Administrative Office – Admin
  svc('svc-12', 'Campus Equipment / Materials Borrowing', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '15 min'),
  svc('svc-13', 'Facility Reservation Request', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '12 min'),
  svc('svc-14', 'Student Development Permission', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '7 min'),
  svc('svc-15', 'Library Circulation (Borrowing of Library Materials)', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '2 min'),
  svc('svc-16', 'Academic Verification Service', 'Administrative', 'General', 'off-1', 'ADMIN_OFFICE', '2 days, 1 hr, 50 min'),
  svc('svc-17', 'Re-Admission Processing (Returning Students)', 'Administrative', 'Student', 'off-1', 'ADMIN_OFFICE', '2 days, 7 hrs, 53 min'),
  // Academic Office
  svc('svc-18', 'Processing of Application for Change of Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '18 min'),
  svc('svc-19', 'Processing of Application for Cross-Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '10 min'),
  svc('svc-20', 'Processing of Manual Enrollment', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '2 days, 6 hrs, 30 min'),
  svc('svc-21', 'Processing of Application for Overload of Subjects', 'Enrollment', 'Student', 'off-2', 'ACADEMIC_OFFICE', '7 min'),
  svc('svc-22', 'Processing of Application for Shifting', 'Grade & Records', 'Student', 'off-2', 'ACADEMIC_OFFICE', '27 min'),
  svc('svc-23', 'Processing of Request for Certification (Grades, GWA)', 'Grade & Records', 'Student', 'off-2', 'ACADEMIC_OFFICE', '37 min'),
  svc('svc-24', 'Processing of Course Accreditation (Transferees)', 'Accreditation', 'Student (Transferee)', 'off-2', 'ACADEMIC_OFFICE', '1 day, 5 hrs, 30 min'),
  // OSAS
  svc('svc-25', 'New ID Application', 'ID Services', 'Student', 'off-3', 'OSAS', '2 days, 23 min'),
  svc('svc-26', 'ID Replacement', 'ID Services', 'Student', 'off-3', 'OSAS', '2 days, 23 min'),
  svc('svc-27', 'Consultation Service', 'Consultation', 'Student', 'off-3', 'OSAS', '28 min'),
  svc('svc-28', 'Counseling Service', 'Counseling', 'Student', 'off-3', 'OSAS', '44 min'),
  svc('svc-29', 'Issuance of Recommendation Letter', 'Recommendation', 'Student / Alumni', 'off-3', 'OSAS', '50 min'),
  svc('svc-30', 'On-Campus Activity', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '1 hr, 15 min'),
  svc('svc-31', 'Fundraising', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '6 days, 7 hrs, 5 min'),
  svc('svc-32', 'Student Development Permission', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '7 min'),
  svc('svc-33', 'Processing of Request for Informative Copy of Grades', 'Records', 'Student', 'off-3', 'OSAS', '1 day, 1 hr, 18 min'),
  svc('svc-34', 'Good Moral Certificate', 'Good Moral', 'Student', 'off-3', 'OSAS', '12 min'),
  svc('svc-35', 'Issuance of Good Moral Certificate', 'Good Moral', 'Student', 'off-3', 'OSAS', '1 hr, 25 min'),
  svc('svc-36', 'Off-Campus Activity', 'Activity Permit', 'Student / Organization', 'off-3', 'OSAS', '1 hr, 15 min'),
  svc('svc-37', 'Student Medal Request', 'Administrative', 'Student', 'off-3', 'OSAS', '25 min'),
  svc('svc-38', 'Credentials Service (Transcript of Records)', 'Credentials', 'Student / Alumni', 'off-3', 'OSAS', '8 days, 5 hrs, 20 min'),
]

// ─── Transactions — starts empty; data is created through the UI ──────────────

export const MOCK_TRANSACTIONS: Transaction[] = []

export const MOCK_HISTORY: TransactionStatusHistory[] = []
