import { useEffect, useState } from 'react'
import {
  PlusCircle, RefreshCw, UserCheck, FileText, MessageSquare,
  Search, Filter, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getAuditLogApi, getTransactionsApi } from '@/api/mockApi'
import type { TransactionStatusHistory, ActionType, Transaction } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, Chip, Card, CardContent
} from '@mui/material'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL',               label: 'All Actions' },
  { value: 'CREATE',            label: 'Transaction Created' },
  { value: 'STATUS_CHANGE',     label: 'Status Change' },
  { value: 'ASSIGNMENT',        label: 'Assignment' },
  { value: 'DOCUMENTARY_CHANGE', label: 'Documentary Status' },
  { value: 'REMARKS_UPDATE',    label: 'Remarks Updated' },
]

// Mapping to MUI colors / palettes
const ACTION_COLORS: Record<ActionType, { bg: string; color: string; border: string }> = {
  CREATE:             { bg: '#EAF3DE', color: '#1D9E75', border: 'rgba(29, 158, 117, 0.2)' },
  STATUS_CHANGE:      { bg: '#E6F1FB', color: '#1B3A6B', border: 'rgba(27, 58, 107, 0.2)' },
  ASSIGNMENT:         { bg: '#F3E8FF', color: '#7E22CE', border: 'rgba(126, 34, 206, 0.2)' },
  DOCUMENTARY_CHANGE: { bg: '#FFFBEB', color: '#BA7517', border: 'rgba(186, 117, 23, 0.2)' },
  REMARKS_UPDATE:     { bg: '#F1F5F9', color: '#475569', border: 'rgba(71, 85, 105, 0.2)' },
}

