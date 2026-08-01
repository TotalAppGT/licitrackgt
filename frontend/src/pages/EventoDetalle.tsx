import { useEffect, useState } from 'react'
import { toast } from '../components/Toast'

export default function EventoDetalle({ nog, onClose }: { nog: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/licitaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ texto: nog, per_page: 5 }),
    }).then(r => r.json()).then(d => {
      const found = d.data?.find((r: any) => r.nog === nog)
      setData(found || { nog, titulo: 'Evento no encontrado' })
    }).catch(() => setData({ nog, titulo: 'Error al cargar' }))
      .finally(() => setLoading(false))
  }, [nog])

  if (loading) return <div className="text-center py-10 text-gray-400 text-sm">Cargando evento...</div>

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{data.nog}</span>
              <h2 className="text-lg font-bold text-gray-800 mt-2">{data.titulo}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Entidad</p>
              <p className="font-medium">{data.entidad || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Monto</p>
              <p className="font-semibold text-blue-700">Q{Number(data.monto || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Estado</p>
              <p className="font-medium">{data.estado || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Fecha publicación</p>
              <p className="font-medium">{data.fecha || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Modalidad</p>
              <p className="font-medium">{data.modalidad || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Categoría</p>
              <p className="font-medium">{data.categoria || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Método</p>
              <p className="font-medium">{data.metodo || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Departamento</p>
              <p className="font-medium">{data.departamento || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <a href={`https://www.guatecompras.gt/procesos/${data.nog}`} target="_blank" rel="noopener"
              className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Ver en Guatecompras
            </a>
            <button onClick={() => {
              const token = localStorage.getItem('token')
              fetch(`/api/pipeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ nog: data.nog, titulo: data.titulo, entidad: data.entidad, monto: data.monto, fecha_publicacion: data.fecha }),
              }).then(() => { toast.show('Agregado al seguimiento', 'success'); onClose() }).catch(() => {})
            }}
              className="text-xs bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
              + Seguimiento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
