import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { loginWithEmail, registerWithEmail, loginWithGoogle } from '../firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'

const TERMINOS_Y_CONDICIONES = `TÉRMINOS Y CONDICIONES DE USO
LiciTrackGT — TotalAppGT

1. ACEPTACIÓN
Al registrarte y usar LiciTrackGT aceptas estos términos. Si no estás de acuerdo, no uses el servicio.

2. DESCRIPCIÓN DEL SERVICIO
LiciTrackGT es una plataforma SaaS de monitoreo inteligente de eventos públicos de Guatecompras. Proporciona alertas por correo electrónico y WhatsApp, pipeline de seguimiento y reportes programados.

3. PLANES Y PAGOS
Ofrecemos planes gratuitos y de pago. Los pagos se procesan a través de Recurrente. Las suscripciones se renuevan automáticamente hasta su cancelación. Puedes cancelar en cualquier momento desde tu panel.

4. USO ADECUADO
No está permitido: revender el acceso, usar el sistema para actividades ilegales, extraer datos masivamente sin autorización, ni interferir con el funcionamiento normal del servicio.

5. PROPIEDAD INTELECTUAL
LiciTrackGT es una marca de TotalAppGT, propiedad de Daniel Martinez. El código, diseño, textos y funcionalidades están protegidos por leyes de propiedad intelectual.

6. LIMITACIÓN DE RESPONSABILIDAD
La información proviene de fuentes públicas (Guatecompras). No garantizamos exactitud del 100%. TotalAppGT no se hace responsable por decisiones comerciales tomadas basándose en los datos mostrados.

7. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se notificarán por correo electrónico.

8. CONTACTO
Email: soporte@totalappgt.online
WhatsApp: +502 5830 3182`

