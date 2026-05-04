import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

export default function Onboarding() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const roleInfo = profile?.type ? ROLES[profile.type] : null

  const nextStep = () => {
    if (profile?.type === 'visionario') navigate('/lanzar')
    else if (profile?.type === 'talento') navigate('/perfil')
    else navigate('/proyectos')
  }

  const steps = {
    visionario: [
      { icon: '✍️', title: 'Describí tu idea', desc: 'Nombre, descripción y qué roles necesitás.' },
      { icon: '🤖', title: 'La IA trabaja', desc: 'Analiza miles de perfiles y calcula el mejor equipo para tu proyecto.' },
      { icon: '📨', title: 'Invitaciones automáticas', desc: 'Cada talento recibe una invitación personalizada y acepta con un click.' },
      { icon: '🚀', title: '¡A construir!', desc: 'El equipo está formado. Los inversores pueden ver tu proyecto.' },
    ],
    talento: [
      { icon: '👤', title: 'Completá tu perfil', desc: 'Habilidades, experiencia y disponibilidad.' },
      { icon: '🤖', title: 'La IA te evalúa', desc: 'Cuando haya una idea que matchee con tu perfil, te invitan.' },
      { icon: '📨', title: 'Recibís invitaciones', desc: 'Aceptás o rechazás proyectos con un click. Sin entrevistas.' },
      { icon: '⚡', title: '¡A trabajar!', desc: 'Formás parte del equipo y construís algo grande.' },
    ],
    inversor: [
      { icon: '🔍', title: 'Explorá proyectos', desc: 'Filtrá por industria, etapa y tecnología.' },
      { icon: '👥', title: 'Ves el equipo real', desc: 'Cada proyecto muestra el equipo formado por IA.' },
      { icon: '💬', title: 'Contacto directo', desc: 'Hablá directo con el fundador si te interesa invertir.' },
    ],
  }

  const mySteps = steps[profile?.type] || steps.talento

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>{roleInfo?.icon || '🎉'}</div>
        <h1 style={{ fontSize: 'clamp(28px,6vw,42px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>
          ¡Bienvenido a nexIA!
        </h1>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 48, lineHeight: 1.6 }}>
          {profile?.name ? `Hola ${profile.name.split(' ')[0]}, ` : ''}estás registrado como <strong style={{ color: '#E8611A' }}>{roleInfo?.label}</strong>. Así funciona tu experiencia:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 40, textAlign: 'left' }}>
          {mySteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', background: i % 2 === 0 ? '#000' : '#0a0a0a' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{step.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#333', flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</div>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={nextStep} style={{ width: '100%', padding: '16px', fontSize: 17, borderRadius: 10 }}>
          {profile?.type === 'visionario' ? '💡 Lanzar mi primera idea →' : profile?.type === 'talento' ? '⚡ Completar mi perfil →' : '💼 Explorar proyectos →'}
        </button>
      </div>
    </div>
  )
}
