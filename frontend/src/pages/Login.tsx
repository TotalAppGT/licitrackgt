import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/client'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPlans, setShowPlans] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isRegister) {
        await api.register(email, password, name)
        await login(email, password)
      } else {
        await login(email, password)
      }
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const planes = [
    { id: 'free', name: 'Explorador', precio: 'Gratis', color: 'gray', desc: 'Para empezar a buscar licitaciones' },
    { id: 'basico', name: 'Básico', precio: 'Q349/mes', color: 'blue', desc: 'Alertas, CSV y Pipeline' },
    { id: 'pro', name: 'Pro', precio: 'Q599/mes', color: 'navy', desc: 'Alertas WhatsApp, XLSX, multi-usuario', popular: true },
    { id: 'enterprise', name: 'Enterprise', precio: 'Q999/mes', color: 'amber', desc: 'Ilimitado, API, soporte dedicado' },
  ]

  if (showPlans) return <LandingPlans onBack={() => setShowPlans(false)} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2137] to-[#1a3a5c] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl grid lg:grid-cols-2">
        <div className="bg-[#1a3a5c] text-white p-8 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight">LiciTrack<span className="text-cyan-400">GT</span></h1>
            <p className="text-white/60 mt-2 text-sm">Monitoreo inteligente de licitaciones de Guatecompras</p>
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center gap-2"><span className="text-cyan-400 font-bold">1.7M+</span> licitaciones en tu buscador</div>
            <div className="flex items-center gap-2"><span className="text-cyan-400 font-bold">15 min</span> actualización automática</div>
            <div className="flex items-center gap-2"><span className="text-cyan-400 font-bold">WhatsApp</span> + correo para tus alertas</div>
            <div className="flex items-center gap-2"><span className="text-cyan-400 font-bold">Seguimiento</span> con fechas límite</div>
          </div>
          <button onClick={() => setShowPlans(true)}
            className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-medium transition text-sm border border-white/20">
            Ver planes y precios
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
            <p className="text-gray-400 text-xs mt-1">{isRegister ? 'Comienza gratis en segundos' : 'Accede a tu cuenta'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Tu nombre" required />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="••••••••" required />
            </div>
            {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-xl font-semibold hover:bg-[#2b579a] transition disabled:opacity-50 text-sm">
              {loading ? 'Procesando...' : isRegister ? 'Crear cuenta gratis' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-blue-600 hover:underline font-medium">
              {isRegister ? 'Inicia sesión' : 'Crear cuenta gratis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function LandingPlans({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const planos = [
    { id: 'free', name: 'Explorador', price: 0, features: ['5 palabras clave', 'Buscar 1.7M+ licitaciones', 'Dashboard con gráficos', 'Filtros avanzados'] },
    { id: 'basico', name: 'Básico', price: 349, popular: false, features: ['10 palabras clave + alertas', '3 seguimientos', '1 reporte programado', 'Export CSV', 'Envío por correo'] },
    { id: 'pro', name: 'Pro', price: 599, popular: true, features: ['50 palabras clave', '30 seguimientos', '5 reportes programados', 'Export XLSX', 'WhatsApp + Correo', 'Hasta 3 usuarios'] },
    { id: 'enterprise', name: 'Enterprise', price: 999, popular: false, features: ['Ilimitado en todo', 'Pipeline completo', 'WhatsApp + Correo prioritario', 'API acceso', 'Hasta 10 usuarios', 'Soporte dedicado'] },
  ]

  const registerAndGo = async (planId: string) => {
    try {
      await api.register(form.email, form.password, form.name)
      const res = await api.login(form.email, form.password)
      localStorage.setItem('token', res.access_token)
      if (planId !== 'free') {
        const priceIds: Record<string, string> = { basico: 'price_lltzdrus', pro: 'price_kyqlcwp6', enterprise: 'price_n2pdn7xh' }
        const checkRes = await api.createCheckout(priceIds[planId])
        window.location.href = checkRes.url
      } else {
        window.location.href = '/'
      }
    } catch (e: any) { alert(e.message) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">&larr; Volver</button>
          <h1 className="text-3xl font-extrabold text-gray-900">Planes LiciTrackGT</h1>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">Elige el plan que mejor se adapte a tu empresa. Sin contratos, cancela cuando quieras.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {planos.map(p => (
            <div key={p.id} className={`relative bg-white rounded-2xl shadow-sm border-2 p-5 flex flex-col ${p.popular ? 'border-[#1a3a5c] shadow-lg' : 'border-gray-100'}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-1 rounded-full">Más popular</div>}
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <div className="mt-2 mb-3">
                {p.price === 0 ? <span className="text-2xl font-extrabold">Gratis</span> : <><span className="text-2xl font-extrabold">Q{p.price}</span><span className="text-gray-400 text-sm">/mes</span></>}
              </div>
              <ul className="space-y-1.5 text-xs text-gray-600 mb-4 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span>{f}</li>)}
              </ul>
              <div className="space-y-1">
                <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs border rounded-lg p-1.5" />
                <input type="password" placeholder="Contraseña" onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full text-xs border rounded-lg p-1.5" />
                <input type="text" placeholder="Nombre" onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs border rounded-lg p-1.5" />
                <button onClick={() => registerAndGo(p.id)}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition ${p.popular ? 'bg-[#1a3a5c] text-white hover:bg-[#2b579a]' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  {p.price === 0 ? 'Empezar gratis' : 'Suscribirse'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
