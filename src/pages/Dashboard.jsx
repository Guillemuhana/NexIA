import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MOCK_PROJECTS, MOCK_TALENTS } from '../lib/constants'
import ProjectCard from '../components/ProjectCard'
import TalentCard from '../components/TalentCard'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  if (loading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const s = { padding: '100px 24px 60px', maxWidth: 1000, margin: '0 auto' }
  const lbl = { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, display: 'block' }

  // ── VISIONARIO ──
  if (profile?.type === 'visionario') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Hola, {profile?.name?.split(' ')[0] || 'Visionario'} 👋</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 48 }}>Gestioná tus proyectos y el equipo que la IA armó para vos.</p>

        {/* CTA si no tiene proyectos */}
        <div style={{ padding: 32, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 6 }}>¿Tenés una idea?</h2>
            <p style={{ fontSize: 14, color: '#666' }}>Describila y la IA construye el equipo perfecto en minutos.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '12px 24px', fontSize: 15 }}>
            💡 Lanzar mi idea →
          </button>
        </div>

        {/* Proyectos activos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px' }}>Mis proyectos</h2>
            <button className="btn-ghost" onClick={() => navigate('/proyectos')} style={{ fontSize: 14 }}>Ver todos →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {MOCK_PROJECTS.slice(0,2).map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </div>
    </div>
  )

  // ── TALENTO ──
  if (profile?.type === 'talento') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Hola, {profile?.name?.split(' ')[0] || 'Talento'} ⚡</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 48 }}>Tus invitaciones a proyectos y el estado de tu perfil.</p>

        {/* Estado del perfil */}
        <div style={{ padding: 24, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Perfil activo — visible para la IA</div>
              <div style={{ fontSize: 13, color: '#555' }}>La IA puede invitarte a proyectos que matcheen con tu perfil</div>
            </div>
          </div>
          <button className="btn-outline" onClick={() => navigate('/perfil')} style={{ padding: '9px 16px', fontSize: 13 }}>Editar perfil</button>
        </div>

        {/* Invitaciones */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>Invitaciones recibidas</h2>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>Proyectos donde la IA eligió tu perfil.</p>

          {/* Mock invitation */}
          <div style={{ padding: 24, border: '1px solid #222', borderRadius: 12, background: '#0a0a0a', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>MediConnect</div>
                <span className="tag">HealthTech</span>
              </div>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,.1)', color: '#f59e0b', fontWeight: 600, border: '1px solid rgba(245,158,11,.2)' }}>⏳ Pendiente</span>
            </div>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
              Hola! Te elegimos para unirte a MediConnect como <strong style={{ color: '#fff' }}>Full-Stack Developer</strong>. Tu experiencia en React y Node.js es exactamente lo que necesitamos para construir nuestra plataforma de salud. El proyecto está en etapa MVP con financiamiento confirmado.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>✓ Aceptar</button>
              <button className="btn-outline" style={{ padding: '10px 16px', fontSize: 14 }}>✕ Rechazar</button>
              <button className="btn-ghost" style={{ padding: '10px 16px', fontSize: 14 }}>Ver proyecto →</button>
            </div>
          </div>

          <div style={{ padding: 32, border: '1px dashed #1a1a1a', borderRadius: 12, textAlign: 'center', color: '#444' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 14 }}>Cuando la IA te elija para un proyecto, aparece acá.</div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── INVERSOR ──
  if (profile?.type === 'inversor') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Hola, {profile?.name?.split(' ')[0] || 'Inversor'} 💼</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 48 }}>Tu pipeline de proyectos e inversiones.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 48 }}>
          {[['23','Proyectos revisados'],['5','Guardados'],['2','En conversación'],['$0','Invertido']].map(([n,l]) => (
            <div key={l} style={{ padding: '20px 20px', border: '1px solid #1a1a1a', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: '#E8611A' }}>{n}</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Proyectos destacados</h2>
            <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '9px 16px', fontSize: 13 }}>Ver todos →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {MOCK_PROJECTS.filter(p => p.formed).map(p => <ProjectCard key={p.id} project={p} onFavorite={() => {}} showContact />)}
          </div>
        </div>
      </div>
    </div>
  )

  return null
}
