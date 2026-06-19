/**
 * Mock API — simulates NestJS responses.
 * Replace each function body with real apiClient calls when backend is ready.
 */

import type {
  User, Service, Transaction, TransactionStatusHistory,
  CreateTransactionDto, UpdateTransactionStatusDto, UpdateDocumentaryStatusDto,
  DashboardStats, LoginDto, LoginResponse,
} from '@/types'
import {
  MOCK_SERVICES, MOCK_TRANSACTIONS, MOCK_HISTORY,
} from '@/utils/mockData'
import { apiClient } from './client'
import { computeSlaStatus, isSlaBreached } from '@/utils/slaUtils'

// ─── In-memory store ─────────────────────────────────────────────────────────

let _transactions: Transaction[] = [...MOCK_TRANSACTIONS]
const _history: TransactionStatusHistory[] = [...MOCK_HISTORY]

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Users (EMS-001) ─────────────────────────────────────────────────────────

export async function getUsersApi(officeId?: string): Promise<User[]> {
  const response = await apiClient.get<User[]>(
    officeId ? `/users?officeId=${officeId}` : '/users'
  )
  return response.data
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServicesApi(officeId?: string): Promise<Service[]> {
  await delay()
  // EMS-004: exclude N/A services (is_na === true) from the service selector
  return officeId
    ? MOCK_SERVICES.filter((s) => s.office_id === officeId && s.is_active && !s.is_na)
    : MOCK_SERVICES.filter((s) => s.is_active && !s.is_na)
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getTransactionsApi(officeId?: string): Promise<Transaction[]> {
  await delay()
  const list = officeId
    ? _transactions.filter((t) => t.office_id === officeId)
    : _transactions
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function getTransactionApi(id: string): Promise<Transaction> {
  await delay()
  const txn = _transactions.find((t) => t.id === id)
  if (!txn) throw new Error('Transaction not found')
  return txn
}

// EMS-004: Create transaction — auto time-in
export async function createTransactionApi(
  dto: CreateTransactionDto,
  createdBy: User,
): Promise<Transaction> {
  await delay(400)
  const service = MOCK_SERVICES.find((s) => s.id === dto.service_id)
  if (!service) throw new Error('Service not found')

  let assigneeName: string | null = null
  if (dto.assigned_to) {
    try {
      const usersRes = await apiClient.get<User[]>('/users')
      const found = usersRes.data.find((u) => u.id === dto.assigned_to)
      if (found) assigneeName = found.name
    } catch {
      assigneeName = dto.assigned_to
    }
  }
  const documentaryStatus = dto.documentation_status ?? 'complete'

  const assignedToId = dto.assigned_to ?? null
  const assignedToName = assigneeName ?? dto.assigned_to ?? null

  const newTxn: Transaction = {
    id: `txn-${Date.now()}`,
    service_id: service.id,
    service_name: service.name,
    service_category: service.category,
    office_id: createdBy.office_id,
    office_name: createdBy.office_name,
    assigned_to: assignedToId,
    assigned_to_name: assignedToName,
    created_by: createdBy.id,
    created_by_name: createdBy.name,
    time_in: new Date().toISOString(), // EMS-004: auto time-in
    time_out: null,
    status: 'pending',
    documentary_status: documentaryStatus,
    processing_time_seconds: null,
    sla_target_seconds: service.sla_target_seconds,
    sla_status: 'pending_computation',
    is_sla_breached: false,
    client_name: dto.client_name,
    client_type: dto.client_type ?? null,
    student_number: dto.student_number ?? null,
    course: dto.course ?? null,
    year_level: dto.year_level ?? null,
    contact_number: dto.contact_number ?? null,
    organization: dto.organization ?? null,
    service_specific_data: dto.service_specific_data ?? null,
    audit_timeline: [
      {
        id: `at-${Date.now()}`,
        event: 'Transaction created',
        timestamp: new Date().toISOString(),
        created_by_name: createdBy.name,
      },
    ],
    remarks: dto.remarks ?? null,
    intake_data: dto.intake_data ?? null,
    is_locked: false,              // EMS-025: set true atomically when completed
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  _transactions = [newTxn, ..._transactions]

  // Record initial history (EMS-024: action_type + old/new value)
  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: newTxn.id,
    action_type: 'CREATE',
    old_status: null, new_status: 'pending',
    documentary_old: null, documentary_new: documentaryStatus,
    old_value: null, new_value: 'pending',
    changed_by: createdBy.id, changed_by_name: createdBy.name,
    changed_at: newTxn.time_in,
    remarks: 'Transaction created',
  })
  dispatchToARMS('transaction.created', newTxn.id, createdBy.id)

  return newTxn
}

// EMS-005: Assign transaction
export async function assignTransactionApi(
  id: string,
  assignedTo: string,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  // EMS-005: only same-office staff; admin can reassign
  const txn = _transactions[idx]
  if (txn.office_id !== actingUser.office_id) throw new Error('Cross-office assignment not allowed')

  const usersRes = await apiClient.get<User[]>('/users')
  const assignee = usersRes.data.find((u) => u.id === assignedTo)
  if (!assignee || assignee.office_id !== txn.office_id) {
    throw new Error('Assignee must be in the same office')
  }

  const updated: Transaction = {
    ...txn,
    assigned_to: assignee.id,
    assigned_to_name: assignee.name,
    updated_at: new Date().toISOString(),
  }
  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    action_type: 'ASSIGNMENT',
    old_status: txn.status,
    new_status: txn.status,
    documentary_old: txn.documentary_status,
    documentary_new: txn.documentary_status,
    old_value: txn.assigned_to_name ?? 'Unassigned',
    new_value: assignee.name,
    changed_by: actingUser.id, changed_by_name: actingUser.name,
    changed_at: updated.updated_at,
    remarks: `Reassigned from ${txn.assigned_to_name ?? 'Unassigned'} to ${assignee.name}`,
  })
  dispatchToARMS('transaction.assigned', id, actingUser.id)

  return updated
}

