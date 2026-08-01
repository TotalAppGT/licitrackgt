import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing')
  const [resetSent, setResetSent] = useState(false)

  const handleForgotPass = async () => {
    if (!email) { setError('Ingresa tu email primero'); return }
    setLoading(true); setError('')
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err: any) { setError('Error al enviar. Verifica tu email.') }
    finally { setLoading(false) }
  }

  const handleAuth = async (register: boolean) => {
    setError(''); setLoading(true)
    try {
      let fbUser
      if (register) fbUser = await registerWithEmail(email, password)
      else { try { fbUser = await loginWithEmail(email, password) } catch {} }
      if (fbUser) {
        const fbToken = await fbUser.user.getIdToken()
        const res = await fetch('/api/auth/firebase', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebase_token: fbToken, name }),
        })
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        window.location.reload()
      } else { await login(email, password) }
    } catch (err: any) { setError(err.message?.replace('Firebase: ', '') || 'Error al ingresar') }
    finally { setLoading(false) }
  }

  const handleGoogleLogin = async () => {
    setError(''); setLoading(true)
    try {
      const fbUser = await loginWithGoogle()
      const fbToken = await fbUser.user.getIdToken()
      const res = await fetch('/api/auth/firebase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_token: fbToken }),
      })
      localStorage.setItem('token', (await res.json()).access_token)
      window.location.reload()
    } catch (err: any) { setError('Error con Google') }
    finally { setLoading(false) }
  }

  const planes = [
    { name: 'Explorador', precio: 'Gratis', color: 'slate', desc: 'Conoce el sistema', features: ['Buscar 1.7M+ eventos', '5 palabras clave', 'Dashboard con gráficos'], cta: 'Comenzar gratis' },
    { name: 'Básico', precio: 'Q349', color: 'emerald', desc: 'Alertas y exportación', features: ['10 palabras clave + alertas', '3 seguimientos', '1 reporte programado', 'Export CSV', 'Envío por correo'], cta: 'Elegir Básico' },
    { name: 'Pro', precio: 'Q599', color: 'navy', desc: 'Completo para empresas', popular: true, features: ['50 palabras clave', '30 seguimientos', '5 reportes programados', 'WhatsApp + Correo', 'Export XLSX profesional', 'Hasta 3 usuarios'], cta: 'Elegir Pro' },
    { name: 'Enterprise', precio: 'Q999', color: 'violet', desc: 'Para equipos grandes', features: ['Ilimitado en todo', 'Pipeline completo', 'WhatsApp prioritario', 'API acceso', '10 usuarios', 'Soporte dedicado'], cta: 'Elegir Enterprise' },
  ]

  const colorMap: Record<string, string> = {
    slate: 'border-slate-200 hover:border-slate-400 bg-white',
    emerald: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/30',
    navy: 'border-[#1a3a5c]/30 hover:border-[#1a3a5c] shadow-xl bg-gradient-to-b from-white to-blue-50/30',
    violet: 'border-violet-200 hover:border-violet-400 bg-gradient-to-b from-white to-violet-50/30',
  }

  const btnColor: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    emerald: 'bg-emerald-500 text-white hover:bg-emerald-600',
    navy: 'bg-[#1a3a5c] text-white hover:bg-[#2b579a]',
    violet: 'bg-violet-600 text-white hover:bg-violet-700',
  }

  if (view === 'login' || view === 'register') {
    const isReg = view === 'register'
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d2137] to-[#1a3a5c] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <button onClick={() => setView('landing')} className="text-sm text-gray-400 hover:text-gray-600 mb-4">&larr; Volver</button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{isReg ? 'Crear cuenta gratis' : 'Iniciar sesión'}</h2>
            <p className="text-gray-400 text-sm mt-1">{isReg ? 'Accede a 1.7M+ eventos' : 'Continúa donde lo dejaste'}</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); handleAuth(isReg) }} className="space-y-3">
            {isReg && <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" required />
            {resetSent && <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl">Revisa tu email. Te enviamos un enlace para restablecer tu contraseña.</div>}
            {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl">{error}</div>}
            {!isReg && (
              <p className="text-right">
                <button type="button" onClick={handleForgotPass}
                  className="text-xs text-gray-400 hover:text-blue-600">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            )}
            <button type="submit" disabled={loading} className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-xl font-semibold hover:bg-[#2b579a] transition disabled:opacity-50 text-sm">
              {loading ? 'Procesando...' : isReg ? 'Crear cuenta gratis' : 'Ingresar'}
            </button>
            <div className="flex items-center gap-3 my-1"><hr className="flex-1 border-gray-200" /><span className="text-xs text-gray-400">o</span><hr className="flex-1 border-gray-200" /></div>
            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar con Google
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            {isReg ? '¿Ya tienes cuenta?' : '¿Primera vez?'}{' '}
            <button onClick={() => setView(isReg ? 'login' : 'register')} className="text-blue-600 hover:underline font-medium">
              {isReg ? 'Inicia sesión' : 'Crear cuenta'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0d2137] to-[#1a3a5c] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Encuentra oportunidades<br />en <span className="text-cyan-400">Guatecompras</span> al instante
          </h1>
          <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
            Monitoreo inteligente de eventos. Alertas por WhatsApp y correo. Pipeline de seguimiento. Todo en un solo lugar.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <button onClick={() => setView('register')}
              className="bg-cyan-400 text-black px-8 py-3 rounded-xl font-bold text-lg hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/30">
              Probar gratis →
            </button>
            <button onClick={() => setView('login')}
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition border border-white/20">
              Ya tengo cuenta
            </button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center mt-10 text-sm text-white/40">
            <span>✓ 1.7M+ eventos</span>
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ Acceso inmediato</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Planes que escalan con tu empresa</h2>
          <p className="text-gray-500 mt-2">Desde gratis hasta inteligencia de mercado completa. Sin contratos forzosos.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {planes.map(p => (
            <div key={p.name} className={`relative bg-white rounded-2xl border-2 ${colorMap[p.color]} p-5 flex flex-col transition`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-1 rounded-full">Más popular</div>}
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              <div className="mt-3 mb-4">
                {p.precio === 'Gratis' ? <span className="text-3xl font-extrabold">Gratis</span> : <><span className="text-3xl font-extrabold">{p.precio}</span><span className="text-gray-400 text-sm">/mes</span></>}
              </div>
              <ul className="space-y-2 text-xs text-gray-600 mb-5 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-1.5"><span className="text-green-500 font-bold">✓</span>{f}</li>)}
              </ul>
              <button onClick={() => setView('register')}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${btnColor[p.color]}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Pagos seguros con Recurrente. Factura en Quetzales. Cancela cuando quieras.</p>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 text-center py-8 text-xs text-gray-400">
        LiciTrackGT · Monitoreo inteligente de Guatecompras · {new Date().getFullYear()}
      </div>
    </div>
  )
}
