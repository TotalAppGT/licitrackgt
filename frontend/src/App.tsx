import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FiltrosResultados from './pages/FiltrosResultados'
import Suscripcion from './pages/Suscripcion'
import Alertas from './pages/Alertas'
import Pipeline from './pages/Pipeline'

function AppContent() {
  const { user, logout, loading } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)
  const [waPhone, setWaPhone] = useState('')

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (!user) return <Login />

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'filtros', label: 'Filtros' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'suscripcion', label: 'Suscripcion' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#1a3a5c] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-extrabold tracking-wider">LiciTrackGT</h1>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button onClick={() => { setWaPhone(user.whatsapp_phone || ''); setShowProfile(true) }}
            className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition text-xs flex items-center gap-1"
            title="Configurar notificaciones">
            {user.whatsapp_phone ? (
              <><span className="text-green-400">&#9679;</span> WhatsApp</>
            ) : (
              <><span className="text-gray-400">&#9678;</span> +WhatsApp</>
            )}
          </button>
          <span className="opacity-80">{user.email}</span>
          {user.is_admin && <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>}
          <span className="bg-green-500 px-2 py-0.5 rounded text-xs">{user.plan}</span>
          <button onClick={logout} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">Salir</button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'filtros' && <FiltrosResultados />}
        {tab === 'pipeline' && <Pipeline />}
        {tab === 'alertas' && <Alertas />}
        {tab === 'suscripcion' && <Suscripcion />}
      </main>

      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Notificaciones</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Telefono WhatsApp para alertas</label>
                <input type="text" value={waPhone} placeholder="502XXXXXXXX"
                  onChange={e => setWaPhone(e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
                <p className="text-[10px] text-gray-400 mt-1">Ej: 50255551234 (codigo de pais sin +)</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowProfile(false)}
                  className="px-4 py-2 text-sm border rounded-lg">Cancelar</button>
                <button onClick={async () => {
                  try {
                    await (await import('./api/client')).api.updateProfile({ whatsapp_phone: waPhone })
                    alert('Numero guardado. Recibiras alertas por WhatsApp cuando haya coincidencias.')
                    setShowProfile(false)
                    window.location.reload()
                  } catch (e: any) { alert(e.message) }
                }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}
