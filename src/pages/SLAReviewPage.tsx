import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Filter } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi } from '@/api/mockApi'
import type { Transaction, ServiceCategory } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { SLABadge, StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { slaPercent } from '@/utils/slaUtils'
import { MOCK_SERVICES } from '@/utils/mockData'
import {
  Box, Typography, Card, CardContent, Grid,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, InputAdornment, Button
} from '@mui/material'

const T = {
  maroon: '#580000',
  green:  '#1D9E75',
  red:    '#E24B4A',
  warning: '#BA7517',
}

interface InteractiveCardProps {
  accentColor: string
  children: React.ReactNode
  borderColor?: string
  noHover?: boolean
}

function InteractiveCard({ accentColor, children, borderColor, noHover = false }: InteractiveCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <Card
      onMouseEnter={() => !noHover && setHovered(true)}
      onMouseLeave={() => !noHover && setHovered(false)}
      sx={{
        borderTop: `4px solid ${accentColor}`,
        borderColor: borderColor || 'divider',
        transition: 'all 0.3s ease-in-out',
        boxShadow: hovered
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        borderRadius: '12px',
      }}
    >
      {children}
    </Card>
  )
}

type CategoryFilter = 'all' | ServiceCategory

export function SLAReviewPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [slaFilter, setSlaFilter] = useState<'all' | 'compliant' | 'non_compliant' | 'breached'>('all')

  useEffect(() => {
    const officeId = user?.role === 'opcr_evaluator' ? undefined : user?.office_id
    getTransactionsApi(officeId).then(setTransactions).finally(() => setLoading(false))
  }, [user])

  const completed = transactions.filter((t) => t.status === 'completed')

  const filtered = completed.filter((t) => {
    const matchCat = categoryFilter === 'all' || t.service_category === categoryFilter
    const matchSla = slaFilter === 'all'
      || (slaFilter === 'compliant' && t.sla_status === 'compliant')
      || (slaFilter === 'non_compliant' && t.sla_status === 'non_compliant')
      || (slaFilter === 'breached' && t.is_sla_breached)
    return matchCat && matchSla
  })

  // Aggregate by category
  const categories = Array.from(new Set(completed.map((t) => t.service_category)))
  const categoryStats = categories.map((cat) => {
    const catTxns = completed.filter((t) => t.service_category === cat)
    const compliant = catTxns.filter((t) => t.sla_status === 'compliant').length
    const total = catTxns.length
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 0
    const avgTime = catTxns.reduce((sum, t) => sum + (t.processing_time_seconds ?? 0), 0) / total
    return { cat, total, compliant, rate, avgTime }
  }).sort((a, b) => a.rate - b.rate)

  const allCategories = Array.from(new Set(MOCK_SERVICES.map((s) => s.category))) as ServiceCategory[]

  const complianceRate = completed.length > 0
    ? Math.round((completed.filter((t) => t.sla_status === 'compliant').length / completed.length) * 100)
    : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Title */}
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#0F172A', fontWeight: 500 }}>
            Evaluation Period
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '12px' }}>
            Review active service compliance logs and targets.
          </Typography>
        </Box>

        {/* Summary row */}
        <Grid container spacing={3}>
          {/* Compliance Rate — green */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{
              bgcolor: '#FFFFFF', borderRadius: '8px',
              borderTop: '4px solid #1D9E75', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.2s ease', cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', borderColor: '#D1D5DB' }
            }}>
              <CardContent sx={{ p: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: '20px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, alignSelf: 'stretch' }}>
                    <Box>
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>Compliance Rate</Typography>
                      <Typography sx={{ fontSize: '28px', fontWeight: 700, color: 'text.primary', mt: '4px', lineHeight: 1.1 }}>
                        {complianceRate}%
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: 'transparent', mt: '12px', userSelect: 'none' }}>&nbsp;</Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: '8px', color: '#1D9E75', bgcolor: 'rgba(29,158,117,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp style={{ width: 20, height: 20 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliant — green */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{
              bgcolor: '#FFFFFF', borderRadius: '8px',
              borderTop: '4px solid #1D9E75', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.2s ease', cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', borderColor: '#D1D5DB' }
            }}>
              <CardContent sx={{ p: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: '20px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, alignSelf: 'stretch' }}>
                    <Box>
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>Compliant</Typography>
                      <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1D9E75', mt: '4px', lineHeight: 1.1 }}>
                        {completed.filter((t) => t.sla_status === 'compliant').length}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: 'transparent', mt: '12px', userSelect: 'none' }}>&nbsp;</Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: '8px', color: '#1D9E75', bgcolor: 'rgba(29,158,117,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 style={{ width: 20, height: 20 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Non-Compliant — red */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{
              bgcolor: '#FFFFFF', borderRadius: '8px',
              borderTop: '4px solid #E24B4A', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.2s ease', cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', borderColor: '#D1D5DB' }
            }}>
              <CardContent sx={{ p: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: '20px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, alignSelf: 'stretch' }}>
                    <Box>
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>Non-Compliant</Typography>
                      <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#E24B4A', mt: '4px', lineHeight: 1.1 }}>
                        {completed.filter((t) => t.sla_status === 'non_compliant').length}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: 'transparent', mt: '12px', userSelect: 'none' }}>&nbsp;</Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: '8px', color: '#E24B4A', bgcolor: 'rgba(226,75,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <XCircle style={{ width: 20, height: 20 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SLA Breached — warning orange */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{
              bgcolor: '#FFFFFF', borderRadius: '8px',
              borderTop: '4px solid #BA7517', borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%',
              display: 'flex', flexDirection: 'column',
              transition: 'all 0.2s ease', cursor: 'pointer',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', borderColor: '#D1D5DB' }
            }}>
              <CardContent sx={{ p: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: '20px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, alignSelf: 'stretch' }}>
                    <Box>
                      <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>SLA Breached</Typography>
                      <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#BA7517', mt: '4px', lineHeight: 1.1 }}>
                        {completed.filter((t) => t.is_sla_breached).length}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: 'transparent', mt: '12px', userSelect: 'none' }}>&nbsp;</Typography>
                  </Box>
                  <Box sx={{ p: 1.2, borderRadius: '8px', color: '#BA7517', bgcolor: 'rgba(186,117,23,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: 20, height: 20 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <InteractiveCard accentColor={T.maroon}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Compliance by Category
              </Typography>
            </Box>
            <CardContent sx={{ pt: 1, pb: '24px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {categoryStats.map(({ cat, total, compliant, rate, avgTime }) => {
                const color = rate >= 80 ? T.green : rate >= 50 ? T.warning : T.red
                return (
                  <Box key={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>{cat}</Typography>
                      <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        {compliant}/{total} · avg {formatDuration(Math.round(avgTime))}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: '8px', bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <Box sx={{ width: `${rate}%`, height: '100%', bgcolor: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color, mt: 0.5 }}>
                      {rate}% Compliance
                    </Typography>
                  </Box>
                )
              })}
            </CardContent>
          </InteractiveCard>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, width: '100%' }}>
          <FormControl sx={{ width: { xs: '100%', sm: '200px' }, bgcolor: 'white' }} size="small">
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              label="Category"
              startAdornment={
                <InputAdornment position="start">
                  <Filter style={{ width: 16, height: 16, color: '#6b7280' }} />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All Categories</MenuItem>
              {allCategories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl sx={{ width: { xs: '100%', sm: '200px' }, bgcolor: 'white' }} size="small">
            <InputLabel id="sla-filter-label">SLA Status</InputLabel>
            <Select
              labelId="sla-filter-label"
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as any)}
              label="SLA Status"
              startAdornment={
                <InputAdornment position="start">
                  <Filter style={{ width: 16, height: 16, color: '#6b7280' }} />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All SLA</MenuItem>
              <MenuItem value="compliant">Compliant</MenuItem>
              <MenuItem value="non_compliant">Non-Compliant</MenuItem>
              <MenuItem value="breached">Breached</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" sx={{ color: 'text.secondary', ml: { sm: 'auto' }, fontSize: '12px' }}>
            {filtered.length} completed transactions
          </Typography>
        </Box>

        {/* Table Content */}
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
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <Table sx={{ minWidth: { xs: 'auto', md: 650 } }}>
              <TableHead sx={{ bgcolor: '#580000' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>Service</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>Client</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Time In</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Time Out</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', sm: 'table-cell' } }}>Actual</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>SLA Target</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', sm: 'table-cell' } }}>% Used</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>SLA</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No completed transactions match the filter.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((t) => {
                  const pct = slaPercent(t)
                  const isBreached = t.is_sla_breached
                  const rowBg = isBreached ? 'rgba(226, 75, 74, 0.03)' : 'inherit'
                  const borderStyle = isBreached ? '4px solid #E24B4A' : 'inherit'
                  const progressColor = pct > 100 ? T.red : pct > 80 ? T.warning : T.green

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
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'text.primary', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.service_name}>
                          {t.service_name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>{t.service_category}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13.5px', color: 'text.primary' }}>{t.client_name}</TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDateTime(t.time_in)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                        {t.time_out ? formatDateTime(t.time_out) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', fontStyle: 'normal', fontWeight: 600, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
                        {t.processing_time_seconds !== null ? formatDuration(t.processing_time_seconds) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px', color: 'text.secondary', whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDuration(t.sla_target_seconds)}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '64px', height: '6px', bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', bgcolor: progressColor }} />
                          </Box>
                          <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: progressColor }}>
                            {pct}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><StatusBadge status={t.status} /></TableCell>
                      <TableCell>
                        <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                      </TableCell>
                      <TableCell align="right">
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
    </Box>
  )
}
