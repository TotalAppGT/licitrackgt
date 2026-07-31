import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { toast } from '../components/Toast'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const HORAS = Array.from({ length: 24 }, (_, i) => i)

export default function Alertas() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [limite, setLimite] = useState(5)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [editHora, setEditHora] = useState<number | null>(null)
  const [editDias, setEditDias] = useState<string>('1,2,3,4,5')
  const [editFrec, setEditFrec] = useState<string>('diario')

  const cargar = () => {
    api.misAlertas().then(d => { setAlerts(d.alerts || []); setLimite(d.limite || 5) }).catch(() => {})
  }
  useEffect(cargar, [])

  const agregar = async () => {
    if (!keyword.trim()) return
    setLoading(true)
    try { await api.crearAlerta(keyword.trim()); setKeyword(''); cargar() }
    catch (e: any) { toast.show(e.message, 'error') }
    finally { setLoading(false) }
  }

  const eliminar = async (id: number) => {
    try { await api.eliminarAlerta(id); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const abrirEditar = (a: any) => {
    setEditing(a.id); setEditHora(a.hora_envio ?? null); setEditDias(a.dias_envio || '1,2,3,4,5')
  }

  const guardarSchedule = async (id: number) => {
    try { await api.actualizarAlerta(id, editHora, editDias, editFrec); setEditing(null); cargar() }
    catch (e: any) { toast.show(e.message, 'error') }
  }

  const toggleDia = (dia: string) => {
    const arr = (editDias || '').split(',').filter(d => d.trim())
    const idx = arr.indexOf(dia)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(dia)
    setEditDias(arr.sort((a, b) => parseInt(a) - parseInt(b)).join(','))
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Mis Palabras Clave</h3>
            <span className="text-xs text-gray-400">{alerts.length} / {limite}</span>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              <input type="text" value={keyword} placeholder="Ej: equipo medico, construccion, consultoria..."
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregar()}
                className="flex-1 text-sm border rounded-lg p-2.5" />
              <button onClick={agregar} disabled={loading}
                className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2b579a] transition disabled:opacity-50 text-sm">
                + Agregar
              </button>
            </div>
          </div>

          <div className="divide-y">
            {alerts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Aún no tienes palabras clave. Agrega la primera y recibe alertas.
              </div>
            ) : alerts.map(a => (
              <div key={a.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{a.keyword}</span>
                    {a.hora_envio !== null && a.hora_envio !== undefined ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {String(a.hora_envio).padStart(2, '0')}:00
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{a.frecuencia || 'diario'}</span>
                    )}
                    {a.dias_envio && a.dias_envio !== '1,2,3,4,5' && (
                      <span className="text-xs text-gray-400">
                        {a.dias_envio.split(',').map((d: string) => DIAS_SEMANA[parseInt(d)]).join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(a)}
                      className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition">
                      {a.hora_envio !== null ? 'Horario' : 'Programar'}
                    </button>
                    <button onClick={() => eliminar(a.id)}
                      className="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded transition">Eliminar</button>
                  </div>
                </div>

                {editing === a.id && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200 animate-slide-down">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Configurar horario de envío</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500">Hora de envío</label>
                        <select value={editHora === null ? 'none' : editHora}
                          onChange={e => setEditHora(e.target.value === 'none' ? null : parseInt(e.target.value))}
                          className="w-full text-xs border rounded-lg p-2 mt-1">
                          <option value="none">Inmediato</option>
                          {HORAS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Días de la semana</label>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {DIAS_SEMANA.map((d, i) => (
                            <button key={i} onClick={() => toggleDia(String(i))}
                              className={`text-xs px-2 py-1 rounded-full border transition ${
                                (editDias || '').split(',').includes(String(i))
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                              }`}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Frecuencia</label>
                        <select value={editFrec} onChange={e => setEditFrec(e.target.value)}
                          className="w-full text-xs border rounded-lg p-2 mt-1">
                          <option value="15min">Cada 15 minutos</option>
                          <option value="30min">Cada 30 minutos</option>
                          <option value="1hora">Cada hora</option>
                          <option value="6horas">Cada 6 horas</option>
                          <option value="diario">Una vez al dia</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 justify-end">
                      <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 border rounded-lg">Cancelar</button>
                      <button onClick={() => guardarSchedule(a.id)}
                        className="text-xs px-3 py-1.5 bg-[#1a3a5c] text-white rounded-lg">Guardar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-6">
          <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase">Reportes programados</h4>
          <ReportesProgramados />
          <hr className="my-4" />
          <div className="text-xs text-gray-500 space-y-2">
            <p><b>Palabras clave:</b> detectan licitaciones por coincidencia en el titulo.</p>
            <p><b>Inmediato:</b> se enviarán en cada ciclo de actualizacion (cada 15 min).</p>
            <p><b>Programado:</b> se enviarán solo a la hora y dias que configures.</p>
            <p className="text-blue-600 font-medium">Plan Pro: hasta 50 palabras clave + 5 reportes programados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportesProgramados() {
  const [items, setItems] = useState<any[]>([])
  const [limite, setLimite] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ hora: 8, dias: '1,2,3,4,5', recipients: '', keywords: '', anio: 2026, mes: new Date().getMonth() + 1 })

  const cargar = () => {
    api.scheduledReports().then(d => { setItems(d.items || []); setLimite(d.limite || 0) }).catch(() => {})
  }
  useEffect(cargar, [])

  const crear = async () => {
    try { await api.createScheduledReport(form); setShowForm(false); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const toggle = async (id: number) => {
    try { await api.toggleScheduledReport(id); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const eliminar = async (id: number) => {
    try { await api.deleteScheduledReport(id); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  if (limite <= 0) return <p className="text-xs text-gray-400 text-center py-4">No disponible en tu plan actual.</p>

  return (
    <div className="space-y-2">
      {items.map(r => (
        <div key={r.id} className="flex items-center justify-between text-xs border rounded-lg p-2">
          <div>
            <span className="font-medium">{String(r.hora).padStart(2, '0')}:00</span>
            {r.keywords && <span className="text-gray-500 ml-2 truncate max-w-[120px] inline-block align-bottom">{r.keywords}</span>}
            {r.ultimo_envio && <span className="text-gray-400 ml-1 block text-[10px]">Ult: {r.ultimo_envio}</span>}
          </div>
          <div className="flex gap-1">
            <button onClick={() => toggle(r.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {r.enabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => eliminar(r.id)} className="text-red-400 hover:text-red-600 text-[10px]">x</button>
          </div>
        </div>
      ))}
      {items.length < limite && (
        <button onClick={() => setShowForm(true)}
          className="w-full text-xs border border-dashed border-gray-300 rounded-lg py-2 text-gray-400 hover:border-blue-400 hover:text-blue-600 transition">
          + Nuevo reporte
        </button>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">Hora (0-23)</label>
              <select value={form.hora} onChange={e => setForm({ ...form, hora: parseInt(e.target.value) })}
                className="w-full text-xs border rounded p-1 mt-0.5">
                {HORAS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Anio/Mes</label>
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: parseInt(e.target.value) || 2026 })}
                  className="w-full text-xs border rounded p-1" placeholder="2026" />
                <input type="number" value={form.mes} onChange={e => setForm({ ...form, mes: parseInt(e.target.value) || 8 })}
                  className="w-full text-xs border rounded p-1" placeholder="7" min={1} max={12} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Palabras clave (separadas por coma)</label>
            <input type="text" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })}
              className="w-full text-xs border rounded p-1 mt-0.5" placeholder="hospital, equipo medico" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Destinatarios (separados por coma)</label>
            <input type="text" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })}
              className="w-full text-xs border rounded p-1 mt-0.5" placeholder="correo1@gmail.com, correo2@gmail.com" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-[10px] px-2 py-1 border rounded">Cancelar</button>
            <button onClick={crear} className="text-[10px] px-2 py-1 bg-[#1a3a5c] text-white rounded">Crear</button>
          </div>
        </div>
      )}
    </div>
  )
}