const PRIVACIDAD = `POLÍTICA DE PRIVACIDAD
LiciTrackGT — TotalAppGT

1. DATOS QUE RECOPILAMOS
Recopilamos: email, nombre, número de WhatsApp (opcional), preferencias de alertas y actividad dentro de la plataforma.

2. USO DE DATOS
Usamos tus datos para: autenticar tu cuenta, enviar alertas y reportes, procesar pagos, mejorar el servicio y comunicar cambios importantes.

3. NO COMPARTIMOS TUS DATOS
No vendemos ni compartimos tu información personal con terceros. Los datos se almacenan en servidores seguros de Railway y PostgreSQL.

4. SEGURIDAD
Utilizamos cifrado HTTPS, autenticación Firebase y buenas prácticas de seguridad para proteger tu información.

5. TUS DERECHOS
Puedes solicitar la eliminación de tus datos en cualquier momento escribiendo a soporte@totalappgt.online. Al eliminar tu cuenta, todos tus datos personales serán removidos.

6. COOKIES
Usamos cookies técnicas necesarias para el funcionamiento de la sesión. No usamos cookies de rastreo ni publicidad.

7. CONTACTO
Email: soporte@totalappgt.online
WhatsApp: +502 5830 3182`

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing')
  const [legalPage, setLegalPage] = useState<'terminos' | 'privacidad' | null>(null)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/terminos') setLegalPage('terminos')
    else if (path === '/privacidad') setLegalPage('privacidad')
  }, [])

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
    { name: 'Explorador', precio: 'Gratis', color: 'slate', desc: 'Para siempre, sin costo', features: ['Explora 1.7M+ eventos públicos', '5 palabras clave de búsqueda', 'Dashboard con gráficos en vivo', 'Acceso ilimitado sin vencimiento'], cta: 'Comenzar gratis' },
    { name: 'Básico', precio: 'Q349', color: 'emerald', desc: 'Alertas inteligentes', features: ['10 palabras clave con alertas', '3 eventos en seguimiento', '1 reporte programado mensual', 'Exportación a CSV', 'Alertas por correo electrónico', 'Soporte por WhatsApp'], cta: 'Elegir Básico' },
    { name: 'Pro', precio: 'Q599', color: 'navy', desc: 'Para empresas en crecimiento', popular: true, features: ['50 palabras clave activas', '30 eventos en pipeline', '5 reportes programados', 'WhatsApp + Correo en tiempo real', 'Export XLSX profesional', 'Hasta 3 usuarios colaborando', 'Estadísticas avanzadas'], cta: 'Elegir Pro' },
    { name: 'Enterprise', precio: 'Q999', color: 'violet', desc: 'Inteligencia de mercado', features: ['Palabras clave ilimitadas', 'Pipeline sin límites', 'Reportes ilimitados', 'WhatsApp prioritario 24/7', 'Acceso a API completa', 'Hasta 10 usuarios', 'Soporte dedicado personalizado', 'Onboarding guiado para tu equipo'], cta: 'Elegir Enterprise' },
  ]

  const colorMap: Record<string, string> = {
    slate: 'border-slate-200 hover:border-slate-400 bg-white',
    emerald: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/30',
    navy: 'border-[#1a3a5c]/30 hover:border-[#1a3a5c] shadow-xl bg-gradient-to-b from-white to-blue-50/30 scale-[1.02]',
    violet: 'border-violet-200 hover:border-violet-400 bg-gradient-to-b from-white to-violet-50/30',
  }

  const btnColor: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    emerald: 'bg-emerald-500 text-white hover:bg-emerald-600',
    navy: 'bg-[#1a3a5c] text-white hover:bg-[#2b579a]',
    violet: 'bg-violet-600 text-white hover:bg-violet-700',
  }

  const navigateToLegal = (page: 'terminos' | 'privacidad') => {
    window.history.pushState({}, '', `/${page}`)
    setLegalPage(page)
  }

  if (legalPage === 'terminos') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d2137] to-[#1a3a5c] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => { setLegalPage(null); window.history.pushState({}, '', '/') }} className="text-sm text-gray-400 hover:text-gray-600 mb-4">&larr; Volver al inicio</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Términos y Condiciones</h1>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{TERMINOS_Y_CONDICIONES}</div>
        </div>
      </div>
    )
  }

  if (legalPage === 'privacidad') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0d2137] to-[#1a3a5c] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => { setLegalPage(null); window.history.pushState({}, '', '/') }} className="text-sm text-gray-400 hover:text-gray-600 mb-4">&larr; Volver al inicio</button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Política de Privacidad</h1>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{PRIVACIDAD}</div>
        </div>
      </div>
    )
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
                <button type="button" onClick={handleForgotPass} className="text-xs text-gray-400 hover:text-blue-600">
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
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#0d2137] via-[#112a47] to-[#1a3a5c] text-white">
        <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/totalapp-logo.jpg" alt="TotalAppGT" className="h-8 w-8 rounded-lg object-cover" />
            <div className="flex items-center gap-2 text-lg font-extrabold tracking-wider">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            LiciTrack<span className="text-cyan-400">GT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('login')} className="text-sm text-white/60 hover:text-white transition">Iniciar sesión</button>
            <button onClick={() => setView('register')} className="text-sm bg-cyan-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-cyan-300 transition">Probar gratis</button>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 pb-20 pt-10 md:pt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full px-4 py-1.5 text-cyan-400 text-xs font-medium mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Monitoreo en tiempo real de Guatecompras
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Encuentra oportunidades antes que tu competencia en{' '}
            <span className="text-cyan-400">Guatecompras</span>
          </h1>
          <p className="text-white/60 mt-5 text-lg max-w-2xl mx-auto leading-relaxed">
            Detecta automáticamente nuevos eventos públicos que coinciden con tu negocio, recibe alertas instantáneas por WhatsApp y correo, y dale seguimiento a tus oportunidades desde un solo lugar.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <button onClick={() => setView('register')} className="bg-cyan-400 text-black px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/30">
              Comenzar gratis →
            </button>
            <button onClick={() => setView('login')} className="bg-white/10 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-white/20 transition border border-white/20">
              Ya tengo cuenta
            </button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center mt-10 text-sm text-white/40">
            <span className="flex items-center gap-1.5"><span className="text-cyan-400 font-bold">✓</span> Sin tarjeta de crédito</span>
            <span className="flex items-center gap-1.5"><span className="text-cyan-400 font-bold">✓</span> Acceso inmediato</span>
            <span className="flex items-center gap-1.5"><span className="text-cyan-400 font-bold">✓</span> Cancela cuando quieras</span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '1.7M+', label: 'Eventos públicos' },
            { value: '700+', label: 'Entidades activas' },
            { value: '24/7', label: 'Monitoreo continuo' },
            { value: '< 5 min', label: 'Activación inmediata' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-[#1a3a5c]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BENEFITS */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <p className="text-cyan-500 font-semibold text-sm tracking-wide uppercase mb-2">¿Por qué LiciTrackGT?</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Todo lo que necesitas para ganar en Guatecompras</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Deja de revisar manualmente cientos de publicaciones. Nuestra IA monitorea por ti y te avisa cuando aparece una oportunidad.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🔍', title: 'Búsqueda inteligente', desc: 'Encuentra eventos por palabra clave, entidad, categoría o monto. Filtros avanzados con resultados instantáneos sobre 1.7 millones de registros.' },
            { icon: '📱', title: 'Alertas en tiempo real', desc: 'Recibe notificaciones por WhatsApp y correo electrónico apenas se publique un evento que coincida con tus intereses. Elige la frecuencia: cada 15 min, 30 min, 1 hora, 6 horas o diario.' },
            { icon: '📊', title: 'Pipeline de seguimiento', desc: 'Organiza tus oportunidades en etapas: detección, análisis, preparación, presentación, adjudicación. Nunca pierdas de vista una licitación importante.' },
            { icon: '📈', title: 'Reportes profesionales', desc: 'Exporta datos en CSV y XLSX con formato profesional. Programa reportes automáticos diarios o semanales que llegan directo a tu correo.' },
            { icon: '👥', title: 'Trabajo en equipo', desc: 'Invita a tu equipo a colaborar. Compartan alertas, pipeline y reportes. Cada quien recibe notificaciones personalizadas en su WhatsApp y correo.' },
            { icon: '🔐', title: 'Datos seguros', desc: 'Autenticación con Google o email. Pagos seguros con Recurrente. Tus datos están protegidos con cifrado HTTPS y almacenamiento en servidores seguros.' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-cyan-200 transition group">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2 group-hover:text-[#1a3a5c] transition">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-cyan-500 font-semibold text-sm tracking-wide uppercase mb-2">Empieza en minutos</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Así de simple es estar un paso adelante</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Crea tu cuenta gratis', desc: 'Regístrate en segundos con Google o tu email. Sin tarjeta de crédito. Accede al instante a 1.7M+ eventos públicos de Guatemala.' },
              { step: '2', title: 'Configura tus alertas', desc: 'Define tus palabras clave, vincula tu WhatsApp y elige la frecuencia. El sistema monitoreará Guatecompras 24/7 por ti.' },
              { step: '3', title: 'Recibe oportunidades', desc: 'Cuando se publique un evento que coincida, recibirás una alerta. Dale seguimiento en tu pipeline y nunca pierdas una oportunidad.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-[#1a3a5c] text-white rounded-2xl flex items-center justify-center text-xl font-extrabold mx-auto mb-4 shadow-lg shadow-[#1a3a5c]/20">{s.step}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-cyan-500 font-semibold text-sm tracking-wide uppercase mb-2">Planes</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Escala con tu empresa</h2>
          <p className="text-gray-500 mt-3">Desde completamente gratis hasta inteligencia de mercado completa. Sin contratos forzosos, cancela cuando quieras.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {planes.map(p => (
            <div key={p.name} className={`relative rounded-2xl border-2 ${colorMap[p.color]} p-5 flex flex-col transition`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-1 rounded-full">Más popular</div>}
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
              <div className="mt-3 mb-4">
                {p.precio === 'Gratis' ? <span className="text-3xl font-extrabold">Gratis</span> : <><span className="text-3xl font-extrabold">{p.precio}</span><span className="text-gray-400 text-sm">/mes</span></>}
              </div>
              <ul className="space-y-2 text-xs text-gray-600 mb-5 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-1.5"><span className="text-green-500 font-bold mt-0.5">✓</span>{f}</li>)}
              </ul>
              <button onClick={() => setView('register')} className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${btnColor[p.color]}`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">Pagos seguros con Recurrente. Factura en Quetzales. Precios en GTQ. Cancela cuando quieras.</p>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#1a3a5c] to-cyan-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">¿Listo para encontrar tu próxima oportunidad?</h2>
          <p className="text-white/70 mt-3">Más de 1.7 millones de eventos te esperan. Empieza hoy, sin costo.</p>
          <button onClick={() => setView('register')} className="mt-8 bg-white text-[#1a3a5c] px-10 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
            Crear cuenta gratis →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#0d2137] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img src="/totalapp-logo.jpg" alt="TotalAppGT" className="h-8 w-8 rounded-lg object-cover" />
                <div>
                  <div className="flex items-center gap-2 text-lg font-extrabold">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    LiciTrack<span className="text-cyan-400">GT</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">Monitoreo inteligente de Guatecompras. Alertas en tiempo real, pipeline de seguimiento y reportes profesionales para tu empresa.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Enlaces</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><button onClick={() => navigateToLegal('terminos')} className="hover:text-white transition text-left">Términos y Condiciones</button></li>
                <li><button onClick={() => navigateToLegal('privacidad')} className="hover:text-white transition text-left">Política de Privacidad</button></li>
                <li><a href="https://wa.me/50258303182" target="_blank" rel="noopener" className="hover:text-white transition">Soporte WhatsApp</a></li>
                <li><a href="mailto:soporte@totalappgt.online" className="hover:text-white transition">soporte@totalappgt.online</a></li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src="/totalapp-logo.jpg" alt="TotalAppGT" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-semibold text-sm">TotalApp<span className="text-cyan-400">GT</span></span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                LiciTrackGT es una marca de <strong className="text-white/70">TotalAppGT</strong>. Soluciones tecnologicas inteligentes para empresas guatemaltecas.
              </p>
            </div>
          </div>
          <hr className="border-white/10 mb-6" />
          <p className="text-center text-xs text-white/30">
            &copy; {new Date().getFullYear()} TotalAppGT. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
