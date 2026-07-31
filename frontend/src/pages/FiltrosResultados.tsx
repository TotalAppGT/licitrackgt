import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { toast } from '../components/Toast'

const MESES_NOMBRE = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function useCountdown() {
  const [next, setNext] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const s = await api.extraccionStatus()
        if (alive) setNext(s.next_refresh_at ? new Date(s.next_refresh_at).getTime() : null)
      } catch { /* ignore */ }
    }
    tick()
    const id = setInterval(tick, 60000)
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => { alive = false; clearInterval(id); clearInterval(t) }
  }, [])
  const ms = next ? Math.max(0, next - now) : 0
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { h, m, s, hasNext: next != null }
}

export default function FiltrosResultados() {
  const [filters, setFilters] = useState<any>({})
  const [results, setResults] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [opciones, setOpciones] = useState<any>({ estados: [], categorias: [], departamentos: [], metodos: [], modalidades: [] })
  const [meses, setMeses] = useState<any[]>([])
  const [exporting, setExporting] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [destinatario, setDestinatario] = useState('')
  const { h, m, s, hasNext } = useCountdown()

  useEffect(() => {
    api.opciones().then(setOpciones)
    api.meses().then(d => setMeses(d.meses || [])).catch(() => {})
  }, [])

  const search = async (p = 1) => {
    setLoading(true); setPage(p)
    try { setResults(await api.licitaciones(filters, p)) }
    finally { setLoading(false) }
  }

  const download = async (tipo: 'csv' | 'xlsx') => {
    setExporting(tipo)
    try { await (tipo === 'csv' ? api.exportCsv(filters) : api.exportXlsx(filters)) }
    catch (e: any) { toast.show(e.message, 'error') }
    finally { setExporting(null) }
  }

  const addToPipeline = async (row: any) => {
    try {
      await api.addPipeline({ nog: row.nog, titulo: row.titulo || '', entidad: row.entidad || '', monto: row.monto || 0, fecha: row.fecha || '' })
      toast.show('Agregado al pipeline', 'success')
    } catch (e: any) { toast.show(e.message, 'error') }
  }

  const sendEmail = async () => {
    setSending(true)
    try {
      const res = await api.enviarResultados(filters, destinatario)
      toast.show(`Correo enviado a ${res.enviado_a} con ${res.registros} registros`, 'success')
    } catch (e: any) { toast.show(e.message, 'error') }
    finally { setSending(false) }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => { const n = { ...prev }; if (value) n[key] = value; else delete n[key]; return n })
  }

  const totalPages = results ? Math.ceil(results.total / 50) : 0

  const FiltroSelect = ({ label, opciones: opts, keyName, vacioLabel }: any) => (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <select onChange={e => updateFilter(keyName, e.target.value)} className="w-full text-sm border rounded-lg p-2 mt-1">
        <option value="">{vacioLabel}</option>
        {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-20 overflow-y-auto max-h-[calc(100vh-120px)]">
          <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase tracking-wide">Filtros</h4>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            {hasNext ? (
              <>
                <span className="text-xs text-blue-800 font-medium">Próxima actualización:</span>
                <span className="font-mono text-sm text-blue-700 tabular-nums">
                  {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </span>
                <span className="ml-auto text-blue-400 text-xs">cada 6h</span>
              </>
            ) : (
              <span className="text-xs text-blue-800">Calculando próxima actualización...</span>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Periodo (anio/mes)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select onChange={e => updateFilter('anio', e.target.value)}
                  className="text-sm border rounded-lg p-2">
                  <option value="">Anio</option>
                  {Array.from(new Set(meses.map(m => m.anio))).sort((a: number, b: number) => b - a).map((y: number) =>
                    <option key={y} value={y}>{y}</option>)}
                </select>
                <select onChange={e => updateFilter('mes', e.target.value)}
                  className="text-sm border rounded-lg p-2">
                  <option value="">Mes</option>
                  {MESES_NOMBRE.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Rango de fechas</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input type="date" onChange={e => updateFilter('fecha_desde', e.target.value)}
                  className="text-sm border rounded-lg p-2" />
                <input type="date" onChange={e => updateFilter('fecha_hasta', e.target.value)}
                  className="text-sm border rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Texto / keywords</label>
              <input type="text" placeholder="Ej: mantenimiento, equipos, obra..." onChange={e => updateFilter('texto', e.target.value)}
                className="w-full text-sm border rounded-lg p-2 mt-1" />
            </div>
            <FiltroSelect label="Departamento" opciones={opciones.departamentos} keyName="departamento" vacioLabel="Todos" />
            <div>
              <label className="text-xs text-gray-500">Entidad (texto)</label>
              <input type="text" placeholder="Nombre de entidad..." onChange={e => updateFilter('entidad', e.target.value)}
                className="w-full text-sm border rounded-lg p-2 mt-1" />
            </div>
            <FiltroSelect label="Modalidad" opciones={opciones.modalidades} keyName="modalidad" vacioLabel="Todas" />
            <FiltroSelect label="Metodo de compra" opciones={opciones.metodos} keyName="metodo" vacioLabel="Todos" />
            <FiltroSelect label="Categoria" opciones={opciones.categorias} keyName="categoria" vacioLabel="Todas" />
            <FiltroSelect label="Estatus" opciones={opciones.estados} keyName="estatus" vacioLabel="Todos" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Monto min (Q)</label>
                <input type="number" placeholder="0" onChange={e => updateFilter('monto_min', e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto max (Q)</label>
                <input type="number" placeholder="999999" onChange={e => updateFilter('monto_max', e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
            </div>
            <button onClick={() => search()} className="w-full bg-[#1a3a5c] text-white py-2 rounded-lg font-medium hover:bg-[#2b579a] transition">
              {loading ? 'Buscando licitaciones...' : 'Buscar licitaciones'}
            </button>
            <button onClick={() => { setFilters({}); setResults(null); setPage(1) }}
              className="w-full text-sm text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition">
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {!results ? (
            <div className="text-center py-20 text-gray-400">Usa los filtros y presiona Buscar</div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
                <span className="text-sm font-medium">{results.total.toLocaleString()} resultados</span>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 items-center">
                    <input type="text" placeholder="Correos separados por coma..." value={destinatario}
                      onChange={e => setDestinatario(e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1.5 w-60" title="Puedes poner varios correos separados por coma" />
                    <button onClick={sendEmail} disabled={sending || !destinatario}
                      className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
                      {sending ? 'Enviando correo...' : 'Enviar por correo'}
                    </button>
                  </div>
                  <button onClick={() => download('csv')} disabled={!!exporting}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                    {exporting === 'csv' ? 'Generando...' : 'CSV'}
                  </button>
                  <button onClick={() => download('xlsx')} disabled={!!exporting}
                    className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition disabled:opacity-50">
                    {exporting === 'xlsx' ? 'Generando...' : 'Excel (XLSX)'}
                  </button>
                  <span className="text-gray-500 text-xs">Página {page} de {totalPages}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a3a5c] text-white">
                      <th className="text-left p-3 font-medium">NOG</th>
                      <th className="text-left p-3 font-medium">Fecha</th>
                      <th className="text-left p-3 font-medium">Titulo</th>
                      <th className="text-left p-3 font-medium">Entidad</th>
                      <th className="text-right p-3 font-medium">Monto</th>
                      <th className="text-left p-3 font-medium">Modalidad</th>
                      <th className="text-left p-3 font-medium">Departamento</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      {results.data?.[0]?.relevancia != null && <th className="text-center p-3 font-medium w-16">Relev.</th>}
                      <th className="text-center p-3 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.map((r: any) => (
                      <tr key={r.nog} className="border-b border-gray-50 hover:bg-blue-50/50 transition">
                        <td className="p-3 font-medium text-xs">{r.nog}</td>
                        <td className="p-3 text-xs text-gray-500">{r.fecha}</td>
                        <td className="p-3 text-xs max-w-xs truncate">{r.titulo}</td>
                        <td className="p-3 text-xs max-w-[200px] truncate">{r.entidad}</td>
                        <td className="p-3 text-xs text-right font-semibold text-blue-700">
                          {r.monto ? 'Q' + Number(r.monto).toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-xs max-w-[140px] truncate">{r.modalidad}</td>
                        <td className="p-3 text-xs">{r.departamento}</td>
                        <td className="p-3 text-xs"><span className="bg-gray-100 px-2 py-0.5 rounded">{r.estado}</span></td>
                        {r.relevancia != null && <td className="p-3 text-xs text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.relevancia >= 80 ? 'bg-green-100 text-green-700' :
                            r.relevancia >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{r.relevancia}%</span>
                        </td>}
                        <td className="p-3 text-center">
                          <button onClick={() => addToPipeline(r)}
                            className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-500 px-2 py-1 rounded transition"
                            title="Agregar al pipeline">+</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4">
                  <button disabled={page <= 1} onClick={() => search(page - 1)}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50">&laquo;</button>
                  <span className="px-3 py-1.5 text-sm font-medium">{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => search(page + 1)}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50">&raquo;</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
