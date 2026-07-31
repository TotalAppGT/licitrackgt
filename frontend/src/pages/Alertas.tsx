import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function Alertas() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [limite, setLimite] = useState(5)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const cargar = () => {
    api.misAlertas().then(d => { setAlerts(d.alerts || []); setLimite(d.limite || 5) }).catch(() => {})
  }
  useEffect(cargar, [])

  const agregar = async () => {
    if (!keyword.trim()) return
    setLoading(true)
    try {
      await api.crearAlerta(keyword.trim())
      setKeyword('')
      cargar()
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  const eliminar = async (id: number) => {
    try { await api.eliminarAlerta(id); cargar() } catch (e: any) { alert(e.message) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Alertas por keywords</h2>
        <p className="text-gray-500 mt-1">Recibe un correo cada vez que se publique una licitacion que coincida con tus keywords</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-2">
          <input type="text" value={keyword} placeholder="Ej: equipo medico, construccion, consultoria..."
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregar()}
            className="flex-1 text-sm border rounded-lg p-2.5" />
          <button onClick={agregar} disabled={loading}
            className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2b579a] transition disabled:opacity-50">
            {loading ? 'Guardando...' : 'Agregar'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{alerts.length} / {limite} keywords usadas de tu plan</p>

        <div className="mt-6 space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Aun no tienes keywords. Agrega la primera arriba.</div>
          ) : alerts.map(a => (
            <div key={a.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-gray-700">{a.keyword}</span>
              <button onClick={() => eliminar(a.id)}
                className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">Eliminar</button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-4 text-xs text-blue-800">
          <b>Como funciona:</b> LiciTrackGT revisa el mes en curso y al detectar licitaciones nuevas que contengan tu keyword en el titulo,
          te envia un correo con el NOG, el monto y el enlace directo en Guatecompras.
          Disponible en planes <b>Pro</b> y <b>Enterprise</b>.
        </div>
      </div>
    </div>
  )
}
