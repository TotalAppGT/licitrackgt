import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function FiltrosResultados() {
  const [filters, setFilters] = useState<any>({})
  const [results, setResults] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [opciones, setOpciones] = useState<any>({ estados: [], categorias: [] })
  const [meses, setMeses] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.opciones().then(setOpciones)
    api.meses().then(d => setMeses(d.meses || [])).catch(() => {})
  }, [])

  const search = async (p = 1) => {
    setLoading(true); setPage(p)
    try { setResults(await api.licitaciones(filters, p)) }
    finally { setLoading(false) }
  }

  const downloadCsv = async () => {
    setExporting(true)
    try { await api.exportLicitaciones(filters) }
    catch (e: any) { alert(e.message) }
    finally { setExporting(false) }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => { const n = { ...prev }; if (value) n[key] = value; else delete n[key]; return n })
  }

  const totalPages = results ? Math.ceil(results.total / 50) : 0

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase tracking-wide">Filtros</h4>
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
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Estatus</label>
              <select onChange={e => updateFilter('estatus', e.target.value)} className="w-full text-sm border rounded-lg p-2 mt-1">
                <option value="">Todos</option>
                {opciones.estados.map((e: string) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Categoria</label>
              <select onChange={e => updateFilter('categoria', e.target.value)} className="w-full text-sm border rounded-lg p-2 mt-1">
                <option value="">Todas</option>
                {opciones.categorias.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Texto</label>
              <input type="text" placeholder="Buscar..." onChange={e => updateFilter('texto', e.target.value)}
                className="w-full text-sm border rounded-lg p-2 mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Entidad</label>
              <input type="text" placeholder="Nombre de entidad..." onChange={e => updateFilter('entidad', e.target.value)}
                className="w-full text-sm border rounded-lg p-2 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Monto min</label>
                <input type="number" placeholder="Q0" onChange={e => updateFilter('monto_min', e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto max</label>
                <input type="number" placeholder="Q999M" onChange={e => updateFilter('monto_max', e.target.value)}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
            </div>
            <button onClick={() => search()} className="w-full bg-[#1a3a5c] text-white py-2 rounded-lg font-medium hover:bg-[#2b579a] transition">
              {loading ? 'Buscando...' : 'Buscar'}
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
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <span className="text-sm font-medium">{results.total.toLocaleString()} resultados</span>
                <div className="flex gap-2 items-center">
                  <button onClick={downloadCsv} disabled={exporting}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                    {exporting ? 'Descargando...' : 'Descargar CSV'}
                  </button>
                  <span className="text-gray-500">Pagina {page} de {totalPages}</span>
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
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Categoria</th>
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
                        <td className="p-3 text-xs"><span className="bg-gray-100 px-2 py-0.5 rounded">{r.estado}</span></td>
                        <td className="p-3 text-xs">{r.categoria}</td>
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
