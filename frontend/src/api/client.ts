const API = '/api'

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Sesion expirada')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Error')
  return data
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, name: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  me: () => request('/auth/me'),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  dashboard: () => request('/dashboard/stats'),
  licitaciones: (filters: any, page = 1) =>
    request('/licitaciones', { method: 'POST', body: JSON.stringify({ ...filters, page, per_page: 50 }) }),
  opciones: () => request('/licitaciones/opciones'),
  meses: () => request('/licitaciones/meses'),
  downloadFile: async (path: string, filters: any, ext: string) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(filters),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Error al exportar')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `licitaciones_${filters.anio || 'todos'}_${filters.mes || 'todos'}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
  exportCsv: (filters: any) => api.downloadFile('/licitaciones/export', filters, 'csv'),
  exportXlsx: (filters: any) => api.downloadFile('/licitaciones/export-xlsx', filters, 'xlsx'),
  enviarResultados: (filters: any, destinatario: string) =>
    request('/licitaciones/enviar', { method: 'POST', body: JSON.stringify({ ...filters, destinatario }) }),
  misAlertas: () => request('/alerts'),
  crearAlerta: (keyword: string) =>
    request('/alerts', { method: 'POST', body: JSON.stringify({ keyword }) }),
  actualizarAlerta: (id: number, hora_envio: number | null, dias_envio: string | null) =>
    request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ hora_envio, dias_envio }) }),
  eliminarAlerta: (id: number) => request(`/alerts/${id}`, { method: 'DELETE' }),
  pipeline: () => request('/pipeline'),
  addPipeline: (licitacion: { nog: string; titulo: string; entidad: string; monto: number; fecha: string }) =>
    request('/pipeline', { method: 'POST', body: JSON.stringify({ nog: licitacion.nog, titulo: licitacion.titulo, entidad: licitacion.entidad, monto: licitacion.monto, fecha_publicacion: licitacion.fecha }) }),
  updatePipeline: (id: number, data: any) =>
    request(`/pipeline/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePipeline: (id: number) => request(`/pipeline/${id}`, { method: 'DELETE' }),
  deadlines: () => request('/pipeline/deadlines'),
  scheduledReports: () => request('/scheduled-reports'),
  createScheduledReport: (data: any) =>
    request('/scheduled-reports', { method: 'POST', body: JSON.stringify(data) }),
  toggleScheduledReport: (id: number) =>
    request(`/scheduled-reports/${id}`, { method: 'PATCH' }),
  deleteScheduledReport: (id: number) => request(`/scheduled-reports/${id}`, { method: 'DELETE' }),
  planes: () => request('/payments/plans'),
  createCheckout: (priceId: string) =>
    request('/payments/create-checkout', { method: 'POST', body: JSON.stringify({ price_id: priceId }) }),
  startExtraction: () => request('/extraction/start', { method: 'POST' }),
  extractionLogs: () => request('/extraction/logs'),
  extraccionStatus: () => request('/extraction/status'),
}
