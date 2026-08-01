import { useState } from 'react'

const STEPS = [
  {
    title: 'Panel Principal',
    desc: 'Aquí ves las estadísticas generales: total de eventos, entidades activas, monto promedio y gráficos por mes y departamento.',
    position: 'center',
  },
  {
    title: 'Filtros y Búsqueda',
    desc: 'Busca eventos por palabra clave, año, mes, departamento, entidad, modalidad, monto y más. Marca los checkboxes para agregar varios eventos al Seguimiento de una vez.',
    position: 'center',
  },
  {
    title: 'Seguimiento',
    desc: 'Da seguimiento a los eventos que te interesan. Cambia la etapa (Detección → Preparación → Presentación...), pon la fecha límite, monto propuesto y probabilidad de ganar. El sistema te avisa 3 días antes por correo y WhatsApp.',
    position: 'center',
  },
  {
    title: 'Palabras Clave',
    desc: 'Configura palabras o frases. Cuando se publique un evento que coincida, recibirás una alerta por correo y WhatsApp. Puedes programar la frecuencia: cada 15 min, cada hora, o una vez al día.',
    position: 'center',
  },
  {
    title: 'Notificaciones',
    desc: 'Configura tu WhatsApp en el botón de la barra superior. IMPORTANTE: envía primero un mensaje al +502 5830 9505 para activar las alertas en tu celular. Sin esto, WhatsApp no podrá entregarte los mensajes.',
    position: 'center',
  },
  {
    title: 'Equipo',
    desc: 'Invita a colaboradores a tu cuenta (disponible en plan Pro y Enterprise). Ellos pueden buscar eventos, gestionar seguimientos y recibir alertas en su propio WhatsApp.',
    position: 'center',
  },
]

export default function Tour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="flex justify-center gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-[#1a3a5c] scale-125' : 'bg-gray-300'}`} />
          ))}
        </div>
        
        <h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">{s.desc}</p>

        <div className="flex justify-between mt-6">
          <button onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
            Omitir tutorial
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="text-xs px-4 py-1.5 border rounded-lg hover:bg-gray-50">
                ← Anterior
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)}
                className="text-xs px-4 py-1.5 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2b579a]">
                Siguiente →
              </button>
            ) : (
              <button onClick={onClose}
                className="text-xs px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                ¡Entendido, empezar!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
