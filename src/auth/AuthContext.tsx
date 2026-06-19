import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { JwtPayload, User, LoginDto } from '@/types'

interface AuthContextValue {
  user: User | null
  jwtPayload: JwtPayload | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (dto: LoginDto) => Promise<void>
  logout: () => void
}

const DEFAULT_USER: User = {
  id: 'usr-admin',
  name: 'System Administrator',
  email: 'admin@ems.ph',
  role: 'subsystem_admin',
  office_id: 'off-1',
  office_code: 'ADMIN_OFFICE',
  office_name: 'Administrative Office',
  is_active: true,
  created_at: new Date().toISOString(),
}

const DEFAULT_JWT_PAYLOAD: JwtPayload = {
  sub: 'usr-admin',
  name: 'System Administrator',
  email: 'admin@ems.ph',
  role: 'subsystem_admin',
  office_id: 'off-1',
  office_code: 'ADMIN_OFFICE',
  office_name: 'Administrative Office',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 28800,
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User | null>(DEFAULT_USER)
  const [jwtPayload] = useState<JwtPayload | null>(DEFAULT_JWT_PAYLOAD)
  const [isLoading] = useState(false)

  const login = useCallback(async (dto: LoginDto) => {
    console.log('Bypassed login with', dto)
  }, [])

  const logout = useCallback(() => {
    console.log('Bypassed logout')
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        jwtPayload,
        isLoading,
        isAuthenticated: true,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
