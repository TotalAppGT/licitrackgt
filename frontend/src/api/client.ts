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
  exportLicitaciones: async (filters: any) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/licitaciones/export`, {
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
    a.download = `licitaciones_${filters.anio || 'all'}_${filters.mes || 'all'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
  planes: () => request('/payments/plans'),
  createCheckout: (priceId: string) =>
    request('/payments/create-checkout', { method: 'POST', body: JSON.stringify({ price_id: priceId }) }),
  startExtraction: () => request('/extraction/start', { method: 'POST' }),
  extractionLogs: () => request('/extraction/logs'),
}