// EMS-006: Update status — timestamped, EMS-008: auto time-out
export async function updateTransactionStatusApi(
  id: string,
  dto: UpdateTransactionStatusDto,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  if (txn.status === 'completed') throw new Error('Completed transactions are read-only')

  const now = new Date().toISOString()

  // EMS-008: auto time-out when completed
  const timeOut = dto.status === 'completed' ? now : txn.time_out

  // EMS-009: compute processing time on completion (excluding incomplete windows)
  let processingTime = txn.processing_time_seconds
  let slaStatus = txn.sla_status
  let isBreach = txn.is_sla_breached

  if (dto.status === 'completed' && timeOut) {
    // Simple computation: elapsed seconds from time_in to time_out
    const start = new Date(txn.time_in).getTime()
    const end = new Date(timeOut).getTime()
    processingTime = Math.max(0, Math.round((end - start) / 1000))
    slaStatus = computeSlaStatus(processingTime, txn.sla_target_seconds)
    isBreach = isSlaBreached(processingTime, txn.sla_target_seconds)
  }

  const updated: Transaction = {
    ...txn,
    status: dto.status,
    time_out: timeOut,
    processing_time_seconds: processingTime,
    sla_status: slaStatus,
    is_sla_breached: isBreach,
    is_locked: dto.status === 'completed', // EMS-025: lock atomically on completion
    override_document_name: dto.override_document_name || txn.override_document_name,
    updated_at: now,
  }
  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    action_type: 'STATUS_CHANGE',
    old_status: txn.status, new_status: dto.status,
    documentary_old: txn.documentary_status, documentary_new: txn.documentary_status,
    old_value: txn.status, new_value: dto.status,
    changed_by: actingUser.id, changed_by_name: actingUser.name,
    changed_at: now, remarks: dto.remarks ?? null,
  })
  dispatchToARMS('transaction.status_changed', id, actingUser.id)

  return updated
}

// EMS-007: Update documentary status
export async function updateDocumentaryStatusApi(
  id: string,
  dto: UpdateDocumentaryStatusDto,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  if (txn.status === 'completed') throw new Error('Completed transactions are read-only')

  const now = new Date().toISOString()
  const updated: Transaction = {
    ...txn,
    documentary_status: dto.documentary_status,
    updated_at: now,
  }
  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    action_type: 'DOCUMENTARY_CHANGE',
    old_status: txn.status, new_status: txn.status,
    documentary_old: txn.documentary_status, documentary_new: dto.documentary_status,
    old_value: txn.documentary_status, new_value: dto.documentary_status,
    changed_by: actingUser.id, changed_by_name: actingUser.name,
    changed_at: now, remarks: dto.remarks ?? null,
  })
  dispatchToARMS('transaction.documentary_changed', id, actingUser.id)

  return updated
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getTransactionHistoryApi(transactionId: string): Promise<TransactionStatusHistory[]> {
  await delay()
  return _history
    .filter((h) => h.transaction_id === transactionId)
    .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
}

/**
 * EMS-024: ARMS dispatch stub (MS-4 audit-relay event).
 * Replace with Kafka producer call / HTTP webhook when ARMS integration is wired.
 */
function dispatchToARMS(event: string, transactionId: string, actorId: string): void {
  // TODO: publish to Kafka topic `ems.transaction.<event>` via MS-4
  console.debug('[ARMS stub] dispatching', { event, transactionId, actorId, ts: new Date().toISOString() })
}

