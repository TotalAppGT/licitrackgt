import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider, toast } from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FiltrosResultados from './pages/FiltrosResultados'
import Suscripcion from './pages/Suscripcion'
import Alertas from './pages/Alertas'
import Pipeline from './pages/Pipeline'
import AdminPanel from './pages/AdminPanel'
import Onboarding from './pages/Onboarding'
import Equipo from './pages/Equipo'

function CountdownDisplay() {
  const [next, setNext] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const r = await fetch('/api/extraction/status', { headers: { Authorization: `Bearer ${token}` } })
        const data = await r.json()
        if (alive && data.next_refresh_at) setNext(new Date(data.next_refresh_at).getTime())
      } catch {}
    }
    tick()
    const id = setInterval(tick, 120000)
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => { alive = false; clearInterval(id); clearInterval(t) }
  }, [])
  if (!next) return null
  const ms = Math.max(0, next - now)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return <span className="text-white/40 font-mono tabular-nums text-[11px]">{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
}

function AppContent() {
  const { user, logout, loading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')

  useEffect(() => {
    if (user && !localStorage.getItem('onboarding_done')) {
      setShowOnboarding(true)
    }
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (!user) return <Login />

  const tabs = [
    { id: 'dashboard', label: 'Panel' },
    { id: 'filtros', label: 'Filtros' },
    { id: 'pipeline', label: 'Seguimiento' },
    { id: 'alertas', label: 'Alertas' },
    ...(!user.is_team_member ? [{ id: 'suscripcion', label: 'Suscripción' }] : []),
    ...(user.is_admin && !user.is_team_member ? [{ id: 'admin', label: 'Admin' }] : []),
    ...(user.plan !== 'free' && !user.is_team_member ? [{ id: 'equipo', label: 'Equipo' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-[#0d2137] to-[#1a3a5c] text-white px-4 py-2.5 flex items-center justify-between shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-extrabold tracking-wider flex items-center gap-2">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            LiciTrack<span className="text-cyan-400">GT</span>
          </h1>
          <div className="flex gap-0.5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === t.id ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <CountdownDisplay />
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
            {user.whatsapp_phone ? (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="WhatsApp activo"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-gray-400" title="WhatsApp no configurado"></span>
            )}
            <button onClick={() => { setWaPhone(user.whatsapp_phone || ''); setShowProfile(true) }}
              className="hover:text-cyan-400 transition flex items-center gap-1">
              {user.whatsapp_phone ? 'Notificaciones' : 'Configurar alertas'}
            </button>
          </div>
          <span className="text-white/50 hidden lg:inline">{user.email}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.plan === 'enterprise' ? 'bg-amber-500 text-black' : user.plan === 'pro' ? 'bg-blue-400 text-black' : 'bg-green-500 text-black'}`}>{user.plan}</span>
          {user.is_admin && <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[10px] font-bold">ADMIN</span>}
          <button onClick={logout} className="hover:bg-white/10 px-2 py-1 rounded-lg transition text-white/60 hover:text-white">Salir</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={tab === 'dashboard' ? '' : 'hidden'}><Dashboard /></div>
        <div className={tab === 'filtros' ? '' : 'hidden'}><FiltrosResultados /></div>
        <div className={tab === 'pipeline' ? '' : 'hidden'}><Pipeline /></div>
        <div className={tab === 'alertas' ? '' : 'hidden'}><Alertas /></div>
        <div className={tab === 'suscripcion' ? '' : 'hidden'}><Suscripcion /></div>
        {user.is_admin && <div className={tab === 'admin' ? '' : 'hidden'}><AdminPanel /></div>}
        {user.plan !== 'free' && <div className={tab === 'equipo' ? '' : 'hidden'}><Equipo /></div>}
      </main>

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowProfile(false); setTestResult(null) }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Configurar notificaciones</h3>
            
            {testResult && (
              <div className={`rounded-lg p-3 mb-4 text-sm ${testResult.email && testResult.whatsapp ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                <div className="flex items-center gap-2">
                  <span>{testResult.email ? 'Correo enviado' : 'Fallo correo'}</span>
                  <span className="text-xs">{testResult.whatsapp ? '| WhatsApp entregado' : testResult.whatsapp_error ? `| WhatsApp: ${testResult.whatsapp_error}` : ''}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Tu correo para alertas</label>
                <input type="text" value={user.email} disabled
                  className="w-full text-sm border rounded-lg p-2 mt-1 bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Telefono WhatsApp (con codigo de pais)</label>
                <input type="text" value={waPhone} placeholder="502XXXXXXXX"
                  onChange={e => setWaPhone(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
                <p className="text-[10px] text-gray-400 mt-1">Ej: 50235187153 (Guatemala). Sin el +</p>
              </div>
              
              <div className="flex gap-2">
                <button onClick={async () => {
                  setTesting(true); setTestResult(null)
                  try {
                    const token = localStorage.getItem('token')
                    const res = await fetch('/api/auth/test-notification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ whatsapp_phone: waPhone || undefined }),
                    })
                    const data = await res.json()
                    setTestResult(data)
                  } catch (e: any) { setTestResult({ email: false, whatsapp: false, whatsapp_error: 'Error de conexion' }) }
                  finally { setTesting(false) }
                }}
                  disabled={testing}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {testing ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                  Probar notificaciones
                </button>
                <button onClick={async () => {
                  try {
                    const token = localStorage.getItem('token')
                    await fetch('/api/auth/profile', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ whatsapp_phone: waPhone }),
                    })
                    await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                    setShowProfile(false); setTestResult(null)
                    window.location.reload()
                  } catch (e: any) { toast.show(e.message, 'error') }
                }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Guardar
                </button>
              </div>
              <hr className="my-4" />
              <p className="text-xs font-semibold text-gray-600 mb-2">Cambiar contraseña</p>
              <div className="space-y-2">
                <input type="password" value={currentPass} placeholder="Contraseña actual"
                  onChange={e => setCurrentPass(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2" />
                <input type="password" value={newPass} placeholder="Nueva contraseña"
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2" />
                <button onClick={async () => {
                  if (!currentPass || !newPass) { toast.show('Llena ambos campos', 'warning'); return }
                  try {
                    const token = localStorage.getItem('token')
                    const res = await fetch('/api/auth/profile', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
                    })
                    if (!res.ok) { const e = await res.json(); throw new Error(e.detail) }
                    setCurrentPass(''); setNewPass('')
                    toast.show('Contraseña actualizada', 'success')
                  } catch (e: any) { toast.show(e.message, 'error') }
                }}
                  className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200">Actualizar contraseña</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showOnboarding && <Onboarding onComplete={() => { setShowOnboarding(false); localStorage.setItem('onboarding_done', '1') }} />}
    </div>
  )
}

export default function App() {
  return <AuthProvider><ToastProvider><AppContent /></ToastProvider></AuthProvider>
}
