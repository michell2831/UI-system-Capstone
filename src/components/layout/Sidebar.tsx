import { NavLink } from 'react-router-dom'

// MUI Outlined Icons — matching ARMS sidebar style
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined'
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'

import { useAuth } from '@/auth/AuthContext'
import { useSidebar } from './AppLayout'
import PUPLogo from '../../Asset/PUP_LOGO.png'

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

  /* ── Nav Link ── */
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
    transform: translateX(2px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
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
   Main Sidebar
───────────────────────────────────────────── */
export function Sidebar() {
  const { user } = useAuth()
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar()

  // Compute sidebar class
  const sidebarClass = [
    'ems-sidebar',
    isCollapsed ? 'collapsed' : '',
    isMobileOpen ? 'mobile-visible' : 'mobile-hidden',
  ].filter(Boolean).join(' ')

  /* ── Flat nav link renderer ── */
  const renderLink = (to: string, label: string, Icon: NavIcon) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        ['ems-nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
      }
      onClick={() => setMobileOpen(false)}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="ems-icon" />
      <span className="ems-nav-label">{label}</span>
    </NavLink>
  )

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

          {/* ── MAIN ── */}
          <div className="ems-section-title">MAIN</div>
          <div className="ems-section-divider" />

          {renderLink('/dashboard', 'Dashboard', GridViewOutlinedIcon)}
          {renderLink('/sla-review', 'Evaluation Period', TodayOutlinedIcon)}
          {renderLink('/transactions', 'Transactions', ReceiptLongOutlinedIcon)}

          {/* ── INSIGHTS ── */}
          <div className="ems-section-title">INSIGHTS</div>
          <div className="ems-section-divider" />

          {/* Audit Log — admin & OPCR evaluator only */}
          {(user?.role === 'subsystem_admin' || user?.role === 'opcr_evaluator') &&
            renderLink('/audit-log', 'Audit Log', ManageSearchOutlinedIcon)
          }

          {renderLink('/reports', 'Reports', DescriptionOutlinedIcon)}

        </nav>

        {/* ── Footer ── */}
        <div className="ems-footer">
          Evaluation and Monitoring System
        </div>
      </aside>
    </>
  )
}