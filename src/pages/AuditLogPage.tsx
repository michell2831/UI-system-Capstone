/**
 * AuditLogPage — EMS-026
 * Displays an append-only, filterable audit log of all write operations
 * performed on transactions within the logged-in user's office.
 */
import { useEffect, useState } from 'react'
import {
  PlusCircle, RefreshCw, UserCheck, FileText, MessageSquare,
  Search, Filter, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getAuditLogApi, getTransactionsApi } from '@/api/mockApi'
import type { TransactionStatusHistory, ActionType, Transaction } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL',               label: 'All Actions' },
  { value: 'CREATE',            label: 'Transaction Created' },
  { value: 'STATUS_CHANGE',     label: 'Status Change' },
  { value: 'ASSIGNMENT',        label: 'Assignment' },
  { value: 'DOCUMENTARY_CHANGE', label: 'Documentary Status' },
  { value: 'REMARKS_UPDATE',    label: 'Remarks Updated' },
]

const ACTION_COLORS: Record<ActionType, string> = {
  CREATE:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  STATUS_CHANGE:      'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNMENT:         'bg-purple-50 text-purple-700 border-purple-200',
  DOCUMENTARY_CHANGE: 'bg-amber-50 text-amber-700 border-amber-200',
  REMARKS_UPDATE:     'bg-slate-50 text-slate-700 border-slate-200',
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
    <div className="flex flex-col h-full min-h-0">
      <TopBar />

      <div className="flex-1 min-h-0 overflow-auto p-6 bg-[#F5F7FA]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Append-only record of all write operations — EMS-026
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {total} entr{total === 1 ? 'y' : 'ies'}
          </Badge>
        </div>

        {/* Search + Filter Bar */}
        <Card className="rounded-xl border border-border shadow-sm bg-white mb-4">
          <CardContent className="py-3 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Search by actor, client, service, remarks..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>

            <Select value={actionFilter} onValueChange={(v) => { setAction(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Date Range
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </CardContent>

          {showFilters && (
            <CardContent className="pt-0 pb-3 flex gap-4 items-center border-t border-border/60">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground w-8">From</label>
                <Input
                  type="date"
                  className="h-8 text-xs w-40"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground w-4">To</label>
                <Input
                  type="date"
                  className="h-8 text-xs w-40"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1) }}
                />
              </div>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
                >
                  Clear
                </Button>
              )}
            </CardContent>
          )}
        </Card>

        {/* Log Table */}
        <Card className="rounded-xl border border-border shadow-sm bg-white">
          <CardHeader className="pb-0 border-b border-border/80">
            <CardTitle className="text-sm font-semibold text-foreground py-1">
              Activity Entries
            </CardTitle>
          </CardHeader>

          {loading ? (
            <CardContent className="flex justify-center py-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </CardContent>
          ) : paginated.length === 0 ? (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No audit log entries found.
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left text-xs font-bold px-4 py-2.5 w-40">Timestamp</th>
                    <th className="text-left text-xs font-bold px-4 py-2.5 w-36">Action</th>
                    <th className="text-left text-xs font-bold px-4 py-2.5">Transaction</th>
                    <th className="text-left text-xs font-bold px-4 py-2.5 w-36">Actor</th>
                    <th className="text-left text-xs font-bold px-4 py-2.5 w-52">Change</th>
                    <th className="text-left text-xs font-bold px-4 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginated.map((h) => {
                    const Icon = ACTION_ICON[h.action_type] ?? RefreshCw
                    const colorClass = ACTION_COLORS[h.action_type] ?? ''
                    const txn = txnMap[h.transaction_id]
                    const hasChange = h.old_value !== null || h.new_value !== null
                    return (
                      <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(h.changed_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${colorClass}`}>
                            <Icon className="h-3 w-3" />
                            {h.action_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-foreground leading-snug">
                            {txn?.service_name ?? h.transaction_id}
                          </p>
                          {txn && (
                            <p className="text-[11px] text-muted-foreground">
                              {txn.client_name} · #{txn.id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-foreground">{h.changed_by_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          {hasChange ? (
                            <p className="text-[11px] font-mono text-muted-foreground">
                              <span className="text-destructive/80">{h.old_value ?? '—'}</span>
                              <span className="text-primary/60 mx-1">→</span>
                              <span className="text-emerald-700">{h.new_value ?? '—'}</span>
                            </p>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                          {h.remarks ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Showing {((page_ - 1) * PAGE_SIZE) + 1}–{Math.min(page_ * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page_ <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={page_ >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
