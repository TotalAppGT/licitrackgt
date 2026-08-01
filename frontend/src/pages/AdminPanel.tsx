import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../components/Toast'

export default function AdminPanel() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [editUser, setEditUser] = useState<any>(null)

  useEffect(() => {
    if (!user?.is_admin) return
    fetch('/api/admin/usuarios', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(setUsuarios)
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(setStats)
  }, [])

  const actualizar = async () => {
    if (!editUser) return
    try {
      await fetch(`/api/admin/usuarios/${editUser.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editUser.plan, keywords_limit: editUser.keywords_limit }),
      })
      setEditUser(null)
      const r = await fetch('/api/admin/usuarios', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      setUsuarios(await r.json())
    } catch (e: any) { toast.show(e.message, 'error') }
  }

  if (!user?.is_admin) return <div className="text-center py-20 text-gray-400">Solo administradores</div>

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Usuarios" value={stats.total_users} color="blue" />
        <StatCard label="Pagos activos" value={stats.paying_users} color="green" />
        <StatCard label="MRR" value={`Q${(stats.mrr || 0).toLocaleString()}`} color="amber" />
        <StatCard label="Eventos" value={(stats.total_licitaciones || 0).toLocaleString()} color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MiniCard label="Alertas activas" value={stats.total_alerts_count} />
        <MiniCard label="Items en Pipeline" value={stats.total_pipeline_count} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Usuarios</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">WhatsApp</th>
              <th className="text-left p-3">Creado</th>
              <th className="text-center p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3 text-xs">{u.email}</td>
                <td className="p-3 text-xs">{u.name}</td>
                <td className="p-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.plan === 'enterprise' ? 'bg-amber-100 text-amber-700' : u.plan === 'pro' ? 'bg-blue-100 text-blue-700' : u.plan === 'basico' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.plan}</span>
                </td>
                <td className="p-3 text-xs">{u.status || 'inactive'}</td>
                <td className="p-3 text-xs">{u.whatsapp_phone || '-'}</td>
                <td className="p-3 text-xs text-gray-400">{u.created_at ? u.created_at.slice(0, 10) : '-'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => setEditUser({ id: u.id, plan: u.plan, keywords_limit: u.keywords_limit || 5 })}
                    className="text-xs text-blue-600 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Editar usuario #{editUser.id}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Plan</label>
                <select value={editUser.plan} onChange={e => setEditUser({ ...editUser, plan: e.target.value })}
                  className="w-full text-sm border rounded-lg p-2 mt-1">
                  <option value="free">Free</option>
                  <option value="basico">Basico</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Keywords limit</label>
                <input type="number" value={editUser.keywords_limit} onChange={e => setEditUser({ ...editUser, keywords_limit: parseInt(e.target.value) || 5 })}
                  className="w-full text-sm border rounded-lg p-2 mt-1" />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm border rounded-lg">Cancelar</button>
                <button onClick={actualizar} className="px-4 py-2 text-sm bg-[#1a3a5c] text-white rounded-lg">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: any) {
  const colors: any = { blue: 'bg-blue-50 border-blue-100 text-blue-700', green: 'bg-green-50 border-green-100 text-green-700', amber: 'bg-amber-50 border-amber-100 text-amber-700', purple: 'bg-purple-50 border-purple-100 text-purple-700' }
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function MiniCard({ label, value }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-800">{value}</span>
    </div>
  )
}
