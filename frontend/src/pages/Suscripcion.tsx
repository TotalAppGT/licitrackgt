import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const FEATURES: any = {
  basico: [
    '10 palabras clave de monitoreo',
    'Filtros por periodo, entidad y categoria',
    'Busqueda en 1.7M+ licitaciones',
    'Descarga de resultados (CSV)',
    'Envio de resultados por correo',
    '1 usuario',
  ],
  pro: [
    '50 palabras clave con alertas por correo',
    'Todo lo del plan Basico',
    'Exportacion en Excel (XLSX)',
    'Alertas automaticas por keywords',
    'Hasta 3 usuarios',
    'Monitoreo actualizado cada 6 horas',
  ],
  enterprise: [
    'Palabras clave ilimitadas',
    'Todo lo del plan Pro',
    'Alertas prioritarias (minuto 1)',
    'Acceso API para integraciones',
    'Soporte dedicado',
    'Hasta 10 usuarios',
    'Reportes ejecutivos',
  ],
}

const PLAN_LABELS: any = {
  free: 'Plan actual',
  basico: 'Plan actual',
  pro: 'Plan actual',
  enterprise: 'Plan actual',
}

export default function Suscripcion() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.planes().then(d => setPlans(d.plans)) }, [])

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) { alert('Configurar Recurrente Price ID en backend primero'); return }
    setLoading(true)
    try {
      const res = await api.createCheckout(priceId)
      window.location.href = res.url
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  const planOrder = ['basico', 'pro', 'enterprise']

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800">Planes de LiciTrackGT</h2>
        <p className="text-gray-500 mt-2">Monitoreo inteligente de licitaciones de Guatecompras</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {plans.filter(p => p.id !== 'free').sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id)).map(p => {
          const esActual = user?.plan === p.id
          const destacado = p.id === 'pro'
          return (
            <div key={p.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 p-6 flex flex-col ${esActual ? 'border-blue-500' : destacado ? 'border-[#1a3a5c] shadow-xl' : 'border-gray-100'}`}>
              {destacado && !esActual && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a3a5c] text-white text-xs font-bold px-3 py-1 rounded-full">
                  MAS POPULAR
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-800">{p.name}</h3>
              <div className="mt-3 mb-2">
                <span className="text-4xl font-extrabold text-[#1a3a5c]">Q{p.price}</span>
                <span className="text-gray-400 text-sm">/mes</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Por empresa, factura en Quetzales</p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-8 flex-1">
                {FEATURES[p.id]?.map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              {esActual ? (
                <div className="text-center text-sm font-medium text-green-600 bg-green-50 py-2.5 rounded-xl">Plan actual</div>
              ) : (
                <button onClick={() => handleSubscribe(p.stripe_price_id)} disabled={loading}
                  className={`w-full py-2.5 rounded-xl font-semibold transition disabled:opacity-50 ${destacado ? 'bg-[#1a3a5c] text-white hover:bg-[#2b579a]' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                  {loading ? 'Redirigiendo...' : 'Suscribirse'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="text-center mt-8 text-xs text-gray-400">
        Pagos procesados de forma segura por Recurrente (tarjetas y transferencia)
      </div>
    </div>
  )
}
