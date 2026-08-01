import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { toast } from '../components/Toast'

const ETAPAS = ['deteccion', 'analisis', 'preparacion', 'presentacion', 'adjudicacion', 'ganada', 'perdida']
const ETAPA_LABEL: Record<string, string> = {
  deteccion: 'Detección',
  analisis: 'Análisis',
  preparacion: 'Preparación',
  presentacion: 'Presentación',
  adjudicacion: 'Adjudicación',
  ganada: 'Ganada',
  perdida: 'Perdida',
}
const ETAPA_COLOR: Record<string, string> = {
  deteccion: 'bg-gray-100 text-gray-700',
  analisis: 'bg-blue-100 text-blue-700',
  preparacion: 'bg-yellow-100 text-yellow-700',
  presentacion: 'bg-purple-100 text-purple-700',
  adjudicacion: 'bg-orange-100 text-orange-700',
  ganada: 'bg-green-100 text-green-700',
  perdida: 'bg-red-100 text-red-700',
}

function diasFaltan(fecha: string) {
  if (!fecha) return null
  const d = (new Date(fecha).getTime() - Date.now()) / 86400000
  return Math.ceil(d)
}

export default function Pipeline() {
  const [items, setItems] = useState<any[]>([])
  const [limite, setLimite] = useState(10)
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nog: '', titulo: '', entidad: '', monto: 0, fecha: '' })
  const [loading, setLoading] = useState(false)

  const cargar = () => {
    api.pipeline().then(d => { setItems(d.items || []); setLimite(d.limite || 10) })
    api.deadlines().then(d => setDeadlines(d.deadlines || [])).catch(() => {})
  }
  useEffect(cargar, [])

  const agregar = async () => {
    if (!form.nog.trim()) return
    setLoading(true)
    try { await api.addPipeline({ nog: form.nog.trim(), titulo: form.titulo, entidad: form.entidad, monto: form.monto, fecha: form.fecha }); setShowAdd(false); setForm({ nog: '', titulo: '', entidad: '', monto: 0, fecha: '' }); cargar() }
    catch (e: any) { toast.show(e.message, 'error') }
    finally { setLoading(false) }
  }

  const cambiarEtapa = async (id: number, etapa: string) => {
    try { await api.updatePipeline(id, { etapa }); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const actualizar = async (id: number, data: any) => {
    try { await api.updatePipeline(id, data); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const eliminar = async (id: number) => {
    if (!confirm('Eliminar este evento del pipeline?')) return
    try { await api.deletePipeline(id); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase tracking-wide">¿Cómo funciona?</h4>
          <div className="text-xs text-gray-500 space-y-2">
            <p><b>Etapas:</b> mueve cada evento según su avance: Detección → Análisis → Preparación → Presentación → Adjudicación.</p>
            <p><b>Fecha de presentación:</b> cuándo debes entregar tu oferta. El sistema te avisa 3 días antes por correo y WhatsApp.</p>
            <p><b>Probabilidad:</b> qué tan probable crees que es ganar (0-100%). Te ayuda a priorizar.</p>
            <p><b>Monto propuesto:</b> cuánto planeas ofertar.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-full bg-[#1a3a5c] text-white py-2 rounded-lg font-medium hover:bg-[#2b579a] transition text-sm">
            + Agregar evento
          </button>
          <p className="text-xs text-gray-400 mt-2">{items.length} / {limite} eventos</p>

          <div className="mt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Próximas a vencer</p>
            {deadlines.length === 0 ? (
              <p className="text-xs text-gray-400">Sin fechas de presentación</p>
            ) : deadlines.map(d => {
              const dias = diasFaltan(d.fecha_presentacion)
              return (
                <div key={d.nog} className={`text-xs p-2 rounded-lg ${dias && dias <= 3 ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                  <div className="font-medium truncate">{d.titulo || d.nog}</div>
                  <div className={dias && dias <= 3 ? 'text-red-600 font-bold' : 'text-gray-500'}>
                    {dias !== null && dias > 0 ? `${dias} días` : dias === 0 ? 'HOY' : 'Vencida'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
            {ETAPAS.map(e => (
              <span key={e} className={`text-xs px-3 py-1 rounded-full font-medium ${ETAPA_COLOR[e]}`}>
                  {ETAPA_LABEL[e]} ({items.filter(i => i.etapa === e).length})
              </span>
            ))}
          </div>

          <div className="divide-y">
            {items.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                Agrega eventos desde Filtros para hacerles seguimiento aquí.
              </div>
            ) : items.map(item => {
              const dias = diasFaltan(item.fecha_presentacion)
              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`https://guatecompras.gt/procesos/${item.nog}`} target="_blank" rel="noopener"
                          className="text-xs font-mono text-blue-600 hover:underline">{item.nog}</a>
                        <select value={item.etapa} onChange={e => cambiarEtapa(item.id, e.target.value)}
                          className={`text-xs px-2 py-0.5 rounded-full border-0 font-medium cursor-pointer ${ETAPA_COLOR[item.etapa]}`}>
                          {ETAPAS.map(e => <option key={e} value={e}>{ETAPA_LABEL[e]}</option>)}
                        </select>
                        {item.probabilidad > 0 && (
                          <span className="text-xs text-gray-500">{item.probabilidad}% prob.</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 line-clamp-2">{item.titulo}</p>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        {item.entidad && <span>{item.entidad}</span>}
                        {item.monto > 0 && <span className="font-semibold text-blue-700">Q{item.monto.toLocaleString()}</span>}
                        {item.fecha_publicacion && <span>Pub: {item.fecha_publicacion}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                        <input type="date" value={item.fecha_presentacion || ''}
                          onChange={e => actualizar(item.id, { fecha_presentacion: e.target.value })}
                          className="text-xs border rounded px-2 py-1 w-[130px]" title="Fecha de presentación de la oferta" />
                        <button onClick={() => eliminar(item.id)}
                          className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition">Quitar</button>
                      </div>
                      {dias !== null && dias >= 0 && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${dias <= 3 ? 'bg-red-100 text-red-700' : dias <= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {dias === 0 ? 'HOY' : `${dias} días`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">Monto propuesto (Q)</label>
                      <input type="number" value={item.monto_propuesto || ''}
                        onChange={e => actualizar(item.id, { monto_propuesto: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs border rounded px-2 py-1 mt-0.5" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Probabilidad (0-100)</label>
                      <input type="range" min={0} max={100} value={item.probabilidad || 0}
                        onChange={e => actualizar(item.id, { probabilidad: parseInt(e.target.value) })}
                        className="w-full mt-0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Notas</label>
                      <input type="text" value={item.notas || ''}
                        onChange={e => actualizar(item.id, { notas: e.target.value })}
                        className="w-full text-xs border rounded px-2 py-1 mt-0.5" placeholder="..." />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Agregar al pipeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">NOG *</label>
                <input type="text" value={form.nog} onChange={e => setForm({ ...form, nog: e.target.value })}
                  className="w-full text-sm border rounded-lg p-2 mt-1" placeholder="GT-NOG-..." />
              </div>
              <div>
                <label className="text-xs text-gray-500">Titulo</label>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Entidad</label>
                  <input type="text" value={form.entidad} onChange={e => setForm({ ...form, entidad: e.target.value })}
                    className="w-full text-sm border rounded-lg p-2 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Monto (Q)</label>
                  <input type="number" value={form.monto || ''} onChange={e => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border rounded-lg p-2 mt-1" />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border rounded-lg">Cancelar</button>
                <button onClick={agregar} disabled={loading}
                  className="px-4 py-2 text-sm bg-[#1a3a5c] text-white rounded-lg disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
