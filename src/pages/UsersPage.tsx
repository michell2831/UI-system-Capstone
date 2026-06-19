import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Plus, ArrowUpDown, Edit, Trash2, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getUsersApi } from '@/api/mockApi'
import type { User, UserRole } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { RoleBadge } from '@/components/shared/StatusBadge'
import { toast } from '@/hooks/useToast'
import { useModals } from '@/components/shared/ModalContext'
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, InputAdornment, Chip, Card, CardContent, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Grid, Alert, IconButton
} from '@mui/material'

// Helper to split full name into parts
function parseName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', surname: '' }
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: '', surname: parts[1] }
  }
  if (parts.length === 3) {
    if (['dela', 'del', 'de', 'la'].includes(parts[1].toLowerCase())) {
      return { firstName: parts[0], middleName: parts[1], surname: parts[2] }
    }
    return { firstName: parts[0], middleName: parts[1], surname: parts[2] }
  }
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

  const handleFormSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault()
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F5F7FA' }}>
      <TopBar />

      <Box sx={{ flex: 1, p: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Subheader Title */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, md: { alignItems: 'center', justifyContent: 'space-between' }, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#0F172A', fontWeight: 500 }}>
              User Management
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '12px' }}>
              Manage user accounts, roles, and permissions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            startIcon={<Plus style={{ width: 16, height: 16 }} />}
            sx={{
              bgcolor: '#580000',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              height: '40px',
              alignSelf: { xs: 'flex-start', md: 'center' },
              '&:hover': { bgcolor: '#7a0c0c' }
            }}
          >
            Create User
          </Button>
        </Box>

        {/* Informative Notice Badge */}
        <Alert
          severity="info"
          icon={<ShieldAlert style={{ width: 20, height: 20, color: '#1B3A6B' }} />}
          sx={{
            bgcolor: '#E6F1FB',
            color: '#1B3A6B',
            border: '1px solid rgba(27, 58, 107, 0.2)',
            borderRadius: '8px',
            '& .MuiAlert-icon': { alignSelf: 'flex-start', mt: '3px' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B3A6B' }}>
            ARMS Synced Environment
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Users are mapped via the Administrative & Records Management System (ARMS). Creating or editing users here runs in simulated local memory.
          </Typography>
        </Alert>

        {/* Controls Toolbar (Search & Filter) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <TextField
              sx={{ width: { xs: '100%', sm: '350px' }, bgcolor: 'white' }}
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
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

            <Button
              variant={showFiltersPanel ? 'contained' : 'outlined'}
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              startIcon={<Filter style={{ width: 16, height: 16 }} />}
              sx={{
                height: '40px',
                textTransform: 'none',
                fontWeight: 600,
                width: { xs: '100%', sm: 'auto' },
                ...(showFiltersPanel
                  ? { bgcolor: '#580000', color: 'white', '&:hover': { bgcolor: '#580000' } }
                  : { color: 'text.primary', borderColor: 'divider', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }
                )
              }}
            >
              Filters
            </Button>
          </Box>

          {/* Sub Filters Expanded Panel */}
          {showFiltersPanel && (
            <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: 'none', bgcolor: 'white' }}>
              <CardContent sx={{ p: '16px !important', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ width: { xs: '100%', sm: '160px' }, minWidth: '160px', bgcolor: 'white' }} size="small">
                  <InputLabel id="filter-role-label">Filter Role</InputLabel>
                  <Select
                    labelId="filter-role-label"
                    value={filterRole}
                    onChange={(e) => { setFilterRole(e.target.value as 'all' | UserRole); setCurrentPage(1); }}
                    label="Filter Role"
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="subsystem_admin">Subsystem Admin</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="opcr_evaluator">OPCR Evaluator</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ width: { xs: '100%', sm: '160px' }, minWidth: '160px', bgcolor: 'white' }} size="small">
                  <InputLabel id="filter-status-label">Filter Status</InputLabel>
                  <Select
                    labelId="filter-status-label"
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value as 'all' | 'active' | 'inactive'); setCurrentPage(1); }}
                    label="Filter Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Table Container */}
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
                  <TableCell
                    onClick={() => handleSort('firstName')}
                    sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      First Name <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', md: 'table-cell' } }}>
                    Middle Name
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('surname')}
                    sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Surname <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('email')}
                    sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', '&:hover': { opacity: 0.8 }, display: { xs: 'none', md: 'table-cell' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Email <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </Box>
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('role')}
                    sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Role <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', display: { xs: 'none', sm: 'table-cell' } }}>
                    Status
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('created_at')}
                    sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', '&:hover': { opacity: 0.8 }, display: { xs: 'none', md: 'table-cell' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Date Created <ArrowUpDown style={{ width: 14, height: 14 }} />
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 700, fontSize: '13.5px' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No users matching query were found.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedUsers.map((u) => {
                  const parsed = parseName(u.name)
                  return (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.015)' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{parsed.firstName}</TableCell>
                      <TableCell sx={{ color: parsed.middleName ? 'text.primary' : 'text.secondary', fontStyle: parsed.middleName ? 'normal' : 'italic', display: { xs: 'none', md: 'table-cell' } }}>
                        {parsed.middleName || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{parsed.surname}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>{u.email}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {u.is_active ? (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              bgcolor: '#EAF3DE',
                              color: '#1D9E75',
                              borderColor: 'rgba(29, 158, 117, 0.2)',
                              border: '1px solid',
                              fontWeight: 700
                            }}
                          />
                        ) : (
                          <Chip
                            label="Inactive"
                            size="small"
                            sx={{
                              bgcolor: '#FCEBEB',
                              color: '#E24B4A',
                              borderColor: 'rgba(226, 75, 74, 0.2)',
                              border: '1px solid',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '12px', display: { xs: 'none', md: 'table-cell' } }}>
                        {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(u)}
                            sx={{ border: '1px solid #E5E7EB', borderRadius: '6px' }}
                            title="Edit User"
                          >
                            <Edit style={{ width: 14, height: 14, color: '#580000' }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => triggerDelete(u.id)}
                            sx={{ border: '1px solid #E5E7EB', borderRadius: '6px', '&:hover': { bgcolor: '#FCEBEB' } }}
                            title="Delete User"
                          >
                            <Trash2 style={{ width: 14, height: 14, color: '#E24B4A' }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <Box sx={{ px: '20px', py: '16px', bgcolor: 'white', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2, borderTop: '1px solid #E5E7EB' }}>
              <Typography sx={{ fontSize: '12px', color: 'text.secondary', fontWeight: 500 }}>
                Showing {processedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                {Math.min(currentPage * pageSize, processedUsers.length)} of {processedUsers.length} users
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: '32px', height: '32px', p: 0, borderColor: 'divider', color: 'text.primary' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </Button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1
                  const isCurrent = currentPage === page
                  return (
                    <Button
                      key={page}
                      variant={isCurrent ? 'contained' : 'outlined'}
                      size="small"
                      sx={{
                        minWidth: '32px',
                        height: '32px',
                        p: 0,
                        fontWeight: 600,
                        ...(isCurrent
                          ? { bgcolor: '#580000', color: 'white', '&:hover': { bgcolor: '#580000' } }
                          : { borderColor: 'divider', color: 'text.primary', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }
                        )
                      }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: '32px', height: '32px', p: 0, borderColor: 'divider', color: 'text.primary' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </Button>
              </Box>
            </Box>
          </TableContainer>
        )}
      </Box>

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#0F172A', pb: 1 }}>
          {dialogMode === 'create' ? 'Create User Account' : 'Edit User Account'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '13px', color: 'text.secondary', mb: 3 }}>
            Provide identity details for the account. Fields marked * are mandatory.
          </DialogContentText>

          <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {/* Split Name Fields */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="First Name"
                  placeholder="e.g., Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Middle Name"
                  placeholder="e.g., Dela Cruz"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Surname"
                  placeholder="e.g., Santos"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <TextField
              label="Email Address"
              type="email"
              placeholder="email@pup.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              variant="outlined"
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">System Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={role}
                    label="System Role"
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <MenuItem value="subsystem_admin">Subsystem Admin</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="opcr_evaluator">OPCR Evaluator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Account Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={isActive ? 'active' : 'inactive'}
                    label="Account Status"
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            sx={{
              bgcolor: '#580000',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#7a0c0c' }
            }}
          >
            {dialogMode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
