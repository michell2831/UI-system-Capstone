import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, ArrowRight, Building2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi, getServicesApi } from '@/api/mockApi'
import type { Transaction, Service, TransactionStatus } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { 
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel, 
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, InputAdornment, Chip 
} from '@mui/material'

type FilterStatus = 'all' | TransactionStatus

export function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)

  const isReadOnly = user?.role === 'opcr_evaluator'

  useEffect(() => {
    const officeId = user?.office_id
    Promise.all([
      getTransactionsApi(officeId),
      getServicesApi(user?.office_id),
    ]).then(([txns, svcs]) => {
      setTransactions(txns)
      setServices(svcs)
    }).finally(() => setLoading(false))
  }, [user])

  const filtered = transactions.filter((t) => {
    const matchSearch = search === '' ||
      t.service_name.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Page Title */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#0F172A', fontWeight: 500 }}>
              Service Transactions
            </Typography>
            {user?.office_name && (
              <Chip
                icon={<Building2 style={{ width: 12, height: 12 }} />}
                label={user.office_name}
                size="small"
                sx={{
                  bgcolor: 'rgba(88, 0, 0, 0.08)',
                  color: '#580000',
                  borderColor: 'rgba(88, 0, 0, 0.2)',
                  border: '1px solid',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
            {user?.role === 'opcr_evaluator' && (
              <Chip
                icon={<ShieldCheck style={{ width: 12, height: 12 }} />}
                label="All Offices · Read-only"
                size="small"
                sx={{
                  bgcolor: '#FFFBEB',
                  color: '#B45309',
                  borderColor: '#FDE68A',
                  border: '1px solid',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '12px' }}>
            {user?.role === 'opcr_evaluator'
              ? 'Viewing transactions across all offices (OPCR Evaluator access).'
              : `Office-scoped view — only transactions from ${user?.office_name ?? 'your office'} are visible.`}
          </Typography>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, flex: 1 }}>
            <TextField
              sx={{ width: { xs: '100%', sm: '350px' }, bgcolor: 'white' }}
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

            <FormControl sx={{ width: { xs: '100%', sm: '160px' }, bgcolor: 'white' }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                label="Status"
                startAdornment={
                  <InputAdornment position="start">
                    <Filter style={{ width: 16, height: 16, color: '#6b7280' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {!isReadOnly && (
            <Button
              variant="contained"
              onClick={() => setCreateOpen(true)}
              startIcon={<Plus style={{ width: 16, height: 16 }} />}
              sx={{
                bgcolor: '#580000',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                height: '40px',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { bgcolor: '#7a0c0c' }
              }}
            >
              New Transaction
            </Button>
          )}
        </Box>

        {/* Counts */}
        <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
          Showing {filtered.length} of {transactions.length} transactions
          {isReadOnly && ' · Read-only (OPCR Evaluator)'}
        </Typography>

        {/* Table */}
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
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Table sx={{ minWidth: { xs: 'auto', md: 650 } }}>
              <TableHead sx={{ bgcolor: '#580000' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>Service</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>Client</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Time In</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Assigned To</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', sm: 'table-cell' } }}>Documents</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>SLA</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Duration</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((t) => {
                  const isBreached = t.is_sla_breached
                  const rowBg = isBreached ? 'rgba(226, 75, 74, 0.03)' : 'inherit'
                  const borderStyle = isBreached ? '4px solid #E24B4A' : 'inherit'
                  return (
                    <TableRow
                      key={t.id}
                      sx={{
                        bgcolor: rowBg,
                        '& > td:first-of-type': { borderLeft: borderStyle },
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'text.primary', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.service_name}>
                          {t.service_name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>{t.service_category}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13.5px', color: 'text.primary' }}>{t.client_name}</TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(t.time_in)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
                        {t.assigned_to_name ?? <Typography component="span" sx={{ fontStyle: 'italic', fontSize: '12px', color: 'text.secondary' }}>Unassigned</Typography>}
                      </TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><DocumentaryBadge status={t.documentary_status} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                        {t.processing_time_seconds !== null
                          ? formatDuration(t.processing_time_seconds)
                          : '—'}
                        {' '}/ {formatDuration(t.sla_target_seconds)}
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          to={`/transactions/${t.id}`}
                          variant="text"
                          size="small"
                          endIcon={<ArrowRight style={{ width: 12, height: 12 }} />}
                          sx={{
                            color: '#580000',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '12px',
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <TransactionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        services={services}
        currentUser={user}
        onCreated={(transaction) => setTransactions((prev) => [transaction, ...prev])}
      />
    </Box>
  )
}
