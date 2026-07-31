import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const PLANES = [
  {
    id: 'free', name: 'Explorador', price: 0, color: 'gray',
    badge: '',
    features: [
      { text: '5 palabras clave', icon: 'search' },
      { text: 'Busqueda en 1.7M+ licitaciones', icon: 'database' },
      { text: 'Dashboard con graficos', icon: 'chart' },
      { text: 'Filtros avanzados tipo Guatecompras', icon: 'filter' },
    ],
    nope: ['Pipeline de licitaciones', 'Reportes programados', 'Alertas por correo', 'Export XLSX', 'Envio multi-correo'],
  },
  {
    id: 'basico', name: 'Basico', price: 349, color: 'blue',
    badge: '',
    features: [
      { text: '10 palabras clave + alertas', icon: 'bell' },
      { text: '3 licitaciones en Pipeline', icon: 'trello' },
      { text: '1 reporte programado', icon: 'clock' },
      { text: 'Export CSV con streaming', icon: 'download' },
      { text: 'Envio de resultados por correo', icon: 'mail' },
      { text: 'Filtros avanzados completos', icon: 'filter' },
      { text: '1 usuario', icon: 'user' },
    ],
    nope: ['Export XLSX profesional', 'Multi-destinatario', 'Pipeline ilimitado'],
  },
  {
    id: 'pro', name: 'Pro', price: 599, color: 'navy',
    badge: 'MAS POPULAR',
    features: [
      { text: '50 palabras clave + alertas programables', icon: 'bell' },
      { text: '30 licitaciones en Pipeline con etapas', icon: 'trello' },
      { text: '5 reportes programados multi-destinatario', icon: 'clock' },
      { text: 'Export XLSX profesional con formato', icon: 'file' },
      { text: 'Alertas automaticas cada 15 min', icon: 'zap' },
      { text: 'Pipeline con fechas limite y conteo regresivo', icon: 'calendar' },
      { text: 'Hasta 3 usuarios', icon: 'users' },
    ],
    nope: ['Pipeline ilimitado', 'Soporte prioritario', 'API acceso'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 999, color: 'gold',
    badge: '',
    features: [
      { text: 'Keywords, pipeline y reportes ilimitados', icon: 'infinity' },
      { text: 'Pipeline completo con probabilidades', icon: 'trello' },
      { text: 'Alertas en tiempo real (15 min)', icon: 'zap' },
      { text: 'Export XLSX + CSV', icon: 'download' },
      { text: 'Reportes ejecutivos programados', icon: 'briefcase' },
      { text: 'Acceso API para integraciones', icon: 'code' },
      { text: 'Hasta 10 usuarios', icon: 'users' },
      { text: 'Soporte prioritario dedicado', icon: 'headphones' },
    ],
    nope: [],
  },
]

const ICONS: Record<string, string> = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  database: 'M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7M4 7c0-2 1.5-3 3.5-3h9C18.5 4 20 5 20 7M4 7c0 2 1.5 3 3.5 3h9C18.5 10 20 9 20 7',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  filter: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  trello: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2zM17 5h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z',
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  infinity: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  headphones: 'M3 18v-6a9 9 0 0118 0v6m-3 0h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1v7zm-9 0h1a2 2 0 002-2v-3a2 2 0 00-2-2H9v7z',
}

const COLOR_MAP: Record<string, { bg: string; border: string; btn: string; badge: string; icon: string; text: string }> = {
  gray:   { bg: 'bg-gray-50', border: 'border-gray-200', btn: 'bg-gray-100 text-gray-800 hover:bg-gray-200', badge: 'bg-gray-100 text-gray-600', icon: 'text-gray-400', text: 'text-gray-700' },
  blue:   { bg: 'bg-blue-50/60', border: 'border-blue-200', btn: 'bg-blue-600 text-white hover:bg-blue-700', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-500', text: 'text-blue-800' },
  navy:   { bg: 'bg-[#1a3a5c]/5', border: 'border-[#1a3a5c]/30', btn: 'bg-[#1a3a5c] text-white hover:bg-[#2b579a]', badge: 'bg-[#1a3a5c] text-white', icon: 'text-[#1a3a5c]', text: 'text-[#1a3a5c]' },
  gold:   { bg: 'bg-amber-50/60', border: 'border-amber-300', btn: 'bg-amber-600 text-white hover:bg-amber-700', badge: 'bg-amber-100 text-amber-800', icon: 'text-amber-500', text: 'text-amber-800' },
}

export default function Suscripcion() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (priceId: string | undefined) => {
    if (!priceId) { alert('Configurar antes en backend'); return }
    setLoading(true)
    try {
      const res = await api.createCheckout(priceId)
      window.location.href = res.url
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  const planOrder = ['free', 'basico', 'pro', 'enterprise']

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900">Planes que crecen contigo</h2>
        <p className="text-gray-500 mt-3 text-lg max-w-xl mx-auto">
          Desde exploracion gratuita hasta inteligencia de mercado completa. Sin contratos, cancela cuando quieras.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 items-start">
        {planOrder.map(pid => {
          const p = PLANES.find(x => x.id === pid)!
          const c = COLOR_MAP[p.color]
          const esActual = user?.plan === p.id
          const priceId = p.id === 'free' ? undefined : ['basico','pro','enterprise'].includes(p.id) ? (p.id === 'basico' ? 'price_lltzdrus' : p.id === 'pro' ? 'price_kyqlcwp6' : 'price_n2pdn7xh') : undefined

          return (
            <div key={p.id}
              className={`relative rounded-2xl ${c.bg} border-2 ${esActual ? 'border-green-400 shadow-lg' : c.border} p-5 flex flex-col transition-all duration-300 hover:shadow-xl`}>
              {p.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${c.badge} text-xs font-extrabold px-4 py-1 rounded-full tracking-wider`}>
                  {p.badge}
                </div>
              )}

              <h3 className={`text-lg font-bold ${c.text}`}>{p.name}</h3>
              <div className="mt-2 mb-1">
                {p.price === 0 ? (
                  <span className="text-3xl font-extrabold text-gray-900">Gratis</span>
                ) : (
                  <><span className="text-3xl font-extrabold text-gray-900">Q{p.price}</span><span className="text-gray-400 text-sm">/mes</span></>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-5">Factura en Quetzales</p>

              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className={`w-4 h-4 ${c.icon} mt-0.5 shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS[f.icon]} />
                    </svg>
                    {f.text}
                  </li>
                ))}
                {p.nope.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300 line-through">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {esActual ? (
                <div className="text-center text-sm font-semibold text-green-700 bg-green-100 py-2.5 rounded-xl">Tu plan actual</div>
              ) : (
                <button onClick={() => handleSubscribe(priceId)} disabled={loading || p.price === 0}
                  className={`w-full py-2.5 rounded-xl font-semibold transition disabled:opacity-40 text-sm ${p.price === 0 ? 'bg-gray-200 text-gray-500 cursor-default' : c.btn}`}>
                  {p.price === 0 ? 'Gratis' : loading ? 'Redirigiendo...' : `Suscribirse a ${p.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-center mt-10 space-y-2">
        <p className="text-xs text-gray-400">Pagos procesados de forma segura por Recurrente (Visa, Mastercard, transferencias). Precios en Quetzales sin IVA.</p>
        <p className="text-xs text-gray-400">Sin contratos forzosos. Cambia o cancela tu plan cuando quieras desde tu perfil.</p>
      </div>
    </div>
  )
}
