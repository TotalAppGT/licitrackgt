import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../components/Toast'

const MAX_USERS: Record<string, number> = { free: 1, basico: 1, pro: 3, enterprise: 10 }

export default function Equipo() {
  const { user } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [form, setForm] = useState({ email: '', name: '' })
  const [inviting, setInviting] = useState(false)

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const cargar = async () => {
    try {
      const res = await fetch('/api/team/members', { headers })
      const data = await res.json()
      setMembers(data.members || data || [])
    } catch { /* ignore */ }
  }
  useEffect(() => { cargar() }, [])

  const invite = async () => {
    if (!form.email.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Error al invitar')
      }
      setForm({ email: '', name: '' })
      cargar()
      toast.show('Invitación enviada', 'success')
    } catch (e: any) { toast.show(e.message, 'error') }
    finally { setInviting(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('Eliminar este miembro del equipo?')) return
    try {
      const res = await fetch(`/api/team/members/${id}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('Error al eliminar')
      cargar()
    } catch (e: any) { toast.show(e.message, 'error') }
  }

  const resend = async (id: number, email: string) => {
    try {
      const res = await fetch(`/api/team/resend-invite/${id}`, { method: 'POST', headers })
      if (!res.ok) throw new Error('Error al reenviar')
      toast.show(`Nueva contraseña enviada a ${email}`, 'success')
    } catch (e: any) { toast.show(e.message, 'error') }
  }

  const maxUsers = user?.plan ? (MAX_USERS[user.plan] || 1) : 1

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Miembros del equipo</h3>
          <span className="text-xs text-gray-400">{members.length} / {maxUsers} usuarios</span>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-2">
            <input type="email" value={form.email} placeholder="Correo electrónico" onChange={e => setForm({ ...form, email: e.target.value })}
              className="flex-1 text-sm border rounded-lg p-2" />
            <input type="text" value={form.name} placeholder="Nombre" onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-40 text-sm border rounded-lg p-2" />
            <button onClick={invite} disabled={inviting || !form.email.trim() || members.length >= maxUsers}
              className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2b579a] transition disabled:opacity-50 text-sm">
              {inviting ? 'Invitando...' : 'Invitar'}
            </button>
          </div>
        </div>

        <div className="divide-y">
          {members.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              Aún no hay miembros en tu equipo. Invita colaboradores para compartir el acceso.
            </div>
          ) : members.map((m: any) => (
            <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div>
                <div className="text-sm font-medium text-gray-800">{m.name || 'Sin nombre'}</div>
                <div className="text-xs text-gray-500">{m.email}</div>
                {m.status && <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status === 'active' ? 'Activo' : 'Pendiente'}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => resend(m.id, m.email)}
                  className="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded transition"
                  title="Reenviar contraseña">
                  Reenviar clave
                </button>
                <button onClick={() => remove(m.id)}
                  className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