/**
 * EMS-026: Retrieve all audit log entries across all transactions for the office.
 * Supports filtering by office, date range, and action type.
 */
export async function getAuditLogApi(
  officeId?: string,
  filters?: { actionType?: string; from?: string; to?: string },
): Promise<TransactionStatusHistory[]> {
  await delay()
  const officeTransactionIds = new Set(
    (officeId ? _transactions.filter((t) => t.office_id === officeId) : _transactions)
      .map((t) => t.id),
  )

  let log = _history.filter((h) => officeTransactionIds.has(h.transaction_id))

  if (filters?.actionType && filters.actionType !== 'ALL') {
    log = log.filter((h) => h.action_type === filters.actionType)
  }
  if (filters?.from) {
    const from = new Date(filters.from).getTime()
    log = log.filter((h) => new Date(h.changed_at).getTime() >= from)
  }
  if (filters?.to) {
    const to = new Date(filters.to).getTime()
    log = log.filter((h) => new Date(h.changed_at).getTime() <= to)
  }

  return log.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export async function getDashboardStatsApi(officeId?: string): Promise<DashboardStats> {
  await delay()
  const list = officeId
    ? _transactions.filter((t) => t.office_id === officeId)
    : _transactions

  const total = list.length
  const pending = list.filter((t) => t.status === 'pending').length
  const in_progress = list.filter((t) => t.status === 'in_progress').length
  const completed = list.filter((t) => t.status === 'completed').length
  const compliant = list.filter((t) => t.sla_status === 'compliant').length
  const non_compliant = list.filter((t) => t.sla_status === 'non_compliant').length
  const pending_computation = list.filter((t) => t.sla_status === 'pending_computation').length
  const sla_breach_count = list.filter((t) => t.is_sla_breached).length
  const compliance_rate = completed > 0 ? Math.round((compliant / completed) * 100) : 0

  return {
    total_transactions: total,
    pending, in_progress, completed,
    compliant, non_compliant, pending_computation,
    sla_breach_count, compliance_rate,
  }
}

export async function overrideTimeInApi(
  id: string,
  newTimeIn: string,
  reason: string,
  documentName: string | null,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  const now = new Date().toISOString()
  const originalTimeIn = txn.original_time_in || txn.time_in

  // If already completed, recalculate SLA processing time and SLA status
  let processingTime = txn.processing_time_seconds
  let slaStatus = txn.sla_status
  let isBreach = txn.is_sla_breached

  if (txn.status === 'completed' && txn.time_out) {
    const start = new Date(newTimeIn).getTime()
    const end = new Date(txn.time_out).getTime()
    processingTime = Math.max(0, Math.round((end - start) / 1000))
    slaStatus = computeSlaStatus(processingTime, txn.sla_target_seconds)
    isBreach = isSlaBreached(processingTime, txn.sla_target_seconds)
  }

  const updated: Transaction = {
    ...txn,
    time_in: newTimeIn,
    original_time_in: originalTimeIn,
    is_overridden: true,
    override_reason: reason,
    override_document_name: documentName || undefined,
    processing_time_seconds: processingTime,
    sla_status: slaStatus,
    is_sla_breached: isBreach,
    updated_at: now,
  }

  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    action_type: 'STATUS_CHANGE',
    old_status: txn.status,
    new_status: txn.status,
    documentary_old: txn.documentary_status,
    documentary_new: txn.documentary_status,
    old_value: originalTimeIn,
    new_value: newTimeIn,
    changed_by: actingUser.id,
    changed_by_name: actingUser.name,
    changed_at: now,
    remarks: `Time-In Overridden: Changed from ${originalTimeIn} to ${newTimeIn}. Reason: ${reason}${documentName ? ` (Doc: ${documentName})` : ' (Pending Document)'}`,
  })

  return updated
}

export async function uploadOverrideDocumentApi(
  id: string,
  documentName: string,
  actingUser: User,
): Promise<Transaction> {
  await delay()
  const idx = _transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('Transaction not found')

  const txn = _transactions[idx]
  const now = new Date().toISOString()

  const updated: Transaction = {
    ...txn,
    override_document_name: documentName,
    updated_at: now,
  }

  _transactions[idx] = updated

  _history.push({
    id: `h-${Date.now()}`,
    transaction_id: id,
    action_type: 'REMARKS_UPDATE',
    old_status: txn.status,
    new_status: txn.status,
    documentary_old: txn.documentary_status,
    documentary_new: txn.documentary_status,
    old_value: txn.override_document_name || 'None',
    new_value: documentName,
    changed_by: actingUser.id,
    changed_by_name: actingUser.name,
    changed_at: now,
    remarks: `Supporting document uploaded: ${documentName}`,
  })

  return updated
}
