import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function Suscripcion() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.planes().then(d => setPlans(d.plans)) }, [])

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) { alert('Configurar Stripe Price ID en backend primero'); return }
    setLoading(true)
    try {
      const res = await api.createCheckout(priceId)
      window.location.href = res.url
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-800">Planes</h2>
        <p className="text-gray-500 mt-1">Elige el plan que mejor se adapte a tu empresa</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl shadow-sm border-2 p-6 ${user?.plan === p.id ? 'border-blue-500' : 'border-gray-100'}`}>
            <h3 className="text-lg font-bold text-gray-800">{p.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-extrabold text-[#1a3a5c]">Q{p.price}</span>
              <span className="text-gray-400 text-sm">/mes</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {p.keywords} palabras clave
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Hasta {p.users} usuarios
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Monitoreo diario
              </li>
            </ul>
            {user?.plan === p.id ? (
              <div className="text-center text-sm font-medium text-green-600 bg-green-50 py-2 rounded-xl">Plan actual</div>
            ) : p.price === 0 ? (
              <div className="text-center text-sm text-gray-400 py-2">Plan gratuito</div>
            ) : (
              <button onClick={() => handleSubscribe(p.stripe_price_id)} disabled={loading}
                className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-xl font-semibold hover:bg-[#2b579a] transition disabled:opacity-50">
                {loading ? 'Redirigiendo...' : 'Suscribirse'}
              </button>
            )}
          </div>
        ))}
      </div>
      {user?.plan !== 'free' && user?.plan !== 'enterprise' && (
        <div className="text-center mt-8">
          <a href={import.meta.env.DEV ? 'http://localhost:8000/api/payments/portal' : '/api/payments/portal'}
            className="text-sm text-blue-600 hover:underline">Gestionar suscripcion en Stripe</a>
        </div>
      )}
    </div>
  )
}
