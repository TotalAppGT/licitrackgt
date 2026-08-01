import { useState } from 'react'

const TIPS: Record<string, string[]> = {
  dashboard: [
    'Aquí ves el resumen de todos los eventos disponibles en LiciTrackGT.',
    'Los gráficos se actualizan automáticamente cada 6 horas con datos nuevos de Guatecompras.',
    'Usa los filtros para encontrar eventos específicos por entidad, categoría o departamento.',
  ],
  filtros: [
    'Escribe una palabra clave (ej: "hospital", "construcción") y presiona Buscar.',
    'Selecciona año y mes para filtrar por período. Julio 2026 tiene 71 mil eventos.',
    'Marca los checkboxes para seleccionar varios eventos y agregarlos al Seguimiento.',
    'Usa los botones CSV o XLSX para descargar los resultados a Excel.',
    'El botón Enviar envía los resultados por correo con archivo XLSX adjunto.',
  ],
  pipeline: [
    'El Seguimiento te permite dar seguimiento a eventos que te interesan.',
    'Cada evento pasa por etapas: Detección → Análisis → Preparación → Presentación → Adjudicación.',
    'La Fecha de presentación es cuándo debes entregar tu oferta. El sistema te avisa 3 días antes.',
    'Probabilidad: tu estimación de 0 a 100% de qué tan probable es ganar.',
    'Agrega eventos desde Filtros marcando los checkboxes y usando el botón flotante.',
  ],
  alertas: [
    'Crea palabras clave para recibir alertas cuando se publiquen eventos que coincidan.',
    'Cada palabra clave tiene su propia frecuencia: 15 min, 1 hora, o diario.',
    'Usa el botón ▶ Probar para verificar que una palabra clave encuentra resultados.',
    'Los Reportes Programados envían un XLSX automático a la hora y días que configures.',
    'Para recibir alertas por WhatsApp, primero envía "Hola" al +502 5830 9505.',
  ],
  suscripcion: [
    'Elige el plan que mejor se adapte a tu empresa. Todos incluyen acceso inmediato.',
    'El plan Básico incluye alertas por correo y exportación CSV.',
    'El plan Pro agrega WhatsApp, XLSX profesional y hasta 3 usuarios.',
    'Enterprise es ilimitado en todo: keywords, seguimientos, reportes y 10 usuarios.',
  ],
  equipo: [
    'Invita a colaboradores para que te ayuden a buscar y dar seguimiento a eventos.',
    'Cada miembro configura su propio WhatsApp y recibe alertas en su número.',
    'Si un miembro pierde su contraseña, usa "Reenviar clave" para enviarle una nueva.',
  ],
  admin: [
    'Panel de administración: aquí ves todos los usuarios registrados y sus planes.',
    'Puedes cambiar el plan de cualquier usuario manualmente.',
    'MRR = Ingreso Mensual Recurrente estimado según los planes activos.',
  ],
}

const TITLES: Record<string, string> = {
  dashboard: 'Panel',
  filtros: 'Filtros',
  pipeline: 'Seguimiento',
  alertas: 'Alertas',
  suscripcion: 'Suscripción',
  equipo: 'Equipo',
  admin: 'Admin',
}

export default function HelpBar({ tab }: { tab: string }) {
  const [open, setOpen] = useState(false)
  const tips = TIPS[tab] || []
  const title = TITLES[tab] || tab

  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-30 bg-[#1a3a5c] text-white w-12 h-12 rounded-full shadow-lg hover:bg-[#2b579a] transition flex items-center justify-center text-xl font-bold"
        title="Ayuda y sugerencias">
        ?
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 max-h-[60vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-800">
              <span className="mr-2">💡</span> {title}
            </h4>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
          </div>
          <div className="p-4 space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-600">
                <span className="text-[#1a3a5c] font-bold mt-0.5">{i + 1}.</span>
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
            {tips.length === 0 && (
              <p className="text-xs text-gray-400">Selecciona una pestaña para ver sugerencias.</p>
            )}
            <hr className="border-gray-100" />
            <button onClick={() => { setOpen(false); localStorage.removeItem('tour_done') }}
              className="text-xs text-blue-600 hover:underline w-full text-left">
              Ver recorrido guiado completo →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
