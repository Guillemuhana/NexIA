import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    name: 'Gratis',
    price: '$0',
    desc: 'Para explorar la plataforma y dar el primer paso.',
    perks: [
      '1 idea publicada con matching IA',
      'Explorar talentos disponibles',
      'Recibir invitaciones a proyectos',
      'Perfil público en el directorio',
      'Chat con todos los usuarios — gratis por tiempo limitado 🎉',
    ],
    cta: 'Empezar gratis',
    path: '/registro',
    accent: false,
  },
  {
    name: 'Visionario Pro',
    price: '$29',
    per: 'por idea',
    desc: 'Cada idea adicional que publicás incluye matching IA garantizado.',
    perks: [
      'Todo lo del plan gratis',
      'Ideas ilimitadas (pago por idea)',
      'Matching IA con los mejores perfiles',
      'Invitaciones automáticas al equipo',
      'Idea pública o privada',
      'Análisis completo de viabilidad',
      'Chat premium con todos los usuarios (siempre)',
    ],
    cta: 'Publicar una idea',
    path: '/lanzar',
    accent: true,
  },
  {
    name: 'Talento',
    price: '$29',
    per: 'por conexión',
    desc: 'Aceptá una invitación y conectá directo con el equipo del proyecto.',
    perks: [
      'Recibir invitaciones gratis',
      'Ver el proyecto antes de pagar',
      'Pago solo al aceptar',
      'Contacto directo con el founder',
      'Tu perfil visible para la IA de matching',
      'Chat con tu equipo formado (siempre gratis)',
    ],
    cta: 'Registrarme como talento',
    path: '/registro?rol=talento',
    accent: false,
  },
]

export default function Precios() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Precios</span>
          <h1 style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, letterSpacing: '-2px', marginTop: 12, marginBottom: 14 }}>
            Simple y transparente
          </h1>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Empezá gratis. Pagás solo cuando querés publicar más ideas o conectarte con un equipo.
          </p>
        </div>

        {/* Banner chat gratis por tiempo limitado */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px',
          background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.2)',
          borderRadius: 12, marginBottom: 36, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>
              Chat disponible para todos — por tiempo limitado
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
              Durante el lanzamiento de Equia, todos los usuarios pueden mensajearse libremente.
              Próximamente el chat estará disponible solo para suscriptores premium o usuarios con equipo formado.
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', background: 'rgba(232,97,26,.1)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 99, padding: '4px 12px', whiteSpace: 'nowrap' }}>
            BETA GRATIS
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, border: '1px solid #e8e8e8' }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              padding: '36px 28px', background: plan.accent ? '#f5f5f5' : '#ffffff',
              display: 'flex', flexDirection: 'column',
              borderLeft: plan.accent ? '1px solid #E8611A' : 'none',
              borderRight: plan.accent ? '1px solid #E8611A' : 'none',
              position: 'relative',
            }}>
              {plan.accent && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#E8611A', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '4px 12px', borderRadius: '0 0 6px 6px', textTransform: 'uppercase' }}>
                  Más popular
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>{plan.name}</div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: plan.accent ? '#E8611A' : '#0a0a0a' }}>{plan.price}</span>
                {plan.per && <span style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{plan.per}</span>}
              </div>

              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 28 }}>{plan.desc}</p>

              <div style={{ flex: 1, marginBottom: 28 }}>
                {plan.perks.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <span style={{ color: '#22c55e', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate(plan.path)}
                style={{
                  padding: '13px 20px', fontSize: 14, fontWeight: 700,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: plan.accent ? '#E8611A' : 'transparent',
                  color: plan.accent ? '#fff' : '#666',
                  border: plan.accent ? 'none' : '1px solid #d0d0d0',
                  transition: 'all .15s',
                }}
              >
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 36, textAlign: 'center' }}>Preguntas frecuentes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, border: '1px solid #e8e8e8' }}>
            {[
              ['¿Qué incluye la primera idea gratis?', 'El matching completo con IA, sugerencia de equipo ideal y envío de invitaciones automáticas. Todo. Sin costo.'],
              ['¿Cuándo paga el talento?', 'Solo cuando decide aceptar una invitación y conectarse con el equipo. Recibir invitaciones es siempre gratis.'],
              ['¿Puedo hacer mi idea privada?', 'Sí. Al publicar una idea podés elegir si es pública (visible a inversores) o privada (solo vos y tu equipo la ven).'],
              ['¿Qué pasa si el equipo no acepta?', 'Si ningún talento acepta tu invitación en 30 días, te devolvemos el pago. Equipo garantizado.'],
            ].map(([q, a]) => (
              <div key={q} style={{ padding: '28px 24px', background: '#ffffff' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#0a0a0a' }}>{q}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
