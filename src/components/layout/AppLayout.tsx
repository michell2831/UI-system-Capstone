import { createContext, useContext, useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { Box } from '@mui/material'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

interface SidebarContextType {
  isCollapsed: boolean
  setCollapsed: (v: boolean) => void
  isMobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within AppLayout')
  }
  return context
}

export function AppLayout() {
  const [isCollapsed, setCollapsed] = useState(false)
  const [isMobileOpen, setMobileOpen] = useState(false)

  const theme = useTheme()
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'))
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'))

  useEffect(() => {
    if (isMdDown) {
      setMobileOpen(false) // Close drawer when switching to mobile
    } else if (isLgDown) {
      setCollapsed(true)  // Collapse on tablet
    } else {
      setCollapsed(false) // Expand on desktop
    }
  }, [isMdDown, isLgDown])

  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed, isMobileOpen, setMobileOpen }}>
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default', fontFamily: 'var(--font-ui)' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Backdrop for mobile drawer */}
        {isMobileOpen && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
              bgcolor: 'rgba(0, 0, 0, 0.4)',
              display: { xs: 'block', md: 'none' },
              transition: 'opacity 0.3s'
            }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative', bgcolor: 'background.default' }}>
          <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Outlet />
          </Box>
        </Box>
        <Toaster />
      </Box>
    </SidebarContext.Provider>
  )
}
