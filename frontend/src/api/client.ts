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
  eliminarAlerta: (id: number) => request(`/alerts/${id}`, { method: 'DELETE' }),
  planes: () => request('/payments/plans'),
  createCheckout: (priceId: string) =>
    request('/payments/create-checkout', { method: 'POST', body: JSON.stringify({ price_id: priceId }) }),
  startExtraction: () => request('/extraction/start', { method: 'POST' }),
  extractionLogs: () => request('/extraction/logs'),
  extraccionStatus: () => request('/extraction/status'),
}
