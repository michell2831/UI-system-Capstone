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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'

const T = {
  blue: '#3B82F6',
  slate400: '#94A3B8',
  green: '#22C55E',
  red: '#E24B4A',
  maroon: '#580000',
}

function InteractiveCard({
  className,
  style,
  accentColor,
  children,
}: {
  className?: string
  style?: React.CSSProperties
  accentColor: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("transition-all duration-300 ease-in-out", className)}
      style={{
        ...style,
        borderTop: `4px solid ${accentColor}`,
        boxShadow: hovered
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {children}
    </Card>
  )
}

function StatCard({
  title, value, sub, icon: Icon, variant = 'default', accentColor,
}: {
  title: string
  value: string | number
  sub?: string
  icon: ElementType
  variant?: 'default' | 'danger' | 'success' | 'warning'
  accentColor: string
}) {
  const [hovered, setHovered] = useState(false)
  const colors = {
    default: 'text-primary bg-primary/10',
    danger: 'text-destructive bg-destructive/10',
    success: 'text-success bg-success/10',
    warning: 'text-muted-foreground bg-muted',
  }
  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="transition-all duration-300 ease-in-out"
      style={{
        borderTop: `4px solid ${accentColor}`,
        boxShadow: hovered
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={cn('p-2.5 rounded-lg', colors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
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
      // EMS-012: breached transactions
      setBreaches(txns.filter((t) => t.is_sla_breached))
      // Most recent 5
      setRecent(txns.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <TopBar />

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Page Title */}
        <div>
          <h2 className="page-title text-2xl !text-black font-bold">Dashboard</h2>
          <p className="text-xs !text-black mt-0.5">Overview — {user?.office_name}</p>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Transactions"
            value={stats?.total_transactions ?? 0}
            icon={ClipboardList}
            accentColor={T.maroon}
          />
          <StatCard
            title="In Progress"
            value={stats?.in_progress ?? 0}
            sub={`${stats?.pending ?? 0} pending`}
            icon={Activity}
            accentColor={T.blue}
            variant="warning"
          />
          <StatCard
            title="Compliance Rate"
            value={`${stats?.compliance_rate ?? 0}%`}
            sub={`${stats?.compliant ?? 0} compliant`}
            icon={TrendingUp}
            accentColor={T.green}
            variant="success"
          />
          <StatCard
            title="SLA Breaches"
            value={stats?.sla_breach_count ?? 0}
            sub="needs attention"
            icon={AlertTriangle}
            accentColor={T.red}
            variant="danger"
          />
        </div>

        {/* SLA Summary Row */}
        <div className="grid grid-cols-3 gap-4">
          <InteractiveCard className="border-success/20" accentColor={T.green}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">{stats?.compliant ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Compliant</p>
                </div>
              </div>
            </CardContent>
          </InteractiveCard>
          <InteractiveCard className="border-destructive/20" accentColor={T.red}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats?.non_compliant ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Non-Compliant</p>
                </div>
              </div>
            </CardContent>
          </InteractiveCard>
          <InteractiveCard className="border-border" accentColor={T.slate400}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.pending_computation ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pending SLA</p>
                </div>
              </div>
            </CardContent>
          </InteractiveCard>
        </div>

        {/* SLA Breaches — EMS-012 */}
        {breaches.length > 0 && (
          <InteractiveCard className="border-destructive/30" accentColor={T.red}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                SLA Breached Transactions ({breaches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                {breaches.map((t) => (
                  <Link
                    key={t.id}
                    to={`/transactions/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-md row-breach hover:bg-destructive/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.service_name}</p>
                      <p className="text-xs text-muted-foreground">{t.client_name} · {t.office_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {t.processing_time_seconds !== null && (
                        <span className="text-xs text-destructive font-medium">
                          {formatDuration(t.processing_time_seconds)} / {formatDuration(t.sla_target_seconds)}
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </InteractiveCard>
        )}

        {/* Recent Transactions */}
        <Card
          style={{
            borderTop: `4px solid ${T.maroon}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Link to="/transactions" className="text-lg text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-0">
              {recent.map((t, i) => (
                <Link
                  key={t.id}
                  to={`/transactions/${t.id}`}
                  className={cn(
                    'flex items-center gap-4 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors',
                    i < recent.length - 1 && 'border-b border-border',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.service_name}</p>
                    <p className="text-xs text-muted-foreground">{t.client_name} · {formatDateTime(t.time_in)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={t.status} />
                    <DocumentaryBadge status={t.documentary_status} />
                    <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
