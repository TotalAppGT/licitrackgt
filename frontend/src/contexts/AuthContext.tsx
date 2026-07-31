import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api/client'

interface User { id: number; email: string; name: string; is_admin: boolean; plan: string; status: string; whatsapp_phone?: string }
interface AuthCtx { user: User | null; login: (e: string, p: string) => Promise<void>; logout: () => void; loading: boolean }

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api.me().then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    localStorage.setItem('token', res.access_token)
    setUser(res.user)
  }

  const logout = () => { localStorage.removeItem('token'); setUser(null); window.location.href = '/login' }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
