import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'

// MUI Outlined Icons — matching ARMS sidebar style
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'

import { useAuth } from '@/auth/AuthContext'
import { useSidebar } from './AppLayout'
import { toast } from '@/hooks/useToast'
import PUPLogo from '../../Asset/PUP_LOGO.png'
import { Box, Collapse } from '@mui/material'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavIcon = React.ComponentType<any>

/* ─────────────────────────────────────────────
   Injected CSS — mirrors ARMS sidebar exactly
───────────────────────────────────────────── */
const SIDEBAR_CSS = `
  .ems-sidebar {
    width: 256px;
    min-height: 100vh;
    background: #580000;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.1);
    font-family: 'DM Sans', sans-serif;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    color: #fff;
    z-index: 40;
    overflow: hidden;
  }
  .ems-sidebar.collapsed {
    width: 64px;
  }

  /* ── Mobile drawer ── */
  @media (max-width: 899px) {
    .ems-sidebar {
      position: fixed;
      top: 0; bottom: 0; left: 0;
    }
    .ems-sidebar.mobile-hidden {
      transform: translateX(-100%);
    }
    .ems-sidebar.mobile-visible {
      transform: translateX(0);
    }
  }
  @media (min-width: 900px) {
    .ems-sidebar {
      position: static;
    }
  }

  /* ── Logo Area ── */
  .ems-logo-area {
    height: 64px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.1);
    gap: 12px;
    transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ems-sidebar.collapsed .ems-logo-area {
    padding: 0 14px;
    justify-content: center;
  }

  .ems-logo-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    filter: brightness(1.1);
    flex-shrink: 0;
  }

  .ems-logo-text {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 1;
    width: auto;
    visibility: visible;
    transition: opacity 0.2s ease, width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ems-sidebar.collapsed .ems-logo-text {
    opacity: 0;
    width: 0;
    visibility: hidden;
  }

  .ems-logo-name {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
    white-space: nowrap;
  }
  .ems-logo-sub {
    font-size: 10px;
    font-weight: 400;
    color: rgba(255,255,255,0.6);
    line-height: 1;
    margin-top: 4px;
    white-space: nowrap;
  }

  /* ── Nav Area ── */
  .ems-nav {
    flex: 1;
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .ems-nav::-webkit-scrollbar { display: none; }

  /* ── Section Title ── */
  .ems-section-title {
    font-size: 10.5px;
    font-weight: 700;
    color: #C8960C;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 16px 24px 8px 24px;
    opacity: 0.8;
    user-select: none;
    margin: 0;
    overflow: hidden;
    transition: opacity 0.2s ease, height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }
  .ems-sidebar.collapsed .ems-section-title {
    opacity: 0;
    height: 0;
    padding: 0;
  }

  /* ── Section Divider ── */
  .ems-section-divider {
    height: 0;
    opacity: 0;
    margin: 0 12px;
    border-top: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ems-sidebar.collapsed .ems-section-divider {
    height: 1px;
    opacity: 1;
    margin: 8px 12px;
  }

  /* ── Nav Link (shared base) ── */
  .ems-nav-link {
    display: flex;
    align-items: center;
    gap: 16px;
    border-radius: 6px;
    padding: 10px 16px;
    margin: 2px 12px;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    border-left: 4px solid transparent;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    width: calc(100% - 24px);
    box-sizing: border-box;
    min-height: 40px;
    text-decoration: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }
  .ems-sidebar.collapsed .ems-nav-link {
    gap: 0;
    justify-content: center;
    padding: 10px 15px;
    margin: 2px 8px;
    width: calc(100% - 16px);
  }
  .ems-nav-link:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.1);
  }
  .ems-nav-link.active {
    background: rgba(0,0,0,0.2);
    border-left: 4px solid #C8960C;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    color: #ffffff;
    font-weight: 500;
  }

  /* ── Nav Label ── */
  .ems-nav-label {
    font-size: 13.5px;
    font-weight: 500;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    width: auto;
    visibility: visible;
    transition: opacity 0.2s ease, width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ems-sidebar.collapsed .ems-nav-label {
    opacity: 0;
    width: 0;
    visibility: hidden;
  }

  /* ── Icon ── */
  .ems-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: inherit;
  }

  /* ── Dropdown children container ── */
  .ems-children {
    padding-left: 12px;
    border-left: 1px solid rgba(255,255,255,0.1);
    margin-left: 28px;
    margin-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .ems-sidebar.collapsed .ems-children {
    padding-left: 0;
    border-left: none;
    margin-left: 0;
    margin-right: 0;
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
    padding: 6px 0;
  }

  /* ── Dropdown group button ── */
  .ems-group-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-radius: 6px;
    padding: 10px 16px;
    margin: 2px 12px;
    font-size: 13.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    border-left: 4px solid transparent;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    width: calc(100% - 24px);
    box-sizing: border-box;
    min-height: 40px;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
    text-align: left;
    border-top: none;
    border-right: none;
    border-bottom: none;
  }
  .ems-sidebar.collapsed .ems-group-btn {
    justify-content: center;
    gap: 0;
    padding: 10px 15px;
    margin: 2px 8px;
    width: calc(100% - 16px);
  }
  .ems-group-btn:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.1);
  }
  .ems-group-btn-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ems-sidebar.collapsed .ems-group-btn-left {
    gap: 0;
  }

  /* ── Footer ── */
  .ems-footer {
    border-top: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.1);
    font-size: 11px;
    color: rgba(255,255,255,0.4);
    line-height: 1.4;
    letter-spacing: 0.03em;
    user-select: none;
    overflow: hidden;
    white-space: nowrap;
    padding: 16px 20px;
    opacity: 1;
    height: auto;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: auto;
  }
  .ems-sidebar.collapsed .ems-footer {
    opacity: 0;
    height: 0;
    padding: 0;
    border-top-color: transparent;
  }
`

