import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api/client'

interface User { id: number; email: string; name: string; is_admin: boolean; plan: string; status: string; whatsapp_phone?: string; is_team_member?: boolean; owner_id?: number }
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
    localStorage.setItem('user', JSON.stringify(res.user))
    window.location.reload()
  }

  const restoreUser = () => {
    try {
      const u = localStorage.getItem('user')
      if (u && u !== 'undefined') { setUser(JSON.parse(u)); setLoading(false); return }
    } catch {}
    const token = localStorage.getItem('token')
    if (!token || token === 'undefined') { setLoading(false); return }
    api.me().then(setUser).catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user') }).finally(() => setLoading(false))
  }

  useEffect(() => {
    restoreUser()
  }, [])

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); window.location.href = '/' }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
