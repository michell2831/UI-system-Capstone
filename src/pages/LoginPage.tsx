import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Box, Paper, TextField, Button, IconButton, InputAdornment, Typography, Alert } from '@mui/material'

const DEMO_ACCOUNTS = [
  { email: 'admin@ems.ph',           password: 'admin123', role: 'Subsystem Admin',  office: 'Administrative Office' },
  { email: 'staff@ems.ph',           password: 'staff123', role: 'Staff',            office: 'Administrative Office' },
  { email: 'opcr@ems.ph',            password: 'opcr123',  role: 'OPCR Evaluator',   office: 'Cross-Office' },
  { email: 'ebautista@pup.edu.ph',   password: 'admin123', role: 'Subsystem Admin',  office: 'OSAS' },
  { email: 'academic_admin@ems.ph',  password: 'demo123',  role: 'Subsystem Admin',  office: 'Academic Office' },
  { email: 'academic_staff@ems.ph',  password: 'demo123',  role: 'Staff',            office: 'Academic Office' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(acc: { email: string; password: string }) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(88,0,0,0.05) 0%, rgba(245,247,250,1) 50%, rgba(200,150,12,0.06) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <Box 
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              bgcolor: 'white',
              border: '4px solid rgba(88,0,0,0.1)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              mb: 2,
            }}
          >
            <img
              src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100017370/757bc6c1-305f-4e.png"
              alt="PUP Logo"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Evaluation &
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            Monitoring System
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontSize: '13px' }}>
            PUP Caloocan — OPCR Compliance Platform
          </Typography>
        </Box>

        {/* Login Card */}
        <Paper 
          sx={{
            p: 4,
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
            border: '1px solid #E5E7EB',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '15px' }}>
              Sign in to your account
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Credentials are validated via the Administrative &amp; Records Management System (ARMS)
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              placeholder="you@pup.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                        {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: '8px', fontSize: '12px', py: 0.5 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: '#580000',
                color: 'white',
                fontWeight: 700,
                py: 1.2,
                borderRadius: '8px',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#7a0c0c',
                  boxShadow: 'none',
                }
              }}
            >
              {loading ? 'Authenticating…' : 'Sign in'}
            </Button>
          </Box>
        </Paper>

        {/* Demo Accounts */}
        <Paper 
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px dashed #D1D5DB',
            bgcolor: 'transparent',
            boxShadow: 'none',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
            Demo Accounts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Box
                key={acc.email}
                component="button"
                type="button"
                onClick={() => quickLogin(acc)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.2,
                  borderRadius: '8px',
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.03)',
                  }
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: 'text.primary' }}>
                    {acc.role} · {acc.office}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: 'text.secondary', mt: '2px' }}>
                    {acc.email} / {acc.password}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '11px', color: '#580000', fontWeight: 700 }}>
                  Use →
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