/* ─────────────────────────────────────────────
   SidebarGroup Component
───────────────────────────────────────────── */
interface SidebarGroupProps {
  label: string
  icon: NavIcon
  isOpen: boolean
  onToggle: () => void
  isCollapsed: boolean
  children: React.ReactNode
}

function SidebarGroup({ label, icon: Icon, isOpen, onToggle, isCollapsed, children }: SidebarGroupProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Parent button — stays in place; children expand BELOW */}
      <button className="ems-group-btn" onClick={onToggle} title={isCollapsed ? label : undefined}>
        <span className="ems-group-btn-left">
          <Icon className="ems-icon" />
          <span className="ems-nav-label">{label}</span>
        </span>
        {!isCollapsed && (
          isOpen
            ? <ChevronDown style={{ width: 16, height: 16, flexShrink: 0 }} />
            : <ChevronRight style={{ width: 16, height: 16, flexShrink: 0 }} />
        )}
      </button>

      {/* Children expand DOWNWARD below the button */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <div className="ems-children">
          {children}
        </div>
      </Collapse>
    </Box>
  )
}

/* ─────────────────────────────────────────────
   Main Sidebar
───────────────────────────────────────────── */
export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar()

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen] = useState(true)
  const [opcrMenuOpen, setOpcrMenuOpen] = useState(true)
  const [recordsMenuOpen, setRecordsMenuOpen] = useState(false)
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false)

  // Auto-expand dropdowns when location changes
  useEffect(() => {
    if (location.pathname.startsWith('/users')) {
      setUserMenuOpen(true)
    }
    if (location.pathname.startsWith('/transactions') || location.pathname.startsWith('/sla-review')) {
      setOpcrMenuOpen(true)
    }
  }, [location.pathname])

  const handleMockClick = (name: string) => {
    toast({
      title: 'ARMS Integrated Module',
      description: `${name} is managed exclusively by the Administrative & Records Management System (ARMS).`,
      variant: 'default',
    })
  }

  // Compute sidebar class
  const sidebarClass = [
    'ems-sidebar',
    isCollapsed ? 'collapsed' : '',
    // mobile classes (applied only on xs/sm via CSS media query logic)
    isMobileOpen ? 'mobile-visible' : 'mobile-hidden',
  ].filter(Boolean).join(' ')

  /* ── Renders a real NavLink ── */
  const renderLink = (to: string, label: string, icon: NavIcon | null = null, isMock = false) => {
    const Icon = icon

    if (isMock) {
      return (
        <button
          key={to + label}
          className="ems-nav-link"
          onClick={() => handleMockClick(label)}
          title={isCollapsed ? label : undefined}
        >
          {Icon && <Icon className="ems-icon" />}
          <span className="ems-nav-label">{label}</span>
        </button>
      )
    }

    return (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => ['ems-nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={() => setMobileOpen(false)}
        title={isCollapsed ? label : undefined}
      >
        {Icon && <Icon className="ems-icon" />}
        <span className="ems-nav-label">{label}</span>
      </NavLink>
    )
  }

  return (
    <>
      {/* Inject ARMS-matching CSS */}
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      <aside className={sidebarClass}>
        {/* ── Brand / Logo Area ── */}
        <div className="ems-logo-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={PUPLogo} alt="PUP Caloocan logo" className="ems-logo-img" />
            <div className="ems-logo-text">
              <span className="ems-logo-name">PUP Caloocan</span>
              <span className="ems-logo-sub">OPCR System</span>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="ems-nav">

          {/* MAIN section */}
          <div className="ems-section-title">MAIN</div>
          <div className="ems-section-divider" />

          {renderLink('/dashboard', 'Dashboard', GridViewOutlinedIcon)}

          {/* User Management (admin / evaluator only) */}
          {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') && (
            <SidebarGroup
              label="User Management"
              icon={GroupOutlinedIcon}
              isOpen={userMenuOpen}
              onToggle={() => setUserMenuOpen(!userMenuOpen)}
              isCollapsed={isCollapsed}
            >
              {renderLink('/users', 'Users')}
              {renderLink('/roles', 'Roles', null, true)}
              {renderLink('/permissions', 'Permissions', null, true)}
            </SidebarGroup>
          )}

          {/* OPCR Dropdown */}
          <SidebarGroup
            label="OPCR"
            icon={AssignmentOutlinedIcon}
            isOpen={opcrMenuOpen}
            onToggle={() => setOpcrMenuOpen(!opcrMenuOpen)}
            isCollapsed={isCollapsed}
          >
            {renderLink('/sla-review', 'Evaluation Period')}
            {renderLink('/transactions', 'Transactions')}
          </SidebarGroup>

          {/* INSIGHTS section */}
          <div className="ems-section-title">INSIGHTS</div>
          <div className="ems-section-divider" />

          {/* Records (admin / evaluator only) */}
          {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') && (
            <SidebarGroup
              label="Records"
              icon={FolderOpenOutlinedIcon}
              isOpen={recordsMenuOpen}
              onToggle={() => setRecordsMenuOpen(!recordsMenuOpen)}
              isCollapsed={isCollapsed}
            >
              {renderLink('/records/status', 'Documentary Status', null, true)}
              {renderLink('/records/reports', 'Documentary Reports', null, true)}
            </SidebarGroup>
          )}

          {/* Audit Log (admin / evaluator only) */}
          {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') &&
            renderLink('/audit-log', 'Audit Log', ManageSearchOutlinedIcon)
          }

          {/* Reports Dropdown */}
          <SidebarGroup
            label="Reports"
            icon={BarChartOutlinedIcon}
            isOpen={reportsMenuOpen}
            onToggle={() => setReportsMenuOpen(!reportsMenuOpen)}
            isCollapsed={isCollapsed}
          >
            {renderLink('/reports/overview', 'Reports Overview', null, true)}
          </SidebarGroup>

          {/* Analytics (mock) */}
          {renderLink('/analytics', 'Analytics', InsightsOutlinedIcon, true)}

        </nav>

        {/* ── Footer ── */}
        <div className="ems-footer">
          Evaluation and Monitoring System
        </div>
      </aside>
    </>
  )
}