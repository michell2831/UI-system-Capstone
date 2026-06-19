import { useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Bell, Menu as MenuIcon, ChevronDown, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useSidebar } from './AppLayout'
import { toast } from '@/hooks/useToast'
import { useModals } from '@/components/shared/ModalContext'
import { Box, Typography, IconButton, Menu, MenuItem, Avatar, Badge, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface BreadcrumbItem {
  label: string
  to: string
  active?: boolean
}

export function TopBar() {
  const { user, logout } = useAuth()
  const { isCollapsed, setCollapsed, isMobileOpen, setMobileOpen } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const { confirm } = useModals()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Profile menu anchor
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null)
  // Notification menu anchor
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null)

  const isProfileOpen = Boolean(profileAnchorEl)
  const isNotifOpen = Boolean(notifAnchorEl)

  // Mock Notifications
  const notifications = [
    { id: 1, text: 'New transaction txn-108 created by Jose Reyes', time: '2 min ago' },
    { id: 2, text: 'SLA breach warning for transaction txn-102', time: '1 hour ago' },
    { id: 3, text: 'Documentary status updated for txn-99', time: '3 hours ago' },
  ]

  // Dynamic breadcrumb labels based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname
    const items: BreadcrumbItem[] = [{ label: 'Monitoring Overview', to: '/dashboard' }]

    if (path === '/dashboard') {
      return [{ label: 'Monitoring Overview', to: '/dashboard', active: true }]
    }

    if (path === '/users') {
      items.push({ label: 'User Management', to: '/users' })
      items.push({ label: 'Users', to: '/users' })
    } else if (path === '/transactions') {
      items.push({ label: 'OPCR', to: '/transactions' })
      items.push({ label: 'Transactions', to: '/transactions' })
    } else if (path.startsWith('/transactions/')) {
      items.push({ label: 'OPCR', to: '/transactions' })
      items.push({ label: 'Transactions', to: '/transactions' })
      items.push({ label: 'Detail', to: path })
    } else if (path === '/sla-review') {
      items.push({ label: 'OPCR', to: '/sla-review' })
      items.push({ label: 'Evaluation Period', to: '/sla-review' })
    } else {
      const parts = path.split('/').filter(Boolean)
      parts.forEach((part, index) => {
        const to = '/' + parts.slice(0, index + 1).join('/')
        const label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ')
        items.push({ label, to })
      })
    }

    // Set the last element as active
    if (items.length > 0) {
      items[items.length - 1].active = true
    }

    return items
  }

  const handleSettingsClick = () => {
    setProfileAnchorEl(null)
    toast({
      title: 'ARMS Settings Module',
      description: 'Account settings are managed via the central Administrative & Records Management System (ARMS).',
      variant: 'default',
    })
  }

  const handleLogout = () => {
    setProfileAnchorEl(null)
    logout()
    navigate('/dashboard')
  }

  const breadcrumbs = getBreadcrumbs()

  const userInitials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'US'

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: '24px',
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      {/* Left side: Hamburger Toggle & Breadcrumbs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <IconButton
          onClick={() => {
            if (isMobile) {
              setMobileOpen(!isMobileOpen)
            } else {
              setCollapsed(!isCollapsed)
            }
          }}
          sx={{
            padding: '8px',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'action.hover' },
          }}
          title="Toggle Sidebar"
        >
          <MenuIcon style={{ width: 20, height: 20 }} />
        </IconButton>

        <Box component="nav" sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: '6px' }}>
          {breadcrumbs.map((crumb, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {idx > 0 && (
                <Typography sx={{ color: 'text.secondary', opacity: 0.4, fontWeight: 700, fontSize: '10px' }}>
                  &gt;
                </Typography>
              )}
              {crumb.active ? (
                <Typography sx={{ fontWeight: 600, fontSize: '12px', color: '#580000' }}>
                  {crumb.label}
                </Typography>
              ) : (
                <Link to={crumb.to} style={{ textDecoration: 'none' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '12px', '&:hover': { color: 'text.primary' } }}>
                    {crumb.label}
                  </Typography>
                </Link>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right side: Notifications & User Profile */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification Bell */}
        <Box>
          <IconButton
            onClick={(e) => setNotifAnchorEl(e.currentTarget)}
            sx={{
              padding: '8px',
              color: isNotifOpen ? '#580000' : 'text.secondary',
              bgcolor: isNotifOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
            title="Notifications"
          >
            <Badge
              variant="dot"
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#E24B4A',
                  border: '2px solid #FFF',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                }
              }}
            >
              <Bell style={{ width: 20, height: 20 }} />
            </Badge>
          </IconButton>

          {/* Notifications Dropdown Panel */}
          <Menu
            anchorEl={notifAnchorEl}
            open={isNotifOpen}
            onClose={() => setNotifAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  width: '320px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  mt: 1.5,
                  p: 0,
                }
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#580000' }}>Notifications</Typography>
              <Box sx={{ bgcolor: '#EAF3DE', color: '#1D9E75', px: '8px', py: '2px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>
                New
              </Box>
            </Box>
            <Box sx={{ maxHeight: '240px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <Box key={n.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', '&:last-child': { borderBottom: 0 }, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 500, color: 'text.primary', lineHeight: 1.4 }}>{n.text}</Typography>
                  <Typography sx={{ fontSize: '10px', color: 'text.secondary', mt: '4px' }}>{n.time}</Typography>
                </Box>
              ))}
            </Box>
          </Menu>
        </Box>

        {/* User Profile dropdown */}
        <Box>
          <Box
            component="button"
            onClick={(e) => setProfileAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 0,
              bgcolor: isProfileOpen ? 'rgba(0,0,0,0.04)' : 'transparent',
              cursor: 'pointer',
              outline: 'none',
              textAlign: 'left',
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <Avatar
              sx={{
                width: '32px',
                height: '32px',
                bgcolor: '#580000',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, pr: '4px' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
                {user?.name}
              </Typography>
              <Typography sx={{ fontSize: '10px', color: 'text.secondary', lineHeight: 1, mt: '4px', textTransform: 'uppercase', fontWeight: 500 }}>
                {user?.role.replace('_', ' ')}
              </Typography>
            </Box>
            <ChevronDown style={{ width: 16, height: 16, color: '#6b7280', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </Box>

          <Menu
            anchorEl={profileAnchorEl}
            open={isProfileOpen}
            onClose={() => setProfileAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  width: '200px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  mt: 1.5,
                }
              }
            }}
          >
            <MenuItem onClick={handleSettingsClick} sx={{ py: 1.2, gap: 1.5, fontSize: '12px', fontWeight: 500 }}>
              <Settings style={{ width: 16, height: 16, color: '#6b7280' }} />
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                setProfileAnchorEl(null)
                confirm({
                  title: 'Confirm Logout',
                  message: 'Are you sure you want to log out of the OPCR System?',
                  confirmText: 'Confirm',
                  onConfirm: handleLogout,
                })
              }}
              sx={{
                py: 1.2,
                gap: 1.5,
                fontSize: '12px',
                fontWeight: 500,
                color: '#E24B4A',
                borderTop: '1px solid #F3F4F6',
                '&:hover': { bgcolor: '#FCEBEB' }
              }}
            >
              <LogOut style={{ width: 16, height: 16, color: '#E24B4A' }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  )
}
