import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

const STEPS = {
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

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000' }}>
      <style>{`@keyframes spin-ob { to { transform: rotate(360deg) } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin-ob 1s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 13, color: '#444' }}>Configurando tu cuenta...</div>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const { profile, loading, user, setUserRole } = useAuth()
  const navigate = useNavigate()
  const [assigning, setAssigning] = useState(false)
  const [roleError, setRoleError] = useState('')

  if (loading || assigning) return <Spinner />

  // No role yet — show role selection
  if (!profile?.type) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px', background: '#000' }}>
      <style>{`@keyframes spin-ob { to { transform: rotate(360deg) } }`}</style>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6, color: '#fff' }}>¿Quién sos?</h1>
        <p style={{ color: '#555', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Elegí tu rol para personalizar tu experiencia.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roleError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 8 }}>
              {roleError}
            </div>
          )}
          {Object.values(ROLES).map(role => (
            <button key={role.id} onClick={async () => {
              if (!user?.id) return
              setRoleError('')
              setAssigning(true)
              const { error } = await setUserRole(user.id, role.id).catch(e => ({ error: e }))
              setAssigning(false)
              if (error) setRoleError('No se pudo guardar el rol. Verificá tu conexión e intentá de nuevo.')
            }} style={{
              display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px',
              background: '#0a0a0a', border: '1px solid #222', borderRadius: 10,
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8611A'; e.currentTarget.style.background = 'rgba(232,97,26,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.background = '#0a0a0a' }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{role.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{role.label}</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{role.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const roleInfo = ROLES[profile.type]

  const nextStep = () => {
    navigate('/perfil-chat')
  }

  const mySteps = STEPS[profile.type] || STEPS.talento

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>{roleInfo?.icon || '🎉'}</div>
        <h1 style={{ fontSize: 'clamp(28px,6vw,42px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>
          ¡Bienvenido a Equia!
        </h1>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 48, lineHeight: 1.6 }}>
          {profile.name ? `Hola ${profile.name.split(' ')[0]}, ` : ''}estás registrado como <strong style={{ color: '#E8611A' }}>{roleInfo?.label}</strong>. Así funciona tu experiencia:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden', marginBottom: 40, textAlign: 'left' }}>
          {mySteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', background: i % 2 === 0 ? '#000' : '#0a0a0a' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{step.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#333', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={nextStep} style={{ width: '100%', padding: '16px', fontSize: 17, borderRadius: 10 }}>
          🤖 Configurar mi perfil con IA →
        </button>
      </div>
    </div>
  )
}
