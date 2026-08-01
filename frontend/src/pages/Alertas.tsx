import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { toast } from '../components/Toast'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const HORAS = Array.from({ length: 24 }, (_, i) => i)
const FREQ_LABELS: Record<string, string> = {
  '15min': '15 min', '30min': '30 min', '1hora': '1 hora',
  '6horas': '6 horas', 'diario': 'Diario'
}

export default function Alertas() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [limite, setLimite] = useState(5)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [editHora, setEditHora] = useState<number | null>(null)
  const [editDias, setEditDias] = useState<string>('1,2,3,4,5')
  const [editFrec, setEditFrec] = useState<string>('diario')
  const [testing, setTesting] = useState<number | null>(null)

  const cargar = () => {
    api.misAlertas().then(d => { setAlerts(d.alerts || []); setLimite(d.limite || 5) }).catch(() => {})
  }
  useEffect(cargar, [])

  const agregar = async () => {
    const kw = keyword.trim()
    if (!kw) { toast.show('Escribe una palabra clave primero', 'warning'); return }
    setLoading(true)
    try { await api.crearAlerta(kw); setKeyword(''); cargar(); toast.show('Palabra clave agregada', 'success') }
    catch (e: any) {
      const msg = e.message || ''
      if (msg.includes('registrada')) toast.show('Ya tienes esta palabra clave', 'warning')
      else if (msg.includes('alcanzado')) toast.show('Llegaste al limite de tu plan', 'warning')
      else toast.show(msg, 'error')
    }
    finally { setLoading(false) }
  }

  const eliminar = async (id: number) => {
    try { await api.eliminarAlerta(id); cargar() } catch (e: any) { toast.show(e.message, 'error') }
  }

  const abrirEditar = (a: any) => {
    setEditing(a.id); setEditHora(a.hora_envio ?? null); setEditDias(a.dias_envio || '1,2,3,4,5'); setEditFrec(a.frecuencia || 'diario')
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

  const testKeyword = async (id: number) => {
    setTesting(id)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/alerts/${id}/test`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.email && data.whatsapp) toast.show(`Prueba enviada: ${data.registros || 0} coincidencias por correo y WhatsApp`, 'success')
      else if (data.email) toast.show(`Correo enviado con ${data.registros || 0} coincidencias`, 'success')
      else toast.show(data.error || 'Error en la prueba', 'error')
    } catch (e: any) { toast.show(e.message, 'error') }
    finally { setTesting(null) }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Palabras Clave</h3>
              <p className="text-xs text-gray-400 mt-0.5">Detectan eventos por coincidencia en el título</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${alerts.length >= limite ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {alerts.length} / {limite}
            </span>
          </div>
          <div className="flex gap-2">
            <input type="text" value={keyword} placeholder="Escribe una palabra o frase..."
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregar()}
              className="flex-1 text-sm border rounded-xl p-2.5 focus:ring-2 focus:ring-blue-200 outline-none" />
            <button onClick={agregar} disabled={loading}
              className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#2b579a] transition disabled:opacity-50 text-sm">
              + Agregar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm">Aún no tienes palabras clave</p>
              <p className="text-xs mt-1">Agrega la primera arriba para empezar a recibir alertas</p>
            </div>
          ) : alerts.map(a => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-bold text-gray-900">{a.keyword}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                      {FREQ_LABELS[a.frecuencia || 'diario']}
                    </span>
                    {a.hora_envio !== null && a.hora_envio !== undefined && (
                      <span className="text-[11px] text-gray-500">
                        {String(a.hora_envio).padStart(2, '0')}:00
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 7 }, (_, i) => (
                        <span key={i} className={`w-5 h-5 text-[9px] flex items-center justify-center rounded font-medium ${
                          (a.dias_envio || '1,2,3,4,5').split(',').includes(String(i))
                            ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`} title={DIAS_SEMANA[i]}>
                          {DIAS_SEMANA[i][0]}
                        </span>
                      ))}
                    </div>
                    {a.ultimo_envio && (
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        Último: {new Date(a.ultimo_envio).toLocaleString('es-GT', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => testKeyword(a.id)} disabled={testing === a.id}
                    className="text-[11px] bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-500 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"
                    title="Enviar prueba de esta palabra clave por correo y WhatsApp">
                    {testing === a.id ? (
                      <span className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    Probar
                  </button>
                  <button onClick={() => abrirEditar(a)}
                    className="text-[11px] bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg transition">
                    Editar
                  </button>
                  <button onClick={() => eliminar(a.id)}
                    className="text-[11px] text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                    Eliminar
                  </button>
                </div>
              </div>

              {editing === a.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Configurar envío</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500">Hora de envío</label>
                      <select value={editHora === null ? 'none' : editHora}
                        onChange={e => setEditHora(e.target.value === 'none' ? null : parseInt(e.target.value))}
                        className="w-full text-xs border rounded-lg p-2 mt-1">
                        <option value="none">Inmediato (según frecuencia)</option>
                        {HORAS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500">Frecuencia</label>
                      <select value={editFrec} onChange={e => setEditFrec(e.target.value)}
                        className="w-full text-xs border rounded-lg p-2 mt-1">
                        <option value="15min">Cada 15 minutos</option>
                        <option value="30min">Cada 30 minutos</option>
                        <option value="1hora">Cada hora</option>
                        <option value="6horas">Cada 6 horas</option>
                        <option value="diario">Una vez al día</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-500">Días</label>
                      <div className="flex gap-0.5 mt-1">
                        {DIAS_SEMANA.map((d, i) => (
                          <button key={i} onClick={() => toggleDia(String(i))}
                            className={`w-6 h-6 text-[9px] flex items-center justify-center rounded transition ${
                              (editDias || '').split(',').includes(String(i))
                                ? 'bg-blue-600 text-white' : 'bg-white border text-gray-500 hover:border-blue-300'
                            }`} title={d}>
                            {d[0]}
                          </button>
                        ))}
                      </div>
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

      <div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
          <h4 className="font-semibold text-sm text-gray-600 mb-4 uppercase">Reportes Programados</h4>
          <ReportesProgramados />
          <hr className="my-4" />
          <div className="text-xs text-gray-500 space-y-2">
            <p><b>Palabras clave:</b> detectan eventos por coincidencia en el título.</p>
            <p><b>Frecuencia:</b> cada cuánto se revisan coincidencias (15 min a 1 día).</p>
            <p><b>Prueba:</b> haz clic en Probar para recibir un mensaje de prueba al instante.</p>
            <p className="text-blue-600 font-medium">Plan {alerts.length >= limite ? 'agotado' : 'activo'}: {alerts.length} de {limite} palabras clave.</p>
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
        <div key={r.id} className="flex items-center justify-between text-xs border rounded-lg p-2.5 hover:bg-gray-50">
          <div>
            <span className="font-semibold">{String(r.hora).padStart(2, '0')}:00</span>
            {r.keywords && <span className="text-gray-500 ml-2">{r.keywords}</span>}
            {r.ultimo_envio && <span className="text-gray-400 ml-2 text-[10px]">Últ: {r.ultimo_envio.slice(5, 16)}</span>}
          </div>
          <div className="flex gap-1 items-center">
            {r.recipients && <span className="text-[10px] text-blue-600">{r.recipients.split(',')[0]}{r.recipients.split(',').length > 1 ? '+' + (r.recipients.split(',').length - 1) : ''}</span>}
            <button onClick={() => toggle(r.id)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {r.enabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => eliminar(r.id)} className="text-red-400 hover:text-red-600 ml-1">x</button>
          </div>
        </div>
      ))}
      {items.length < limite && (
        <button onClick={() => setShowForm(true)}
          className="w-full text-xs border border-dashed border-gray-300 rounded-lg py-2.5 text-gray-400 hover:border-blue-400 hover:text-blue-600 transition">
          + Nuevo reporte programado
        </button>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">Hora (0-23)</label>
              <select value={form.hora} onChange={e => setForm({ ...form, hora: parseInt(e.target.value) })} className="w-full text-xs border rounded p-1.5 mt-0.5">
                {HORAS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Año / Mes</label>
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: parseInt(e.target.value) || 2026 })} className="w-full text-xs border rounded p-1.5" />
                <input type="number" value={form.mes} onChange={e => setForm({ ...form, mes: parseInt(e.target.value) || 1 })} className="w-full text-xs border rounded p-1.5" min={1} max={12} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Palabras clave (separadas por coma)</label>
            <input type="text" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} className="w-full text-xs border rounded p-1.5 mt-0.5" placeholder="hospital, construccion" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Destinatarios (separados por coma)</label>
            <input type="text" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} className="w-full text-xs border rounded p-1.5 mt-0.5" placeholder="correo1@gmail.com" />
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
