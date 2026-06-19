import { useEffect, useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Clock, AlertTriangle, TrendingUp,
  CheckCircle2, XCircle, Activity, ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getDashboardStatsApi, getTransactionsApi } from '@/api/mockApi'
import type { DashboardStats, Transaction } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { Box, Typography, Card, CardContent, Grid } from '@mui/material'

const T = {
  blue: '#3B82F6',
  slate400: '#94A3B8',
  green: '#1D9E75',
  red: '#E24B4A',
  maroon: '#580000',
}

interface InteractiveCardProps {
  accentColor: string
  children: React.ReactNode
  borderColor?: string
}

function InteractiveCard({ accentColor, children, borderColor }: InteractiveCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: ElementType
  variant?: 'default' | 'danger' | 'success' | 'warning'
  accentColor: string
}

function StatCard({ title, value, sub, icon: Icon, variant = 'default', accentColor }: StatCardProps) {
  const colors = {
    default: { color: '#580000', bg: 'rgba(88, 0, 0, 0.08)' },
    danger: { color: '#E24B4A', bg: 'rgba(226, 75, 74, 0.08)' },
    success: { color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.08)' },
    warning: { color: '#BA7517', bg: 'rgba(186, 117, 23, 0.08)' },
  }[variant]

  return (
    <Card
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '8px',
        borderTop: `4px solid ${accentColor}`,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: '20px !important' } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, alignSelf: 'stretch' }}>
            <Box>
              <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>
                {title}
              </Typography>
              <Typography sx={{ fontSize: '28px', fontWeight: 700, color: 'text.primary', mt: '4px', lineHeight: 1.1 }}>
                {value}
              </Typography>
            </Box>
            {sub ? (
              <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', mt: '12px', display: 'block' }}>
                {sub}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '11.5px', color: 'transparent', mt: '12px', display: 'block', userSelect: 'none' }}>
                &nbsp;
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1.2, borderRadius: '8px', color: colors.color, bgcolor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon style={{ width: 20, height: 20 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [breaches, setBreaches] = useState<Transaction[]>([])
  const [recent, setRecent] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const officeId = user?.role === 'opcr_evaluator' ? undefined : user?.office_id
    Promise.all([
      getDashboardStatsApi(officeId),
      getTransactionsApi(officeId),
    ]).then(([s, txns]) => {
      setStats(s)
      setBreaches(txns.filter((t) => t.is_sla_breached))
      setRecent(txns.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Page Title */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#0F172A', fontWeight: 500 }}>
              Dashboard
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: '2px', fontSize: '13px' }}>
              Overview — {user?.office_name}
            </Typography>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Transactions"
              value={stats?.total_transactions ?? 0}
              icon={ClipboardList}
              accentColor={T.maroon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="In Progress"
              value={stats?.in_progress ?? 0}
              sub={`${stats?.pending ?? 0} pending`}
              icon={Activity}
              accentColor={T.blue}
              variant="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Compliance Rate"
              value={`${stats?.compliance_rate ?? 0}%`}
              sub={`${stats?.compliant ?? 0} compliant`}
              icon={TrendingUp}
              accentColor={T.green}
              variant="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="SLA Breaches"
              value={stats?.sla_breach_count ?? 0}
              sub="needs attention"
              icon={AlertTriangle}
              accentColor={T.red}
              variant="danger"
            />
          </Grid>
        </Grid>

        {/* SLA Summary Row */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <InteractiveCard accentColor={T.green} borderColor="rgba(29, 158, 117, 0.2)">
              <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle2 style={{ width: 32, height: 32, color: T.green }} />
                  <Box>
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: T.green, lineHeight: 1.1 }}>
                      {stats?.compliant ?? 0}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>
                      Compliant
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </InteractiveCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <InteractiveCard accentColor={T.red} borderColor="rgba(226, 75, 74, 0.2)">
              <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <XCircle style={{ width: 32, height: 32, color: T.red }} />
                  <Box>
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: T.red, lineHeight: 1.1 }}>
                      {stats?.non_compliant ?? 0}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>
                      Non-Compliant
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </InteractiveCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <InteractiveCard accentColor={T.slate400}>
              <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Clock style={{ width: 32, height: 32, color: '#64748B' }} />
                  <Box>
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
                      {stats?.pending_computation ?? 0}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontWeight: 600 }}>
                      Pending SLA
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </InteractiveCard>
          </Grid>
        </Grid>

        {/* SLA Breaches — EMS-012 */}
        {breaches.length > 0 && (
          <InteractiveCard accentColor={T.red} borderColor="rgba(226, 75, 74, 0.3)">
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle style={{ width: 18, height: 18 }} />
                SLA Breached Transactions ({breaches.length})
              </Typography>
            </Box>
            <CardContent sx={{ pt: 1, pb: '20px !important' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {breaches.map((t) => (
                  <Box
                    component={Link}
                    key={t.id}
                    to={`/transactions/${t.id}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: '8px',
                      textDecoration: 'none',
                      bgcolor: 'rgba(226, 75, 74, 0.04)',
                      borderLeft: '4px solid #E24B4A',
                      borderRight: '1px solid rgba(226, 75, 74, 0.1)',
                      borderTop: '1px solid rgba(226, 75, 74, 0.1)',
                      borderBottom: '1px solid rgba(226, 75, 74, 0.1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(226, 75, 74, 0.08)',
                      }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.service_name}
                      </Typography>
                      <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', mt: '2px' }}>
                        {t.client_name} · {t.office_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, shrink: 0, ml: 2 }}>
                      {t.processing_time_seconds !== null && (
                        <Typography sx={{ fontSize: '12px', color: '#E24B4A', fontWeight: 600 }}>
                          {formatDuration(t.processing_time_seconds)} / {formatDuration(t.sla_target_seconds)}
                        </Typography>
                      )}
                      <ArrowRight style={{ width: 16, height: 16, color: '#64748B' }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </InteractiveCard>
        )}

        {/* Recent Transactions */}
        <Card
          sx={{
            borderTop: `4px solid ${T.maroon}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
          }}
        >
          <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Recent Transactions
            </Typography>
            <Box 
              component={Link} 
              to="/transactions" 
              sx={{ 
                fontSize: '13px', 
                color: '#580000', 
                fontWeight: 700,
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              View all <ArrowRight style={{ width: 12, height: 12 }} />
            </Box>
          </Box>
          <CardContent sx={{ pt: 1, pb: '16px !important' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {recent.map((t, i) => (
                <Box
                  component={Link}
                  key={t.id}
                  to={`/transactions/${t.id}`}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 1.5, sm: 0 },
                    py: 2,
                    px: 1.5,
                    borderRadius: '8px',
                    textDecoration: 'none',
                    borderBottom: i < recent.length - 1 ? '1px solid #E5E7EB' : 0,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.02)',
                    }
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.service_name}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: 'text.secondary', mt: '2px' }}>
                      {t.client_name} · {formatDateTime(t.time_in)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' } }}>
                    <StatusBadge status={t.status} />
                    <DocumentaryBadge status={t.documentary_status} />
                    <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