const ACTION_ICON: Record<ActionType, typeof PlusCircle> = {
  CREATE:             PlusCircle,
  STATUS_CHANGE:      RefreshCw,
  ASSIGNMENT:         UserCheck,
  DOCUMENTARY_CHANGE: FileText,
  REMARKS_UPDATE:     MessageSquare,
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const { user } = useAuth()

  const [log, setLog]           = useState<TransactionStatusHistory[]>([])
  const [txnMap, setTxnMap]     = useState<Record<string, Transaction>>({})
  const [loading, setLoading]   = useState(true)

  // Filters
  const [search, setSearch]         = useState('')
  const [actionFilter, setAction]   = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [fromDate, setFromDate]     = useState('')
  const [toDate, setToDate]         = useState('')

  // Pagination
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      getAuditLogApi(user?.office_id, { actionType: actionFilter, from: fromDate || undefined, to: toDate || undefined }),
      getTransactionsApi(user?.office_id),
    ]).then(([entries, txns]) => {
      if (!alive) return
      setLog(entries)
      const map: Record<string, Transaction> = {}
      txns.forEach((t) => { map[t.id] = t })
      setTxnMap(map)
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user?.office_id, actionFilter, fromDate, toDate])

  const filtered = log.filter((h) => {
    if (!search) return true
    const q = search.toLowerCase()
    const txn = txnMap[h.transaction_id]
    return (
      h.changed_by_name.toLowerCase().includes(q) ||
      (h.remarks ?? '').toLowerCase().includes(q) ||
      (txn?.client_name ?? '').toLowerCase().includes(q) ||
      (txn?.service_name ?? '').toLowerCase().includes(q) ||
      h.transaction_id.toLowerCase().includes(q)
    )
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page_ = Math.min(page, totalPages)
  const paginated = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#0F172A', fontWeight: 500 }}>
              Audit Log
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '12px' }}>
              Append-only record of all write operations — OPCR & Subsystem Monitoring
            </Typography>
          </Box>
          <Chip
            label={`${total} entries`}
            variant="outlined"
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              bgcolor: 'white',
              borderColor: 'divider'
            }}
          />
        </Box>

        {/* Search + Filter Bar */}
        <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: 'none', bgcolor: 'white' }}>
          <CardContent sx={{ p: '12px !important', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              sx={{ flex: 1, minWidth: '240px', bgcolor: 'white' }}
              size="small"
              placeholder="Search by actor, client, service, remarks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search style={{ width: 16, height: 16, color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }
              }}
            />

            <FormControl sx={{ minWidth: '200px', bgcolor: 'white' }} size="small">
              <InputLabel id="action-filter-label">Action</InputLabel>
              <Select
                labelId="action-filter-label"
                value={actionFilter}
                onChange={(e) => { setAction(e.target.value); setPage(1) }}
                label="Action"
              >
                {ACTION_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<Filter style={{ width: 14, height: 14 }} />}
              endIcon={
                <ChevronDown
                  style={{
                    width: 14,
                    height: 14,
                    transition: 'transform 0.2s',
                    transform: showFilters ? 'rotate(180deg)' : 'none'
                  }}
                />
              }
              sx={{
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.primary',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              Date Range
            </Button>
          </CardContent>

          {showFilters && (
            <CardContent sx={{ px: 2, py: '12px !important', display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', borderTop: '1px solid #E5E7EB' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>From</Typography>
                <TextField
                  type="date"
                  size="small"
                  sx={{ width: { xs: '100%', sm: '160px' }, bgcolor: 'white' }}
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>To</Typography>
                <TextField
                  type="date"
                  size="small"
                  sx={{ width: { xs: '100%', sm: '160px' }, bgcolor: 'white' }}
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1) }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
              {(fromDate || toDate) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
                  sx={{ textTransform: 'none', color: '#580000', fontWeight: 600 }}
                >
                  Clear
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {/* Log Table */}
        <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: 'none', bgcolor: 'white', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Activity Entries
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
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
          ) : paginated.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'text.secondary' }}>
              <Typography sx={{ fontSize: '13.5px' }}>No audit log entries found.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: { xs: 'auto', md: 650 } }}>
                <TableHead sx={{ bgcolor: '#580000' }}>
                  <TableRow>
                     <TableRowCell label="Timestamp" width="160px" sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
                     <TableRowCell label="Action" width="160px" />
                     <TableRowCell label="Transaction" />
                     <TableRowCell label="Actor" width="160px" sx={{ display: { xs: 'none', md: 'table-cell' } }} />
                     <TableRowCell label="Change" width="220px" sx={{ display: { xs: 'none', md: 'table-cell' } }} />
                     <TableRowCell label="Remarks" sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((h) => {
                    const Icon = ACTION_ICON[h.action_type] ?? RefreshCw
                    const colors = ACTION_COLORS[h.action_type] ?? { bg: '#F1F5F9', color: '#475569', border: 'divider' }
                    const txn = txnMap[h.transaction_id]
                    const hasChange = h.old_value !== null || h.new_value !== null

                    return (
                       <TableRow key={h.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' } }}>
                        <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
                          {formatDateTime(h.changed_at)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<Icon style={{ width: 12, height: 12, color: colors.color }} />}
                            label={h.action_type.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              bgcolor: colors.bg,
                              color: colors.color,
                              borderColor: colors.border,
                              border: '1px solid',
                              fontWeight: 600,
                              height: '24px',
                              fontSize: '11px',
                              '& .MuiChip-icon': { color: 'inherit', ml: 1 }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                            {txn?.service_name ?? h.transaction_id}
                          </Typography>
                          {txn && (
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                              {txn.client_name} · #{txn.id}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{h.changed_by_name}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {hasChange ? (
                            <Typography sx={{ fontSize: '11px', fontFamily: 'monospace', color: 'text.secondary' }}>
                              <span style={{ color: '#E24B4A' }}>{h.old_value ?? '—'}</span>
                              <span style={{ color: 'rgba(88,0,0,0.4)', margin: '0 4px' }}>→</span>
                              <span style={{ color: '#1D9E75', fontWeight: 600 }}>{h.new_value ?? '—'}</span>
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontStyle: 'italic' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', color: 'text.secondary', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }} title={h.remarks ?? ''}>
                          {h.remarks ?? '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {!loading && total > PAGE_SIZE && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderTop: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                Showing {((page_ - 1) * PAGE_SIZE) + 1}–{Math.min(page_ * PAGE_SIZE, total)} of {total}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={page_ <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.primary' }}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={page_ >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.primary' }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  )
}

function TableRowCell({ label, width, sx }: { label: string; width?: string; sx?: any }) {
  return (
    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', ...(width && { width }), ...sx }}>
      {label}
    </TableCell>
  )
}
