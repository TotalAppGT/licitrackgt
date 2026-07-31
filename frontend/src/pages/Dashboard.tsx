import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface Stats { total: number; entidades: number; monto_prom: number; total_2026: number; entidades_top: any[]; categorias_top: any[] }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (!stats) return <div className="text-center py-20 text-gray-400">Sin datos</div>

  const cards = [
    { label: 'Total Licitaciones', value: stats.total.toLocaleString(), color: '#1a3a5c' },
    { label: 'Entidades', value: stats.entidades.toLocaleString(), color: '#2b579a' },
    { label: 'Monto Promedio', value: 'Q' + Math.round(stats.monto_prom).toLocaleString(), color: '#27ae60' },
    { label: 'En 2026', value: stats.total_2026.toLocaleString(), color: '#e67e22' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Top 15 Entidades</h3>
          <div className="space-y-2">
            {stats.entidades_top.slice(0, 10).map((e: any) => (
              <div key={e.nombre} className="flex items-center gap-3">
                <div className="flex-1 text-sm truncate">{e.nombre}</div>
                <div className="text-sm font-semibold text-blue-600">{e.cantidad.toLocaleString()}</div>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (e.cantidad / stats.entidades_top[0]?.cantidad) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Categorias</h3>
          <div className="space-y-3">
            {stats.categorias_top.map((c: any) => (
              <div key={c.nombre} className="flex items-center justify-between">
                <span className="text-sm capitalize">{c.nombre}</span>
                <span className="text-sm font-semibold">{c.cantidad.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
