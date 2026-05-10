import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ProjectCard'
import PaywallModal from '../components/PaywallModal'

function mapProject(idea) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category || '',
    stage: idea.stage || '',
    founder: idea.users?.name || '',
    team: (idea.idea_roles || []).map(r => r.role_name),
    formed: idea.status === 'team_formed',
  }
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [paywallMatch, setPaywallMatch] = useState(null)
  const [paywallLoading, setPaywallLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user || !profile) return

    const fetchData = async () => {
      setDataLoading(true)

      if (profile.type === 'visionario') {
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, title, description, category, stage, status, users(name), idea_roles(role_name)')
          .eq('founder_id', user.id)
          .order('created_at', { ascending: false })
        setData((ideas || []).map(mapProject))
      }

      if (profile.type === 'talento') {
        const { data: matches } = await supabase
          .from('matches')
          .select('id, role_suggested, score, ai_reasoning, status, ideas(id, title, category, stage, users(name))')
          .eq('talent_id', user.id)
          .order('created_at', { ascending: false })
        setData(matches || [])
      }

      if (profile.type === 'inversor') {
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, title, description, category, stage, status, users(name), idea_roles(role_name)')
          .eq('is_public', true)
          .eq('status', 'team_formed')
          .order('created_at', { ascending: false })
          .limit(6)
        setData((ideas || []).map(mapProject))
      }

      setDataLoading(false)
    }

    fetchData()
  }, [user, profile])

  if (loading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spinner />
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

        <div style={{ padding: 32, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 6 }}>¿Tenés una idea?</h2>
            <p style={{ fontSize: 14, color: '#666' }}>Describila y la IA construye el equipo perfecto en minutos.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '12px 24px', fontSize: 15 }}>
            💡 Lanzar mi idea →
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px' }}>Mis proyectos</h2>
            <button className="btn-ghost" onClick={() => navigate('/proyectos')} style={{ fontSize: 14 }}>Ver todos →</button>
          </div>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : data.length === 0 ? (
            <div style={{ padding: '40px 24px', border: '1px dashed #1a1a1a', borderRadius: 12, textAlign: 'center', color: '#444' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💡</div>
              <div style={{ fontSize: 15, marginBottom: 8 }}>Todavía no lanzaste ningún proyecto.</div>
              <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '10px 20px', fontSize: 14, marginTop: 8 }}>Lanzar mi primera idea →</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {data.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const handlePayAndAccept = async () => {
    if (!paywallMatch) return
    setPaywallLoading(true)
    // TODO: replace with Stripe Checkout
    await new Promise(r => setTimeout(r, 1200))
    await supabase.from('matches').update({ status: 'accepted' }).eq('id', paywallMatch.id)
    setData(d => d.map(x => x.id === paywallMatch.id ? { ...x, status: 'accepted' } : x))
    setPaywallLoading(false)
    setPaywallMatch(null)
  }

  // ── TALENTO ──
  if (profile?.type === 'talento') return (
    <>
    {paywallMatch && (
      <PaywallModal
        title="Conectate con el equipo"
        description={`Aceptá la invitación al proyecto "${paywallMatch.ideas?.title}" y accedé al contacto directo con el founder.`}
        perks={['Contacto directo con el founder', 'Acceso al canal del equipo', 'Tu rol garantizado en el proyecto', 'Soporte prioritario']}
        loading={paywallLoading}
        onClose={() => setPaywallMatch(null)}
        onConfirm={handlePayAndAccept}
      />
    )}
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Hola, {profile?.name?.split(' ')[0] || 'Talento'} ⚡</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 48 }}>Tus invitaciones a proyectos y el estado de tu perfil.</p>

        <div style={{ padding: 24, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: profile.available ? '#22c55e' : '#555', animation: profile.available ? 'pulse 2s infinite' : 'none' }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.available ? 'Perfil activo — visible para la IA' : 'Perfil pausado'}</div>
              <div style={{ fontSize: 13, color: '#555' }}>La IA puede invitarte a proyectos que matcheen con tu perfil</div>
            </div>
          </div>
          <button className="btn-outline" onClick={() => navigate('/perfil')} style={{ padding: '9px 16px', fontSize: 13 }}>Editar perfil</button>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>Invitaciones recibidas</h2>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>Proyectos donde la IA eligió tu perfil.</p>

          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : data.length === 0 ? (
            <div style={{ padding: 32, border: '1px dashed #1a1a1a', borderRadius: 12, textAlign: 'center', color: '#444' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 14 }}>Cuando la IA te elija para un proyecto, aparece acá.</div>
            </div>
          ) : (
            data.map(m => (
              <div key={m.id} style={{ padding: 24, border: '1px solid #222', borderRadius: 12, background: '#0a0a0a', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.ideas?.title}</div>
                    <span className="tag">{m.ideas?.category}</span>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: m.status === 'accepted' ? 'rgba(34,197,94,.1)' : m.status === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)', color: m.status === 'accepted' ? '#22c55e' : m.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600, border: `1px solid ${m.status === 'accepted' ? 'rgba(34,197,94,.2)' : m.status === 'rejected' ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}` }}>
                    {m.status === 'accepted' ? '✓ Aceptado' : m.status === 'rejected' ? '✕ Rechazado' : '⏳ Pendiente'}
                  </span>
                </div>
                {m.ai_reasoning && (
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
                    Te eligieron para <strong style={{ color: '#fff' }}>{m.role_suggested}</strong>. {m.ai_reasoning}
                  </p>
                )}
                {m.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => setPaywallMatch(m)}>✓ Aceptar</button>
                    <button className="btn-outline" style={{ padding: '10px 16px', fontSize: 14 }} onClick={async () => {
                      await supabase.from('matches').update({ status: 'rejected' }).eq('id', m.id)
                      setData(d => d.map(x => x.id === m.id ? { ...x, status: 'rejected' } : x))
                    }}>✕ Rechazar</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  )

  // ── INVERSOR ──
  if (profile?.type === 'inversor') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Hola, {profile?.name?.split(' ')[0] || 'Inversor'} 💼</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 48 }}>Tu pipeline de proyectos e inversiones.</p>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Proyectos con equipo formado</h2>
            <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '9px 16px', fontSize: 13 }}>Ver todos →</button>
          </div>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : data.length === 0 ? (
            <div style={{ padding: 32, border: '1px dashed #1a1a1a', borderRadius: 12, textAlign: 'center', color: '#444' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💼</div>
              <div style={{ fontSize: 14 }}>Todavía no hay proyectos con equipos formados.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {data.map(p => <ProjectCard key={p.id} project={p} onFavorite={() => {}} showContact />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return null
}
