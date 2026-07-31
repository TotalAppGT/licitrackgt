import { useState } from 'react'

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [waPhone, setWaPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const steps = [
    { title: 'Bienvenido a LiciTrackGT', desc: 'Monitoreo inteligente de licitaciones de Guatecompras. Te guiaremos en 2 pasos para dejarlo todo listo.' },
    { title: 'Configura tus notificaciones', desc: 'Recibe alertas por correo y WhatsApp cuando haya nuevas licitaciones.' },
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
    } catch { setTestResult({ email: false, whatsapp: false, whatsapp_error: 'Error' }) }
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
    } catch (e: any) { alert('Error al guardar') }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#1a3a5c]' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{steps[0].title}</h2>
            <p className="text-gray-500">{steps[0].desc}</p>
            <div className="grid grid-cols-3 gap-3 mt-6 text-sm">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-2xl mb-1">1.7M+</div>
                <div className="text-gray-500 text-xs">Licitaciones</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl mb-1">15min</div>
                <div className="text-gray-500 text-xs">Actualizacion</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-2xl mb-1">Q349</div>
                <div className="text-gray-500 text-xs">Desde /mes</div>
              </div>
            </div>
            <button onClick={() => setStep(1)}
              className="mt-6 bg-[#1a3a5c] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#2b579a] transition">
              Comenzar configuracion
            </button>
            <p className="text-xs text-gray-400 mt-2 cursor-pointer hover:underline" onClick={onComplete}>Saltar</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">{steps[1].title}</h2>
            <p className="text-gray-500 text-sm">{steps[1].desc}</p>

            <div>
              <label className="text-xs text-gray-500">Correo electronico</label>
              <input type="text" disabled value={localStorage.getItem('token') ? '' : '...'}
                className="w-full text-sm border rounded-lg p-2.5 mt-1 bg-gray-50 text-gray-600"
                placeholder="Tu correo (configurado automaticamente)" />
            </div>

            <div>
              <label className="text-xs text-gray-500">Telefono WhatsApp (opcional)</label>
              <input type="text" value={waPhone} onChange={e => setWaPhone(e.target.value)}
                placeholder="502XXXXXXXX" className="w-full text-sm border rounded-lg p-2.5 mt-1" />
              <p className="text-[10px] text-gray-400 mt-1">Codigo de pais sin +. Ej: 50235187153</p>
            </div>

            {testResult && (
              <div className={`rounded-lg p-3 text-sm ${testResult.email && testResult.whatsapp ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
                {testResult.email ? 'Correo de prueba enviado' : 'Fallo correo'}
                {testResult.whatsapp ? ' | WhatsApp enviado' : testResult.whatsapp_error ? ` | ${testResult.whatsapp_error}` : ' | Sin WhatsApp'}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={probar} disabled={testing}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {testing ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                Probar notificaciones
              </button>
              <button onClick={guardar}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 text-sm">
                Guardar y empezar
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center cursor-pointer hover:underline" onClick={onComplete}>Configurar despues</p>
          </div>
        )}
      </div>
    </div>
  )
}
