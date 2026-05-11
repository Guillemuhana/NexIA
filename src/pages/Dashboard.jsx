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

// ── Panel del Equipo card ──────────────────────────────────────────────────
function TeamPanelCard({ title, ideaId, members = [], category }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 28, background: 'linear-gradient(135deg, #0d0d0d 0%, #0a0a0a 100%)', border: '1px solid rgba(232,97,26,.18)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
      {/* Glow background */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,97,26,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>Panel activo</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.5px', marginBottom: 4, lineHeight: 1.25 }}>{title}</h3>
          {category && <span style={{ fontSize: 11, color: '#555', background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, padding: '2px 8px' }}>{category}</span>}

          {/* Mini team */}
          {members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <div style={{ display: 'flex' }}>
                {members.slice(0, 5).map((m, i) => (
                  <div key={i} title={m.name} style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', border: '2px solid #0a0a0a', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                    {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.charAt(0)?.toUpperCase()}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#555' }}>{members.length} {members.length === 1 ? 'miembro' : 'miembros'}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
          <button
            onClick={() => navigate(`/panel/${ideaId}`)}
            style={{ padding: '12px 22px', background: '#E8611A', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#d4561a'}
            onMouseLeave={e => e.currentTarget.style.background = '#E8611A'}
          >
            ⚡ Abrir Panel IA →
          </button>
          <div style={{ display: 'flex', gap: 16, paddingRight: 4 }}>
            {['Roadmap', 'Ideas', 'Chat IA'].map(f => (
              <span key={f} style={{ fontSize: 11, color: '#444', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#E8611A' }}>·</span> {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [teamPanels, setTeamPanels] = useState([]) // {ideaId, title, category, members[]}
  const [dataLoading, setDataLoading] = useState(true)
  const [paywallMatch, setPaywallMatch] = useState(null)
  const [paywallLoading, setPaywallLoading] = useState(false)

  useEffect(() => { if (!loading && !user) navigate('/login') }, [user, loading])

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
        const projects = (ideas || []).map(mapProject)
        setData(projects)

        // Fetch team members for each project
        if (projects.length > 0) {
          const panels = await Promise.all(projects.map(async p => {
            const { data: matches } = await supabase
              .from('matches')
              .select('talent_id, users(name, avatar_url)')
              .eq('idea_id', p.id)
              .eq('status', 'accepted')
            const founder = ideas.find(i => i.id === p.id)
            const members = [
              { name: founder?.users?.name || 'Vos', avatar_url: null },
              ...(matches || []).map(m => ({ name: m.users?.name, avatar_url: m.users?.avatar_url })),
            ]
            return { ideaId: p.id, title: p.title, category: p.category, members }
          }))
          setTeamPanels(panels)
        }
      }

      if (profile.type === 'talento') {
        const { data: matches } = await supabase
          .from('matches')
          .select('id, role_suggested, score, ai_reasoning, status, ideas(id, title, category, stage, users(name))')
          .eq('talent_id', user.id)
          .order('created_at', { ascending: false })
        setData(matches || [])

        // Fetch team panels for accepted matches
        const accepted = (matches || []).filter(m => m.status === 'accepted')
        if (accepted.length > 0) {
          const panels = await Promise.all(accepted.map(async m => {
            const { data: teamMatches } = await supabase
              .from('matches')
              .select('talent_id, users(name, avatar_url)')
              .eq('idea_id', m.ideas?.id)
              .eq('status', 'accepted')
            const members = [
              { name: m.ideas?.users?.name || 'Fundador', avatar_url: null },
              ...(teamMatches || []).map(tm => ({ name: tm.users?.name, avatar_url: tm.users?.avatar_url })),
            ]
            return { ideaId: m.ideas?.id, title: m.ideas?.title, category: m.ideas?.category, members }
          }))
          setTeamPanels(panels)
        }
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
  const sectionTitle = { fontSize: 18, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 6 }

  // ── VISIONARIO ────────────────────────────────────────────────────────────
  if (profile?.type === 'visionario') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Hola, {profile?.name?.split(' ')[0] || 'Visionario'} 👋</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 40 }}>Gestioná tus proyectos y el espacio privado de tu equipo.</p>

        {/* ── Paneles activos ── */}
        {teamPanels.length > 0 && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={sectionTitle}>Espacio del equipo</h2>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(232,97,26,.12)', color: '#E8611A', border: '1px solid rgba(232,97,26,.2)', borderRadius: 99, padding: '2px 10px' }}>IA</span>
            </div>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Panel privado con roadmap, ideas y asesor IA para cada proyecto.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {teamPanels.map(p => <TeamPanelCard key={p.ideaId} {...p} />)}
            </div>
          </div>
        )}

        {/* ── Lanzar idea CTA ── */}
        <div style={{ padding: '24px 28px', border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>¿Tenés una nueva idea?</h2>
            <p style={{ fontSize: 13, color: '#666' }}>La IA construye el equipo perfecto en minutos.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '11px 22px', fontSize: 14 }}>
            💡 Lanzar mi idea →
          </button>
        </div>

        {/* ── Mis proyectos ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={sectionTitle}>Mis proyectos</h2>
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
    await new Promise(r => setTimeout(r, 1200))
    await supabase.from('matches').update({ status: 'accepted' }).eq('id', paywallMatch.id)
    setData(d => d.map(x => x.id === paywallMatch.id ? { ...x, status: 'accepted' } : x))
    setPaywallLoading(false)
    setPaywallMatch(null)
  }

  // ── TALENTO ───────────────────────────────────────────────────────────────
  if (profile?.type === 'talento') return (
    <>
      {paywallMatch && (
        <PaywallModal
          title="Conectate con el equipo"
          description={`Aceptá la invitación al proyecto "${paywallMatch.ideas?.title}" y accedé al contacto directo con el founder.`}
          perks={['Contacto directo con el founder', 'Acceso al Panel IA privado del equipo', 'Tu rol garantizado en el proyecto', 'Soporte prioritario']}
          loading={paywallLoading}
          onClose={() => setPaywallMatch(null)}
          onConfirm={handlePayAndAccept}
        />
      )}
      <div className="page-wrap">
        <div style={s}>
          <span style={lbl}>Dashboard</span>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Hola, {profile?.name?.split(' ')[0] || 'Talento'} ⚡</h1>
          <p style={{ color: '#666', fontSize: 15, marginBottom: 40 }}>Tus invitaciones a proyectos y el espacio privado de tu equipo.</p>

          {/* ── Paneles activos ── */}
          {teamPanels.length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={sectionTitle}>Tu espacio de equipo</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(232,97,26,.12)', color: '#E8611A', border: '1px solid rgba(232,97,26,.2)', borderRadius: 99, padding: '2px 10px' }}>IA</span>
              </div>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Accedé al panel privado con roadmap, ideas y asesor IA de tu proyecto.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamPanels.map(p => <TeamPanelCard key={p.ideaId} {...p} />)}
              </div>
            </div>
          )}

          {/* ── Estado del perfil ── */}
          <div style={{ padding: '20px 24px', border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: profile.available ? '#22c55e' : '#555', animation: profile.available ? 'pulse 2s infinite' : 'none' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.available ? 'Perfil activo — visible para la IA' : 'Perfil pausado'}</div>
                <div style={{ fontSize: 12, color: '#555' }}>La IA puede invitarte a proyectos que matcheen con tu perfil</div>
              </div>
            </div>
            <button className="btn-outline" onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', fontSize: 13 }}>Editar perfil</button>
          </div>

          {/* ── Invitaciones ── */}
          <div>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Invitaciones recibidas</h2>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>Proyectos donde la IA eligió tu perfil.</p>

            {dataLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
            ) : data.length === 0 ? (
              <div style={{ padding: 32, border: '1px dashed #1a1a1a', borderRadius: 12, textAlign: 'center', color: '#444' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 14 }}>Cuando la IA te elija para un proyecto, aparece acá.</div>
              </div>
            ) : (
              data.map(m => (
                <div key={m.id} style={{ padding: 22, border: '1px solid #1a1a1a', borderRadius: 12, background: '#0a0a0a', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.ideas?.title}</div>
                      <span className="tag">{m.ideas?.category}</span>
                    </div>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: m.status === 'accepted' ? 'rgba(34,197,94,.1)' : m.status === 'rejected' ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.1)', color: m.status === 'accepted' ? '#22c55e' : m.status === 'rejected' ? '#ef4444' : '#f59e0b', fontWeight: 600, border: `1px solid ${m.status === 'accepted' ? 'rgba(34,197,94,.2)' : m.status === 'rejected' ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}` }}>
                      {m.status === 'accepted' ? '✓ Aceptado' : m.status === 'rejected' ? '✕ Rechazado' : '⏳ Pendiente'}
                    </span>
                  </div>
                  {m.ai_reasoning && (
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>
                      Te eligieron para <strong style={{ color: '#fff' }}>{m.role_suggested}</strong>. {m.ai_reasoning}
                    </p>
                  )}
                  {m.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }} onClick={() => setPaywallMatch(m)}>✓ Aceptar</button>
                      <button className="btn-outline" style={{ padding: '9px 14px', fontSize: 13 }} onClick={async () => {
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

  // ── INVERSOR ──────────────────────────────────────────────────────────────
  if (profile?.type === 'inversor') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Hola, {profile?.name?.split(' ')[0] || 'Inversor'} 💼</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 40 }}>Tu pipeline de proyectos e inversiones.</p>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={sectionTitle}>Proyectos con equipo formado</h2>
            <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '8px 16px', fontSize: 13 }}>Ver todos →</button>
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
