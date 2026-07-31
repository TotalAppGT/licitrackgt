import { useEffect, useState } from 'react'
import { api } from '../api/client'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface Stats { total: number; entidades: number; monto_prom: number; total_2026: number; entidades_top: any[]; categorias_top: any[]; por_mes: any[]; por_departamento: any[] }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (!stats) return <div className="text-center py-20 text-gray-400">Sin datos</div>

  const cards = [
    { label: 'Total de licitaciones', value: stats.total.toLocaleString(), color: '#1a3a5c' },
    { label: 'Entidades', value: stats.entidades.toLocaleString(), color: '#2b579a' },
    { label: 'Monto promedio', value: 'Q' + Math.round(stats.monto_prom).toLocaleString(), color: '#27ae60' },
    { label: 'En 2026', value: stats.total_2026.toLocaleString(), color: '#e67e22' },
  ]

  const maxMes = Math.max(...(stats.por_mes.map(m => m.cantidad) || [1]))
  const maxDep = Math.max(...(stats.por_departamento.map(d => d.cantidad) || [1]))

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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Licitaciones por mes 2026</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.por_mes.map(m => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] font-semibold text-gray-500">{m.cantidad.toLocaleString()}</div>
                <div className="w-full bg-gradient-to-t from-[#1a3a5c] to-[#2b579a] rounded-t"
                  style={{ height: `${Math.max(4, (m.cantidad / maxMes) * 100)}%` }}></div>
                <div className="text-[10px] text-gray-400">{MESES[m.mes - 1]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Principales departamentos</h3>
          <div className="space-y-2">
            {stats.por_departamento.slice(0, 8).map((d: any) => (
              <div key={d.nombre} className="flex items-center gap-3">
                <div className="flex-1 text-sm truncate">{d.nombre}</div>
                <div className="text-sm font-semibold text-blue-600">{d.cantidad.toLocaleString()}</div>
                <div className="w-24 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (d.cantidad / maxDep) * 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Principales entidades</h3>
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
          <h3 className="font-bold text-gray-800 mb-4">Categorías</h3>
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
