import { useState } from 'react'
import { toast } from '../components/Toast'

const WA_NUMBER = '50258309505'

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [waPhone, setWaPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const steps = [
    { title: 'Bienvenido a LiciTrackGT', icon: '👋' },
    { title: 'Activa WhatsApp', icon: '📱' },
    { title: 'Listo para empezar', icon: '🚀' },
  ]

  const probar = async () => {
    setTesting(true); setTestResult(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/auth/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsapp_phone: waPhone }),
      })
      setTestResult(await res.json())
    } catch { setTestResult({ email: false, whatsapp: false, error: 'Error de conexión' }) }
    finally { setTesting(false) }
  }

  const guardar = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsapp_phone: waPhone }),
      })
      onComplete()
    } catch (e: any) { toast.show('Error al guardar', 'error') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-[#1a3a5c]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center space-y-4">
            <div className="text-4xl">👋</div>
            <h2 className="text-2xl font-bold text-gray-800">¡Bienvenido!</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Monitoreo inteligente de eventos de Guatecompras. En 2 minutos tendrás todo listo para recibir alertas por correo y WhatsApp.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xl font-bold">1.7M+</div>
                <div className="text-gray-500 text-[10px]">Eventos</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-xl font-bold">15min</div>
                <div className="text-gray-500 text-[10px]">Actualización</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="text-xl font-bold">Q349</div>
                <div className="text-gray-500 text-[10px]">Desde /mes</div>
              </div>
            </div>
            <button onClick={() => setStep(1)}
              className="mt-6 bg-[#1a3a5c] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#2b579a] transition w-full sm:w-auto">
              Configurar notificaciones →
            </button>
            <p className="text-xs text-gray-400 cursor-pointer hover:underline" onClick={onComplete}>Omitir recorrido</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <span className="text-3xl">📱</span>
              <h2 className="text-xl font-bold text-gray-800 mt-1">Activa WhatsApp</h2>
              <p className="text-gray-500 text-sm">Para recibir alertas en tu celular</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Paso 1: Inicia la conversación</p>
              <p className="text-xs text-green-700 mb-3">
                WhatsApp requiere que tú escribas primero al número de LiciTrackGT. Toca el botón para enviar un mensaje automático:
              </p>
              <a href={`https://wa.me/${WA_NUMBER}?text=Hola%20LiciTrackGT%20act%C3%ADvame%20las%20alertas`}
                target="_blank" rel="noopener"
                className="w-full bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar mensaje por WhatsApp
              </a>
              <p className="text-[10px] text-green-600 mt-2 text-center">
                Se abrirá WhatsApp. Solo toca Enviar. No necesitas escribir nada más.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-2">Paso 2: Tu número</p>
              <p className="text-xs text-blue-700 mb-3">
                Ingresa tu número de WhatsApp con código de país para que el sistema te envíe las alertas:
              </p>
              <input type="text" value={waPhone} onChange={e => setWaPhone(e.target.value)}
                placeholder="502XXXXXXXX" className="w-full text-sm border rounded-lg p-2.5" />
              <p className="text-[10px] text-gray-400 mt-1">Guatemala: 502 + tu numero de 8 digitos. Sin espacios, sin +</p>
            </div>

            {testResult && (
              <div className={`rounded-lg p-3 text-xs ${testResult.email && testResult.whatsapp ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                {testResult.email ? '✅ Correo de prueba enviado' : '❌ Fallo correo'}
                {' · '}
                {testResult.whatsapp ? '✅ WhatsApp entregado' : testResult.whatsapp_error ? `⚠️ ${testResult.whatsapp_error}` : '⚠️ Sin WhatsApp'}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={probar} disabled={testing}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                {testing ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                Probar notificaciones
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 text-sm">
                Siguiente →
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center cursor-pointer hover:underline" onClick={onComplete}>Configurar después</p>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-4">
            <div className="text-4xl">🚀</div>
            <h2 className="text-xl font-bold text-gray-800">¡Todo listo!</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Ya puedes buscar eventos, crear alertas y dar seguimiento.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-xs text-gray-600 space-y-2">
              <p><b>🔍 Filtros:</b> Busca por palabra clave, departamento, montos y más.</p>
              <p><b>📋 Seguimiento:</b> Marca eventos desde Filtros y dales seguimiento con fechas límite.</p>
              <p><b>🔔 Alertas:</b> Configura palabras clave y recibe notificaciones automáticas.</p>
              <p><b>👥 Equipo:</b> Invita colaboradores desde la pestaña Equipo (plan Pro+).</p>
              <p><b>💬 WhatsApp:</b> Envía primero un mensaje al +502 5830 9505 para activar tus alertas.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={guardar}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm">
                Empezar a usar LiciTrackGT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
