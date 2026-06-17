import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, ArrowRight, Building2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi, getServicesApi } from '@/api/mockApi'
import type { Transaction, Service, TransactionStatus } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'

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
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <TopBar />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Page Title — EMS-014: office name prominently displayed */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="page-title text-2xl">Service Transactions</h2>
            {user?.office_name && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 text-xs font-semibold">
                <Building2 className="h-3 w-3" />
                {user.office_name}
              </span>
            )}
            {user?.role === 'opcr_evaluator' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 text-xs font-semibold">
                <ShieldCheck className="h-3 w-3" />
                All Offices · Read-only
              </span>
            )}
          </div>
          {/* EMS-013: office-scoped data isolation confirmation */}
          <p className="text-xs text-muted-foreground mt-1">
            {user?.role === 'opcr_evaluator'
              ? 'Viewing transactions across all offices (OPCR Evaluator access).'
              : `Office-scoped view — only transactions from ${user?.office_name ?? 'your office'} are visible.`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#580000] placeholder:text-muted-foreground/60 transition-all h-14 md:h-12"
              />
            </div>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-40 h-14 md:h-12 bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isReadOnly && (
            <Button onClick={() => setCreateOpen(true)} className="bg-[#580000] text-white hover:bg-[#7a0c0c] h-14 md:h-12 px-5 font-semibold shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              New Transaction
            </Button>
          )}
        </div>

        {/* Counts */}
        <p className="text-base text-muted-foreground">
          Showing {filtered.length} of {transactions.length} transactions
          {isReadOnly && ' · Read-only (OPCR Evaluator)'}
        </p>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto overflow-hidden rounded-[10px] border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-base font-bold">Service</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Client</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Time In</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Assigned To</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Status</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Documents</th>
                      <th className="text-left px-4 py-3 text-base font-bold">SLA</th>
                      <th className="text-left px-4 py-3 text-base font-bold">Duration</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        className={cn(
                          'border-b border-border last:border-0',
                          t.is_sla_breached && 'row-breach',
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground truncate max-w-[200px]" title={t.service_name}>
                            {t.service_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.service_category}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">{t.client_name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.time_in)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {t.assigned_to_name ?? <span className="italic text-xs">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3"><DocumentaryBadge status={t.documentary_status} /></td>
                        <td className="px-4 py-3">
                          <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {t.processing_time_seconds !== null
                            ? formatDuration(t.processing_time_seconds)
                            : '—'}
                          {' '}/ {formatDuration(t.sla_target_seconds)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/transactions/${t.id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TransactionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        services={services}
        currentUser={user}
        onCreated={(transaction) => setTransactions((prev) => [transaction, ...prev])}
      />
    </div>
  )
}
