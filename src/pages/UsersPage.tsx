import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Plus, ArrowUpDown, Edit, Trash2, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getUsersApi } from '@/api/mockApi'
import type { User, UserRole } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { RoleBadge } from '@/components/shared/StatusBadge'
import { toast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import { useModals } from '@/components/shared/ModalContext'

// Helper to split full name into parts
function parseName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', surname: '' }
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', surname: parts[1] }
  }
  // If there are 3 parts, check for "Dela Cruz" or similar middle names
  if (parts.length === 3) {
    if (['dela', 'del', 'de', 'la'].includes(parts[1].toLowerCase())) {
      return { firstName: parts[0], middleName: parts[1], surname: parts[2] }
    }
    return { firstName: parts[0], middleName: parts[1], surname: parts[2] }
  }
  // 4 or more parts
  return {
    firstName: parts.slice(0, parts.length - 2).join(' '),
    middleName: parts[parts.length - 2],
    surname: parts[parts.length - 1],
  }
}

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Search, Filters & Sorting
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  const [sortField, setSortField] = useState<'firstName' | 'surname' | 'email' | 'role' | 'created_at'>('firstName')
  const [sortAsc, setSortAsc] = useState(true)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // Form Dialog States
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Split Form Fields
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
  const [isActive, setIsActive] = useState(true)

  const { confirm, showResult } = useModals()

  // Load initial list from API
  useEffect(() => {
    getUsersApi().then((data) => {
      setUsers(data)
    }).finally(() => setLoading(false))
  }, [])

  // Action Triggers
  const handleOpenCreate = () => {
    setDialogMode('create')
    setFirstName('')
    setMiddleName('')
    setSurname('')
    setEmail('')
    setRole('staff')
    setIsActive(true)
    setDialogOpen(true)
  }

  const handleOpenEdit = (u: User) => {
    setDialogMode('edit')
    setEditingUserId(u.id)
    const parsed = parseName(u.name)
    setFirstName(parsed.firstName)
    setMiddleName(parsed.middleName)
    setSurname(parsed.surname)
    setEmail(u.email)
    setRole(u.role)
    setIsActive(u.is_active)
    setDialogOpen(true)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !surname.trim() || !email.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }
    confirm({
      title: 'Confirm Action',
      message: `Are you sure you want to ${dialogMode === 'create' ? 'create' : 'update'} this user account?`,
      confirmText: 'Confirm',
      onConfirm: () => {
        executeSubmit()
      }
    })
  }

  // Actual mutation operations (frontend-only in memory)
  const executeSubmit = () => {
    const middleNamePart = middleName.trim() ? ` ${middleName.trim()}` : ''
    const fullName = `${firstName.trim()}${middleNamePart} ${surname.trim()}`

    if (dialogMode === 'create') {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: fullName,
        email: email.trim(),
        role,
        office_id: currentUser?.office_id || 'off-1',
        office_code: currentUser?.office_code || 'ADMIN_OFFICE',
        office_name: currentUser?.office_name || 'Administrative Office',
        is_active: isActive,
        created_at: new Date().toISOString(),
      }
      setUsers([newUser, ...users])
      setDialogOpen(false)
      showResult({
        type: 'success',
        title: 'User Account Created',
        message: `${fullName} added successfully.`,
      })
    } else {
      setUsers(
        users.map((u) =>
          u.id === editingUserId
            ? { ...u, name: fullName, email: email.trim(), role, is_active: isActive }
            : u
        )
      )
      setDialogOpen(false)
      showResult({
        type: 'success',
        title: 'User Account Updated',
        message: `${fullName} modified successfully.`,
      })
    }
  }

  const triggerDelete = (id: string) => {
    const target = users.find((u) => u.id === id)
    if (!target) return
    confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this user account? This action is permanent and cannot be undone.',
      confirmText: 'Confirm',
      onConfirm: () => {
        setUsers(users.filter((u) => u.id !== id))
        showResult({
          type: 'success',
          title: 'User Account Deleted',
          message: `${target.name} has been removed.`,
        })
      }
    })
  }

  const handleCancel = () => {
    confirm({
      title: 'Discard Draft changes',
      message: 'Are you sure? You have unsaved changes. Closing this modal will discard all modifications.',
      confirmText: 'Confirm',
      onConfirm: () => {
        setDialogOpen(false)
      }
    })
  }

  // Sorting columns
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Filter & Search Logic
  const processedUsers = useMemo(() => {
    let result = [...users]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
    }

    // Role Filter
    if (filterRole !== 'all') {
      result = result.filter((u) => u.role === filterRole)
    }

    // Status Filter
    if (filterStatus !== 'all') {
      const isAct = filterStatus === 'active'
      result = result.filter((u) => u.is_active === isAct)
    }

    // Sort
    result.sort((a, b) => {
      let valA = ''
      let valB = ''

      if (sortField === 'firstName') {
        valA = parseName(a.name).firstName
        valB = parseName(b.name).firstName
      } else if (sortField === 'surname') {
        valA = parseName(a.name).surname
        valB = parseName(b.name).surname
      } else if (sortField === 'email') {
        valA = a.email
        valB = b.email
      } else if (sortField === 'role') {
        valA = a.role
        valB = b.role
      } else if (sortField === 'created_at') {
        valA = a.created_at
        valB = b.created_at
      }

      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })

    return result
  }, [users, search, filterRole, filterStatus, sortField, sortAsc])

  // Pagination Logic
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return processedUsers.slice(startIdx, startIdx + pageSize)
  }, [processedUsers, currentPage])

  const totalPages = Math.ceil(processedUsers.length / pageSize) || 1

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <TopBar />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Subheader Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="page-title text-2xl">User Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage user accounts, roles, and permissions.</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-[#580000] text-white hover:bg-[#7a0c0c] shrink-0 font-medium">
            <Plus className="h-4 w-4 mr-1.5" /> Create User
          </Button>
        </div>

        {/* Informative Notice Badge */}
        <div className="flex items-start gap-3 rounded-lg border border-[#1B3A6B]/20 bg-[#E6F1FB] px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-[#1B3A6B] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#1B3A6B]">ARMS Synced Environment</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Users are mapped via the Administrative &amp; Records Management System (ARMS). Creating or editing users here runs in simulated local memory.
            </p>
          </div>
        </div>

        {/* Controls Toolbar (Search & Filter) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input with Icon Inside */}
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#580000] placeholder:text-muted-foreground/60 transition-all h-12 md:h-12"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={showFiltersPanel ? 'default' : 'outline'}
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "h-12 border border-border flex items-center gap-2 font-medium px-4",
                showFiltersPanel && "bg-[#580000] text-white hover:bg-[#580000]"
              )}
            >
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {/* Sub Filters Expanded Panel */}
          {showFiltersPanel && (
            <Card className="border border-border/80 shadow-sm bg-white rounded-lg">
              <CardContent className="py-3 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0 font-semibold">Filter Role:</Label>
                  <Select value={filterRole} onValueChange={(v) => { setFilterRole(v as 'all' | UserRole); setCurrentPage(1); }}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="subsystem_admin">Subsystem Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="opcr_evaluator">OPCR Evaluator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0 font-semibold">Filter Status:</Label>
                  <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as 'all' | 'active' | 'inactive'); setCurrentPage(1); }}>
                    <SelectTrigger className="w-36 h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Section Heading: Users */}
        <div className="pt-2">
          <h3 className="section-header">Users</h3>
        </div>

        {/* Table Container */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 rounded-full border-4 border-[#580000] border-t-transparent animate-spin" />
          </div>
        ) : (
          <Card className="rounded-xl border border-border shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  {/* Sticky Header */}
                  <thead className="sticky top-0 border-b border-border z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('firstName')}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 select-none"
                      >
                        <div className="flex items-center gap-1">
                          First Name <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider select-none">
                        Middle Name
                      </th>
                      <th
                        onClick={() => handleSort('surname')}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Surname <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('email')}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Email <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('role')}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Role <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider select-none">
                        Status
                      </th>
                      <th
                        onClick={() => handleSort('created_at')}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:opacity-70 select-none"
                      >
                        <div className="flex items-center gap-1">
                          Date Created <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                        </div>
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider select-none">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm font-medium">
                          No users matching query were found.
                        </td>
                      </tr>
                    )}
                    {paginatedUsers.map((u) => {
                      const parsed = parseName(u.name)
                      return (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-4 text-foreground font-semibold whitespace-nowrap">
                            {parsed.firstName}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                            {parsed.middleName || <span className="italic text-muted-foreground/30 font-normal">N/A</span>}
                          </td>
                          <td className="px-5 py-4 text-foreground font-semibold whitespace-nowrap">
                            {parsed.surname}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                            {u.email}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3DE] text-[#1D9E75] px-2.5 py-0.5 text-xs font-bold border border-[#1D9E75]/20">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FCEBEB] text-[#E24B4A] px-2.5 py-0.5 text-xs font-bold border border-[#E24B4A]/20">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(u)}
                                className="h-8 w-8 p-0"
                                title="Edit User"
                              >
                                <Edit className="h-3.5 w-3.5 text-[#580000]" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => triggerDelete(u.id)}
                                className="h-8 w-8 p-0 hover:bg-[#FCEBEB]"
                                title="Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-[#E24B4A]" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-5 py-4 border-t border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground font-medium">
                  Showing {processedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                  {Math.min(currentPage * pageSize, processedUsers.length)} of {processedUsers.length} users
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 font-semibold",
                          currentPage === page && "bg-[#580000] text-white hover:bg-[#580000]"
                        )}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-2xl w-full modal-container">
          <DialogHeader>
            <DialogTitle className="modal-title">
              {dialogMode === 'create' ? 'Create User Account' : 'Edit User Account'}
            </DialogTitle>
            <DialogDescription>
              Provide identity details for the account. Fields marked * are mandatory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {/* Split Name Fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  placeholder="e.g., Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Middle Name (Optional)</Label>
                <Input
                  placeholder="e.g., Dela Cruz"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Surname *</Label>
                <Input
                  placeholder="e.g., Santos"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="email@pup.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>System Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subsystem_admin">Subsystem Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="opcr_evaluator">OPCR Evaluator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Account Status</Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <div className="flex gap-3 justify-end w-full">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#580000] text-white hover:bg-[#7a0c0c]">
                  {dialogMode === 'create' ? 'Create User' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
