import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { TransactionDetailPage } from './pages/TransactionDetailPage'
import { SLAReviewPage } from './pages/SLAReviewPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { AuditLogPage } from './pages/AuditLogPage'

import { ModalProvider } from './components/shared/ModalContext'

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#580000', // PUP Maroon
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#C8960C', // PUP Gold
      contrastText: '#ffffff',
    },
    success: {
      main: '#1D9E75',
    },
    warning: {
      main: '#BA7517',
    },
    error: {
      main: '#E24B4A',
    },
    info: {
      main: '#1B3A6B',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
  },
})

const queryClient = new QueryClient()

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-xl rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-lg">
            <h1 className="text-xl font-semibold text-destructive mb-3">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">
              The application encountered an error while rendering this page.
            </p>
            <pre className="whitespace-pre-wrap text-xs text-foreground/80 bg-background/80 rounded-md p-3 border border-border overflow-x-auto">
              {this.state.error?.message}
            </pre>
            <button
              className="mt-4 inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <AuthProvider>
            <ModalProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Protected app */}
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* EMS-001, 002, 003 — Subsystem Admin + OPCR Evaluator */}
                    <Route
                      path="users"
                      element={
                        <ProtectedRoute allowedRoles={['subsystem_admin', 'opcr_evaluator']}>
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* EMS-004 to 007 — all roles (OPCR read-only) */}
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="transactions/:id" element={<TransactionDetailPage />} />

                    {/* EMS-008 to 012 — Subsystem Admin + OPCR Evaluator */}
                    <Route
                      path="sla-review"
                      element={
                        <ProtectedRoute allowedRoles={['subsystem_admin', 'opcr_evaluator']}>
                          <SLAReviewPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* EMS-026 — Audit Log — Subsystem Admin + OPCR Evaluator */}
                    <Route
                      path="audit-log"
                      element={
                        <ProtectedRoute allowedRoles={['subsystem_admin', 'opcr_evaluator']}>
                          <AuditLogPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
            </ModalProvider>
          </AuthProvider>
        </AppErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
