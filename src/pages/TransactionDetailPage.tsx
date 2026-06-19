import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, User2, AlertTriangle, CheckCircle2,
  Lock, RotateCcw, PlusCircle, RefreshCw, UserCheck, FileText, MessageSquare,
  ShieldAlert, FileUp
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import {
  getTransactionApi, getTransactionHistoryApi,
  updateTransactionStatusApi, updateDocumentaryStatusApi,
  assignTransactionApi, getUsersApi, overrideTimeInApi,
  uploadOverrideDocumentApi,
} from '@/api/mockApi'
import type { Transaction, TransactionStatusHistory, User, TransactionStatus, DocumentaryStatus, ActionType } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { slaVariance } from '@/utils/slaUtils'
import { useModals } from '@/components/shared/ModalContext'
import { 
  Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, 
  Card, CardContent, CardHeader, Divider, Grid, Alert, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'

const STATUS_FLOW: TransactionStatus[] = ['pending', 'in_progress', 'completed']

function formatToLocalDatetimeString(isoString: string): string {
  try {
    const date = new Date(isoString)
    const tzoffset = date.getTimezoneOffset() * 60000 // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16)
    return localISOTime
  } catch {
    return ''
  }
}

function StatusStep({ status, current, completed }: { status: TransactionStatus; current: TransactionStatus; completed: boolean }) {
  const labels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' }
  const isActive = status === current
  const isDone = completed || STATUS_FLOW.indexOf(status) < STATUS_FLOW.indexOf(current)
  return (
    <Box sx={{ flex: 1, textAlign: 'center', fontWeight: isActive ? 600 : 'inherit' }}>
      <Box sx={{
        height: '8px',
        borderRadius: '9999px',
        mb: 1.5,
        transition: 'background-color 0.3s',
        bgcolor: isDone ? '#1D9E75' : isActive ? '#580000' : 'divider'
      }} />
      <Typography sx={{
        fontSize: '12px',
        fontWeight: 600,
        color: isDone || isActive ? 'text.primary' : 'text.secondary'
      }}>
        {labels[status]}
      </Typography>
    </Box>
  )
}

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [txn, setTxn] = useState<Transaction | null>(null)
  const [history, setHistory] = useState<TransactionStatusHistory[]>([])
  const [officeUsers, setOfficeUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Status/Document update remarks
  const [statusRemarks, setStatusRemarks] = useState('')
  const [docRemarks, setDocRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  // SLA / Time-In Manual Override state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [overrideTimeIn, setOverrideTimeIn] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [submittingOverride, setSubmittingOverride] = useState(false)
  const [uploadingInlineDoc, setUploadingInlineDoc] = useState(false)
  const [completionFile, setCompletionFile] = useState<File | null>(null)

  const { confirm, showResult } = useModals()

  // EMS-025: locked = completed (is_locked set atomically on completion)
  const canModify = user?.role !== 'opcr_evaluator' && !txn?.is_locked



  const handleOverrideSubmit = async () => {
    if (!txn || !user || !overrideTimeIn || !overrideReason.trim()) return
    setSubmittingOverride(true)
    try {
      const isoTimeIn = new Date(overrideTimeIn).toISOString()
      const updated = await overrideTimeInApi(
        txn.id,
        isoTimeIn,
        overrideReason.trim(),
        null,
        user
      )
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      setOverrideModalOpen(false)
      setOverrideReason('')
      showResult({
        type: 'success',
        title: 'Time-In Overridden',
        message: 'Transaction Time-In and SLA have been updated successfully.',
      })
    } catch (err) {
      showResult({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to override Time-In',
      })
    } finally {
      setSubmittingOverride(false)
    }
  }

  const handleInlineDocUpload = async (file: File) => {
    if (!txn || !user) return
    setUploadingInlineDoc(true)
    try {
      const updated = await uploadOverrideDocumentApi(txn.id, file.name, user)
      setTxn(updated)
      const h = await getTransactionHistoryApi(txn.id)
      setHistory(h)
      showResult({
        type: 'success',
        title: 'Document Uploaded',
        message: 'Supporting document has been attached to the override successfully.',
      })
    } catch (err) {
      showResult({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to upload document',
      })
    } finally {
      setUploadingInlineDoc(false)
    }
  }

  useEffect(() => {
    if (!id) return
    
    setLoading(true)

    Promise.all([
      getTransactionApi(id),
      getTransactionHistoryApi(id),
    ])
      .then(([t, h]) => {
        setTxn(t)
        setHistory(h)

        // Fetch users separately so a backend failure doesn't break the whole page
        getUsersApi(user?.office_id)
          .then((users) => {
            setOfficeUsers(users.filter((u) => u.role !== 'opcr_evaluator'))
          })
          .catch((err) => {
            console.warn('Failed to load office users. Real backend might be down.', err)
            setOfficeUsers([])
          })
      })
      .catch((err) => {
        console.error('Failed to load transaction:', err)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  // Trigger Status Update Confirm
  function triggerStatusUpdate(newStatus: TransactionStatus) {
    confirm({
      title: 'Confirm Status Update',
      message: `Are you sure you want to mark this transaction as ${newStatus.replace('_', ' ')}?`,
      confirmText: 'Confirm',
      onConfirm: async () => {
        if (!txn || !user) return
        setUpdating(true)
        try {
          const updated = await updateTransactionStatusApi(
            txn.id,
            { 
              status: newStatus, 
              remarks: statusRemarks || undefined,
              override_document_name: completionFile ? completionFile.name : undefined
            },
            user
          )
          setTxn(updated)
          const h = await getTransactionHistoryApi(txn.id)
          setHistory(h)
          setStatusRemarks('')
          setCompletionFile(null)
          showResult({
            type: 'success',
            title: 'Success!',
            message: `Status updated to ${newStatus.replace('_', ' ')} successfully.`,
          })
        } catch (err) {
          showResult({
            type: 'error',
            title: 'Error',
            message: err instanceof Error ? err.message : 'Failed to update status',
          })
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  // Trigger Documentary Status Update Confirm
  function triggerDocStatusUpdate(newStatus: DocumentaryStatus) {
    confirm({
      title: 'Confirm Documentary Status Update',
      message: `Are you sure you want to change the documentary status to ${newStatus}?`,
      confirmText: 'Confirm',
      onConfirm: async () => {
        if (!txn || !user) return
        setUpdating(true)
        try {
          const updated = await updateDocumentaryStatusApi(
            txn.id,
            { documentary_status: newStatus, remarks: docRemarks || undefined },
            user
          )
          setTxn(updated)
          const h = await getTransactionHistoryApi(txn.id)
          setHistory(h)
          setDocRemarks('')
          showResult({
            type: 'success',
            title: 'Success!',
            message: 'Documentary status updated successfully.',
          })
        } catch (err) {
          showResult({
            type: 'error',
            title: 'Error',
            message: err instanceof Error ? err.message : 'Failed to update documentary status',
          })
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  // Reassignment handlers
  function handleAssignSelection(userId: string) {
    if (!txn) return
    if (userId === txn.assigned_to) return
    const assignee = officeUsers.find((u) => u.id === userId)
    if (!assignee) return
    const previousAssignee = txn.assigned_to_name ?? 'Unassigned'
    confirm({
      title: 'Confirm Reassignment',
      message: `Are you sure you want to reassign this transaction from ${previousAssignee} to ${assignee.name}?`,
      confirmText: 'Confirm',
      onConfirm: async () => {
        if (!txn || !user) return
        setUpdating(true)
        try {
          const updated = await assignTransactionApi(txn.id, assignee.id, user)
          setTxn(updated)
          const h = await getTransactionHistoryApi(txn.id)
          setHistory(h)
          showResult({
            type: 'success',
            title: 'Success!',
            message: `Reassignment complete: ${previousAssignee} → ${assignee.name}`,
          })
        } catch (err) {
          showResult({
            type: 'error',
            title: 'Error',
            message: err instanceof Error ? err.message : 'Failed to reassign',
          })
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  function getHistoryLabel(item: TransactionStatusHistory) {
    switch (item.action_type) {
      case 'CREATE':         return 'Transaction Created'
      case 'STATUS_CHANGE':  return `Status Changed`
      case 'ASSIGNMENT':     return 'Assignee Updated'
      case 'DOCUMENTARY_CHANGE': return 'Documentary Status Updated'
      case 'REMARKS_UPDATE': return 'Remarks Updated'
      default:               return item.remarks ?? 'Log Entry'
    }
  }

  const ACTION_ICON: Record<ActionType, typeof PlusCircle> = {
    CREATE:             PlusCircle,
    STATUS_CHANGE:      RefreshCw,
    ASSIGNMENT:         UserCheck,
    DOCUMENTARY_CHANGE: FileText,
    REMARKS_UPDATE:     MessageSquare,
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', height: '256px' }}>
        <Box 
          sx={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '4px solid #580000',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            }
          }}
        />
      </Box>
    )
  }

  if (!txn) return <Typography sx={{ p: 3, color: 'text.secondary' }}>Transaction not found.</Typography>

  const nextStatus: TransactionStatus | null = txn.status === 'pending'
    ? 'in_progress'
    : txn.status === 'in_progress'
    ? 'completed'
    : null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Button
            component={Link}
            to="/transactions"
            variant="outlined"
            startIcon={<ArrowLeft style={{ width: 16, height: 16 }} />}
            sx={{
              borderColor: 'divider',
              color: '#580000',
              fontWeight: 700,
              bgcolor: 'white',
              px: 2.5,
              py: 1,
              borderRadius: '20px',
              textTransform: 'none',
              boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
              mb: 2,
              '&:hover': {
                borderColor: '#580000',
                bgcolor: 'rgba(88,0,0,0.02)'
              }
            }}
          >
            Back to Transactions
          </Button>
        </Box>

        {/* Locked Notice */}
        {txn.is_locked && (
          <Alert severity="info" icon={<Lock style={{ width: 18, height: 18 }} />} sx={{ borderRadius: '12px', bgcolor: '#E6F1FB', border: '1px solid rgba(27, 58, 107, 0.15)', color: '#1B3A6B' }}>
            This transaction is <strong>completed</strong> and is now read-only.
          </Alert>
        )}

        {/* Breach Warning */}
        {txn.is_sla_breached && (
          <Alert severity="error" icon={<AlertTriangle style={{ width: 18, height: 18 }} />} sx={{ borderRadius: '12px', bgcolor: '#FCEBEB', border: '1px solid rgba(226, 75, 74, 0.15)', color: '#E24B4A' }}>
            SLA Breached — actual duration exceeded the {formatDuration(txn.sla_target_seconds)} target.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Service Info Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
              <CardHeader 
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                    Service Information
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '18px', fontWeight: 700, color: 'text.primary' }}>
                    {txn.service_name}
                  </Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    {txn.service_category} · {txn.office_name}
                  </Typography>
                </Box>
                
                <Divider />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Client</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.client_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Client Type</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.client_type || '—'}</Typography>
                  </Grid>
                  
                  {txn.student_number && (
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Student Number</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.student_number}</Typography>
                    </Grid>
                  )}
                  {txn.course && (
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Course</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.course}</Typography>
                    </Grid>
                  )}
                  {txn.year_level && (
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Year Level</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.year_level}</Typography>
                    </Grid>
                  )}
                  {txn.contact_number && (
                    <Grid size={{ xs: 6 }}>
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Contact Number</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.contact_number}</Typography>
                    </Grid>
                  )}
                  {txn.organization && (
                    <Grid size={{ xs: 12 }}>
                      <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Organization / Institution</Typography>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.organization}</Typography>
                    </Grid>
                  )}



                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Created By</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{txn.created_by_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}></Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Time In</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Clock style={{ width: 14, height: 14, color: '#6b7280' }} />
                      {formatDateTime(txn.time_in)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>Time Out</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Clock style={{ width: 14, height: 14, color: '#6b7280' }} />
                      {txn.time_out ? formatDateTime(txn.time_out) : <span style={{ color: '#6b7280', fontStyle: 'italic', fontWeight: 400 }}>Auto on completion</span>}
                    </Typography>
                  </Grid>
                  {txn.remarks && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, bgcolor: '#F5F7FA', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Remarks</Typography>
                        <Typography sx={{ fontSize: '13.5px', color: 'text.primary' }}>{txn.remarks}</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Status Flow Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
              <CardHeader 
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                    Transaction Status
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, maxWidth: '420px', width: '100%', mx: 'auto', pt: 1 }}>
                  <StatusStep status="pending" current={txn.status} completed={txn.status === 'completed'} />
                  <StatusStep status="in_progress" current={txn.status} completed={txn.status === 'completed'} />
                  <StatusStep status="completed" current={txn.status} completed={txn.status === 'completed'} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Current Status:</Typography>
                  <StatusBadge status={txn.status} />
                </Box>

                {canModify && nextStatus && (
                  <Box sx={{ pt: 2, borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <InputLabel sx={{ fontSize: '12px', color: 'text.secondary' }}>Remarks for status change (Optional)</InputLabel>
                      <Typography sx={{ fontSize: '10px', color: 'text.secondary' }}>{statusRemarks.length} / 255</Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Optional status remarks…"
                      value={statusRemarks}
                      onChange={(e) => {
                        if (e.target.value.length <= 255) {
                          setStatusRemarks(e.target.value)
                        }
                      }}
                    />

                    {nextStatus === 'completed' && txn.is_overridden && !txn.override_document_name && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, p: 2, bgcolor: '#FCEBEB', border: '1px solid rgba(226, 75, 74, 0.15)', borderRadius: '8px' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AlertTriangle style={{ width: 14, height: 14 }} />
                          Supporting Document Required
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#E24B4A', lineHeight: 1.3 }}>
                          This transaction has a Time-In override. You must upload a supporting document to mark it as completed.
                        </Typography>
                        <Box 
                          sx={{
                            border: '2px dashed #E24B4A',
                            borderRadius: '8px',
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            bgcolor: 'rgba(226, 75, 74, 0.02)',
                            '&:hover': { bgcolor: 'rgba(226, 75, 74, 0.05)' }
                          }}
                        >
                          <input
                            type="file"
                            id="completion-doc-upload"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              cursor: 'pointer',
                            }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setCompletionFile(e.target.files[0])
                              }
                            }}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <FileUp style={{ width: 24, height: 24, color: '#E24B4A', margin: '0 auto 6px' }} />
                          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#E24B4A' }}>
                            {completionFile ? completionFile.name : 'Select supporting document...'}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Button
                      onClick={() => triggerStatusUpdate(nextStatus)}
                      disabled={updating || (nextStatus === 'completed' && txn.is_overridden && !txn.override_document_name && !completionFile)}
                      variant="contained"
                      sx={{
                        bgcolor: nextStatus === 'completed' ? '#1D9E75' : '#580000',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        width: 'fit-content',
                        px: 3,
                        '&:hover': {
                          bgcolor: nextStatus === 'completed' ? '#15805d' : '#7a0c0c',
                        },
                        '&:disabled': {
                          bgcolor: '#E5E7EB',
                          color: '#9CA3AF'
                        }
                      }}
                      startIcon={nextStatus === 'in_progress' ? <RotateCcw style={{ width: 16, height: 16 }} /> : <CheckCircle2 style={{ width: 16, height: 16 }} />}
                    >
                      {nextStatus === 'in_progress' ? 'Mark as In Progress' : 'Mark as Completed'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Documentary Status Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
              <CardHeader 
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                    Documentary Status
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#F5F7FA', borderRadius: '8px', border: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
                  <DocumentaryBadge status={txn.documentary_status} />
                  {txn.remarks && (
                    <>
                      <Typography sx={{ color: 'divider', fontWeight: 600 }}>|</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'text.secondary' }}>Remarks:</Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 500, color: 'text.primary' }}>{txn.remarks}</Typography>
                    </>
                  )}
                </Box>

                {canModify && (
                  <Box sx={{ pt: 2, borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <InputLabel sx={{ fontSize: '12px', color: 'text.secondary' }}>Update Status</InputLabel>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(['complete', 'incomplete', 'for_compliance'] as DocumentaryStatus[]).map((s) => (
                          <Button
                            key={s}
                            variant={txn.documentary_status === s ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => triggerDocStatusUpdate(s)}
                            disabled={updating || txn.documentary_status === s}
                            sx={{
                              textTransform: 'none',
                              fontSize: '12px',
                              fontWeight: 600,
                              px: 2,
                              borderColor: '#580000',
                              color: txn.documentary_status === s ? 'white' : '#580000',
                              bgcolor: txn.documentary_status === s ? '#580000' : 'transparent',
                              '&:hover': {
                                bgcolor: txn.documentary_status === s ? '#580000' : 'rgba(88,0,0,0.02)',
                                borderColor: '#580000',
                              }
                            }}
                          >
                            {s === 'complete' ? 'Complete' : s === 'incomplete' ? 'Incomplete' : 'For Compliance'}
                          </Button>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <InputLabel sx={{ fontSize: '12px', color: 'text.secondary' }}>Documentary Remarks (Optional)</InputLabel>
                        <Typography sx={{ fontSize: '10px', color: 'text.secondary' }}>{docRemarks.length} / 255</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Remarks (e.g. missing attachment)..."
                        value={docRemarks}
                        onChange={(e) => {
                          if (e.target.value.length <= 255) {
                            setDocRemarks(e.target.value)
                          }
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Assignment Card */}
            {canModify && (
              <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
                <CardHeader 
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                      Assignment
                    </Typography>
                  }
                  sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
                />
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <User2 style={{ width: 16, height: 16, color: '#6b7280' }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                      {txn.assigned_to_name ?? <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#6b7280' }}>Unassigned</span>}
                    </Typography>
                  </Box>
                  <Box sx={{ maxWidth: '240px', width: '100%' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Reassign to</InputLabel>
                      <Select
                        value={txn.assigned_to ?? ''}
                        onChange={(e) => handleAssignSelection(e.target.value as string)}
                        disabled={updating}
                        label="Reassign to"
                      >
                        {officeUsers.map((u) => (
                          <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar — SLA + Timeline */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* SLA Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: txn.is_sla_breached ? 'rgba(226, 75, 74, 0.3)' : '#E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
              <CardHeader 
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                    SLA Compliance
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
              />
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <SLABadge status={txn.sla_status} isBreached={txn.is_sla_breached} />

                {txn.is_overridden && (
                  <Box sx={{ p: 2, bgcolor: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '8px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography sx={{ fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '12px' }}>
                      <ShieldAlert style={{ width: 14, height: 14, color: '#2563EB' }} />
                      Time-In Override Info
                    </Typography>
                    <Typography sx={{ fontSize: '11.5px', color: '#1E3A8A' }}>
                      <span style={{ fontWeight: 600 }}>Reason:</span> {txn.override_reason}
                    </Typography>
                    {txn.original_time_in && (
                      <Typography sx={{ fontSize: '11.5px', color: '#1E3A8A' }}>
                        <span style={{ fontWeight: 600 }}>Original Time In:</span> {formatDateTime(txn.original_time_in)}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: '11.5px', color: '#1E3A8A' }}>
                      <span style={{ fontWeight: 600 }}>Corrected Time In:</span> {formatDateTime(txn.time_in)}
                    </Typography>

                    <Box sx={{ borderTop: '1px dashed rgba(37, 99, 235, 0.15)', pt: 1, mt: 0.5 }}>
                      {txn.override_document_name ? (
                        <Typography sx={{ fontSize: '11.5px', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FileText style={{ width: 12, height: 12, color: '#3B82F6' }} />
                          <span style={{ fontWeight: 600 }}>Document:</span>
                          <span style={{ textDecoration: 'underline', fontWeight: 500 }}>{txn.override_document_name}</span>
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography sx={{ fontSize: '11px', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AlertTriangle style={{ width: 12, height: 12, color: '#D97706' }} />
                            Missing supporting document
                          </Typography>
                          {!txn.is_locked && (
                            <Box sx={{ position: 'relative' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                component="label"
                                disabled={uploadingInlineDoc}
                                startIcon={<FileUp style={{ width: 12, height: 12 }} />}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '10.5px',
                                  py: 0.5,
                                  px: 1.5,
                                  borderColor: '#2563EB',
                                  color: '#2563EB',
                                  '&:hover': {
                                    borderColor: '#1D4ED8',
                                    bgcolor: 'rgba(37, 99, 235, 0.05)'
                                  }
                                }}
                              >
                                {uploadingInlineDoc ? 'Uploading...' : 'Upload Document Now'}
                                <input
                                  type="file"
                                  hidden
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleInlineDocUpload(e.target.files[0])
                                    }
                                  }}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '13.5px', pt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '13.5px' }}>SLA Target</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '13.5px' }}>{formatDuration(txn.sla_target_seconds)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '13.5px' }}>Actual Time</Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '13.5px' }}>
                      {txn.processing_time_seconds !== null ? formatDuration(txn.processing_time_seconds) : '—'}
                    </Typography>
                  </Box>
                  
                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '13.5px' }}>Variance</Typography>
                    <Typography sx={{ fontWeight: 700, color: txn.is_sla_breached ? '#E24B4A' : '#1D9E75', fontSize: '13.5px' }}>
                      {slaVariance(txn)}
                    </Typography>
                  </Box>
                </Box>

                {txn.sla_status === 'pending_computation' && (
                  <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', borderTop: '1px solid #F3F4F6', pt: 1.5, lineHeight: 1.5 }}>
                    SLA will be computed and submitted to PSS when this transaction is completed (EMS-010).
                  </Typography>
                )}
                {txn.sla_status !== 'pending_computation' && txn.sla_status !== 'overridden' && (
                  <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', borderTop: '1px solid #F3F4F6', pt: 1.5, lineHeight: 1.5 }}>
                    Classification is automated and immutable (EMS-011).
                  </Typography>
                )}
                {txn.sla_status === 'overridden' && (
                  <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', borderTop: '1px solid #F3F4F6', pt: 1.5, lineHeight: 1.5 }}>
                    This transaction SLA has been manually overridden by administrative authorization.
                  </Typography>
                )}

                {canModify && (
                  <Box sx={{ pt: 2, borderTop: '1px solid #F3F4F6', mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => {
                        setOverrideTimeIn(formatToLocalDatetimeString(txn.time_in))
                        setOverrideModalOpen(true)
                      }}
                      startIcon={<ShieldAlert style={{ width: 14, height: 14 }} />}
                      sx={{
                        textTransform: 'none',
                        borderColor: 'rgba(88,0,0,0.3)',
                        color: '#580000',
                        fontSize: '12px',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#580000',
                          bgcolor: 'rgba(88,0,0,0.03)',
                        }
                      }}
                    >
                      {txn.is_overridden ? 'Adjust Time-In Override' : 'Manual Time-In Override'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Audit Timeline Card */}
            <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', bgcolor: 'white' }}>
              <CardHeader 
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#580000' }}>
                    Audit Timeline
                  </Typography>
                }
                sx={{ borderBottom: '1px solid #F3F4F6', py: 2, px: 3 }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ position: 'relative', pl: 1 }}>
                  {/* Vertical timeline line */}
                  <Box sx={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '1px', bgcolor: 'divider' }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {history.map((h) => {
                      const Icon = ACTION_ICON[h.action_type] ?? RotateCcw
                      const hasValueChange = (h.old_value !== null || h.new_value !== null) && h.action_type !== 'CREATE'
                      return (
                        <Box key={h.id} sx={{ position: 'relative', pl: 3.5 }}>
                          {/* Bullet dot */}
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            bgcolor: 'background.paper',
                            border: '2px solid #580000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                          }}>
                            <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', bgcolor: '#580000' }} />
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {/* Action Row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Icon style={{ width: 14, height: 14, color: '#64748B', flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: 'text.primary' }}>
                                {getHistoryLabel(h)}
                              </Typography>
                              <Chip
                                label={h.action_type.replace(/_/g, ' ')}
                                size="small"
                                sx={{
                                  fontSize: '9px',
                                  height: '16px',
                                  fontWeight: 700,
                                  bgcolor: 'rgba(88,0,0,0.06)',
                                  color: '#580000',
                                  border: '1px solid rgba(88,0,0,0.12)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                }}
                              />
                            </Box>

                            {/* Actor & Date */}
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                              {h.changed_by_name} · {formatDateTime(h.changed_at)}
                            </Typography>

                            {/* Value Change Box */}
                            {hasValueChange && (
                              <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '11px', color: 'text.secondary', fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider', borderRadius: '4px', px: 1.2, py: 0.5, mt: 0.5, width: 'fit-content' }}>
                                {h.old_value ?? '—'} <span style={{ color: 'rgba(88,0,0,0.7)', margin: '0 6px' }}>→</span> {h.new_value ?? '—'}
                              </Box>
                            )}

                            {h.documentary_old !== h.documentary_new && h.action_type === 'DOCUMENTARY_CHANGE' && (
                              <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontStyle: 'italic' }}>
                                Docs: {h.documentary_old ?? '—'} → {h.documentary_new}
                              </Typography>
                            )}

                            {h.remarks && h.action_type !== 'CREATE' && (
                              <Typography sx={{ fontSize: '12px', color: 'text.secondary', fontStyle: 'italic', mt: 0.5, bgcolor: 'rgba(0,0,0,0.02)', p: 1, borderRadius: '4px', border: '1px solid', borderColor: 'divider', width: '100%' }}>
                                {h.remarks}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Time-In Manual Override Modal */}
      <Dialog 
        open={overrideModalOpen} 
        onClose={() => setOverrideModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: '16px', p: { xs: 2.5, sm: 3 } }
          }
        }}
      >
        <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 700, fontSize: '18px', color: '#580000', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldAlert style={{ width: 20, height: 20, color: '#580000' }} />
          Authorize Manual Time-In Override
        </DialogTitle>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11.5px', color: 'text.secondary', lineHeight: 1.4 }}>
            Manually override this transaction's Time In. This action requires a corrected Time-In timestamp, a strict justification reason, and an optional supporting document upload (which can also be supplied later upon completion).
          </Typography>
        </Box>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <InputLabel sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>Corrected Time In *</InputLabel>
            <TextField
              fullWidth
              type="datetime-local"
              value={overrideTimeIn}
              onChange={(e) => setOverrideTimeIn(e.target.value)}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <InputLabel sx={{ fontSize: '12px', fontWeight: 700, color: 'text.primary' }}>Justification Reason *</InputLabel>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Explain why this transaction's Time In should be manually overridden (e.g. system lag, forgotten log, printing delays)..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
          </Box>

        </DialogContent>

        <DialogActions sx={{ p: 0, pt: 3, gap: 1, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => setOverrideModalOpen(false)} sx={{ textTransform: 'none', px: 2, borderColor: 'divider', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleOverrideSubmit}
            disabled={submittingOverride || !overrideTimeIn || !overrideReason.trim()}
            variant="contained"
            sx={{
              bgcolor: '#580000',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              '&:hover': { bgcolor: '#7a0c0c' }
            }}
          >
            {submittingOverride ? 'Saving Override...' : 'Confirm Time-In Override'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
