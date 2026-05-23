import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ProjectCard from '../components/ProjectCard'
import PaywallModal from '../components/PaywallModal'
import { getLevel, CREDIT_LEVELS, CREDIT_ACTIONS } from '../lib/constants'

// ── CreditBlock ───────────────────────────────────────────────────────────────
function CreditBlock({ profile, hasIdea }) {
  const credits = profile.credits ?? 50
  const level = getLevel(credits)
  const levelIdx = CREDIT_LEVELS.findIndex(l => l.name === level.name)
  const nextLevel = CREDIT_LEVELS[levelIdx + 1] || null
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((credits - level.min) / (nextLevel.min - level.min)) * 100))
    : 100
  const pendingActions = CREDIT_ACTIONS.filter(a => !a.check(profile, { hasIdea }))

  return (
    <div style={{ marginBottom: 36, padding: '22px 24px', border: '1px solid rgba(232,97,26,.18)', borderRadius: 14, background: 'linear-gradient(135deg,rgba(232,97,26,.04) 0%,#fff 100%)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Nivel {level.name}
            {nextLevel && <span style={{ color: '#bbb', fontWeight: 400, marginLeft: 8 }}>→ {nextLevel.name} en {nextLevel.min - credits} pts</span>}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#0a0a0a' }}>
            ⚡ {credits} <span style={{ fontSize: 14, fontWeight: 500, color: '#888' }}>créditos</span>
          </div>
        </div>
        {pendingActions.length === 0 && (
          <div style={{ padding: '6px 14px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 99, fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
            Perfil completo ✓
          </div>
        )}
      </div>
      <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #E8611A, #f59340)', borderRadius: 99, transition: 'width 1.2s ease', width: `${progressPct}%` }} />
      </div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: pendingActions.length > 0 ? 12 : 0 }}>
        Más créditos = mayor prioridad en el algoritmo de matching IA — aparecés primero para los visionarios.
      </div>
      {pendingActions.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Completá esto para ganar más créditos:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {pendingActions.map(a => (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 99, fontSize: 12, color: '#555' }}>
                <span style={{ color: '#E8611A', fontWeight: 700 }}>+{a.credits}</span>
                {a.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ReferralBlock ─────────────────────────────────────────────────────────────
function ReferralBlock({ profile }) {
  const [copied, setCopied] = useState(false)
  const refLink = profile.referral_code
    ? `${window.location.origin}/registro?ref=${profile.referral_code}`
    : null

  const copy = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (!refLink) return null
  return (
    <div style={{ marginBottom: 36, padding: '22px 24px', border: '1px solid #e8e8e8', borderRadius: 14, background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Invitá amigos</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', marginBottom: 2 }}>Compartí tu código — ambos ganan</div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Vos: <strong style={{ color: '#E8611A' }}>+100 créditos</strong> · Ellos: <strong style={{ color: '#3b82f6' }}>+50 créditos</strong> al registrarse
            {' · '}
            <strong style={{ color: (profile.referral_count || 0) >= 3 ? '#ef4444' : '#22c55e' }}>
              {profile.referral_count || 0}/3 usos
            </strong>
            {(profile.referral_count || 0) >= 3 && (
              <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 99, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                Límite alcanzado
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#E8611A', letterSpacing: '2px', fontFamily: 'monospace' }}>
          {profile.referral_code}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 9, padding: '10px 14px' }}>
        <span style={{ flex: 1, fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refLink}</span>
        <button
          onClick={copy}
          style={{ flexShrink: 0, padding: '7px 16px', background: copied ? '#22c55e' : '#E8611A', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'background .2s' }}
        >
          {copied ? '✓ Copiado' : 'Copiar link'}
        </button>
      </div>
    </div>
  )
}

function mapProject(idea, founderName = '') {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category || '',
    stage: idea.stage || '',
    founder: founderName,
    team: (idea.idea_roles || []).map(r => r.role_name),
    formed: idea.status === 'team_formed',
  }
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
}

// ── Panel del Equipo card ──────────────────────────────────────────────────
function TeamPanelCard({ title, ideaId, members = [], category }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 28, background: 'linear-gradient(135deg, #f5f5f5 0%, #f8f9fa 100%)', border: '1px solid rgba(232,97,26,.18)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
      {/* Glow background */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,97,26,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase' }}>Panel activo</span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-.5px', marginBottom: 4, lineHeight: 1.25 }}>{title}</h3>
          {category && <span style={{ fontSize: 11, color: '#666', background: '#f0f0f0', border: '1px solid #e8e8e8', borderRadius: 4, padding: '2px 8px' }}>{category}</span>}

          {/* Mini team */}
          {members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <div style={{ display: 'flex' }}>
                {members.slice(0, 5).map((m, i) => (
                  <div key={i} title={m.name} style={{ width: 28, height: 28, borderRadius: '50%', background: '#e8e8e8', border: '2px solid #f8f9fa', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                    {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.charAt(0)?.toUpperCase()}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#666' }}>{members.length} {members.length === 1 ? 'miembro' : 'miembros'}</span>
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
              <span key={f} style={{ fontSize: 11, color: '#777', display: 'flex', alignItems: 'center', gap: 4 }}>
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
  const { user, profile, loading, profileFetched } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [teamPanels, setTeamPanels] = useState([])
  const [founderEquity, setFounderEquity] = useState([]) // [{ideaTitle, name, role, equity_pct}]
  const [invitedByIdea, setInvitedByIdea] = useState({})
  const [publicIdeas, setPublicIdeas] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [paywallMatch, setPaywallMatch] = useState(null)
  const [paywallLoading, setPaywallLoading] = useState(false)

  useEffect(() => { if (!loading && !user) navigate('/login') }, [user, loading])
  // Only redirect to onboarding once profileFetched=true (profile actually loaded from DB, not just auth timeout)
  useEffect(() => { if (profileFetched && user && !profile?.type) navigate('/onboarding') }, [profileFetched, user, profile])

  useEffect(() => {
    if (!user?.id || !profile?.type) return

    let cancelled = false
    const safetyTimer = setTimeout(() => { if (!cancelled) setDataLoading(false) }, 8000)

    const fetchData = async () => {
      setDataLoading(true)

      if (profile.type === 'visionario') {
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, title, description, category, stage, status, idea_roles(role_name)')
          .eq('founder_id', user.id)
          .order('created_at', { ascending: false })
        const founderName = profile.name || ''
        const projects = (ideas || []).map(i => mapProject(i, founderName))
        setData(projects)

        // Cuando no tiene ideas propias, mostrar proyectos públicos de la plataforma
        if (projects.length === 0) {
          const { data: pubIdeas } = await supabase
            .from('ideas')
            .select('id, title, description, category, stage, status, users(name), idea_roles(role_name)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(6)
          setPublicIdeas((pubIdeas || []).map(i => mapProject(i, i.users?.name || '')))
        }

        // Mostrar paneles inmediatamente con los proyectos — nunca bloquear por matches
        if (projects.length > 0) {
          setTeamPanels(projects.map(p => ({ ideaId: p.id, title: p.title, category: p.category, members: [{ name: founderName || 'Vos', avatar_url: null }] })))

          // Enriquecer con miembros, equity e invitados en background (no bloquea el render)
          Promise.all(projects.map(async p => {
            const [{ data: matches }, { data: invitedMatches }] = await Promise.all([
              supabase.from('matches').select('talent_id, users(id, name, avatar_url), equity_pct, role_suggested').eq('idea_id', p.id).eq('status', 'accepted'),
              supabase.from('matches').select('talent_id, users(id, name, avatar_url), role_suggested, score').eq('idea_id', p.id).in('status', ['invited', 'pending']),
            ])
            const members = [
              { name: founderName || 'Vos', avatar_url: null },
              ...(matches || []).map(m => ({ name: m.users?.name, avatar_url: m.users?.avatar_url })),
            ]
            return { ideaId: p.id, title: p.title, category: p.category, members, matches: matches || [], invited: invitedMatches || [] }
          })).then(enriched => {
            if (cancelled) return
            setTeamPanels(enriched.map(({ matches: _, invited: __, ...p }) => p))
            const allEquity = []
            enriched.forEach(e => e.matches.forEach(m => {
              if (m.equity_pct) allEquity.push({ ideaTitle: e.title, name: m.users?.name, role: m.role_suggested, equity_pct: parseFloat(m.equity_pct) })
            }))
            setFounderEquity(allEquity)
            const invMap = {}
            enriched.forEach(e => { invMap[e.ideaId] = e.invited })
            setInvitedByIdea(invMap)
          }).catch(() => {})
        }
      }

      if (profile.type === 'talento') {
        const { data: matches } = await supabase
          .from('matches')
          .select('id, role_suggested, score, ai_reasoning, status, equity_pct, ideas(id, title, category, stage)')
          .eq('talent_id', user.id)
          .order('created_at', { ascending: false })
        setData(matches || [])

        // Fetch team panels for accepted matches
        const accepted = (matches || []).filter(m => m.status === 'accepted')
        if (accepted.length > 0) {
          const panels = await Promise.all(accepted.map(async m => {
            const ideaId = m.ideas?.id
            if (!ideaId) return null
            const { data: teamMatches } = await supabase
              .from('matches')
              .select('talent_id')
              .eq('idea_id', ideaId)
              .eq('status', 'accepted')
            const talentIds = (teamMatches || []).map(tm => tm.talent_id)
            let members = [{ name: 'Fundador', avatar_url: null }]
            if (talentIds.length) {
              const { data: talentUsers } = await supabase
                .from('users').select('id, name, avatar_url').in('id', talentIds)
              members = [
                { name: 'Fundador', avatar_url: null },
                ...(talentUsers || []).map(u => ({ name: u.name, avatar_url: u.avatar_url })),
              ]
            }
            return { ideaId, title: m.ideas?.title, category: m.ideas?.category, members }
          }))
          setTeamPanels(panels.filter(Boolean))
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

    fetchData().catch(() => { if (!cancelled) setDataLoading(false) }).finally(() => clearTimeout(safetyTimer))
    return () => { cancelled = true; clearTimeout(safetyTimer) }
  }, [user?.id, profile?.type])

  if (loading || !profileFetched) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spinner />
    </div>
  )

  if (!user || !profile?.type) return null

  const s = { padding: '100px 24px 60px', maxWidth: 1000, margin: '0 auto' }
  const lbl = { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, display: 'block' }
  const sectionTitle = { fontSize: 18, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 6 }

  const hasIdea = data.length > 0

  // ── VISIONARIO ────────────────────────────────────────────────────────────
  if (profile?.type === 'visionario') return (
    <div className="page-wrap">
      <div style={s}>
        <span style={lbl}>Dashboard</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Hola, {profile?.name?.split(' ')[0] || 'Visionario'} 👋</h1>
            <p style={{ color: '#666', fontSize: 15 }}>Tus ideas y el espacio privado de cada equipo.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '11px 22px', fontSize: 14, flexShrink: 0 }}>
            + Nueva idea
          </button>
        </div>

        <CreditBlock profile={profile} hasIdea={hasIdea} />
        <ReferralBlock profile={profile} />

        {/* ── Mis Ideas (unified: idea info + panel button) ── */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={sectionTitle}>Mis ideas</h2>
            <button className="btn-ghost" onClick={() => navigate('/proyectos')} style={{ fontSize: 14 }}>Ver todas →</button>
          </div>

          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : data.length === 0 ? (
            <>
              <div style={{ padding: '36px 24px', border: '1px dashed #e8e8e8', borderRadius: 14, textAlign: 'center', color: '#777', marginBottom: publicIdeas.length > 0 ? 40 : 0 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Todavía no lanzaste ninguna idea.</div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>La IA construye el equipo perfecto en minutos.</div>
                <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '11px 24px', fontSize: 14 }}>Lanzar mi primera idea →</button>
              </div>
              {publicIdeas.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h2 style={sectionTitle}>Proyectos en la plataforma</h2>
                      <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Ideas activas de otros visionarios — explorá el ecosistema.</p>
                    </div>
                    <button className="btn-ghost" onClick={() => navigate('/proyectos')} style={{ fontSize: 14 }}>Ver todos →</button>
                  </div>
                  <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))', gap: 16 }}>
                    {publicIdeas.map(p => <ProjectCard key={p.id} project={p} onFavorite={() => {}} />)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.map(p => {
                const panel = teamPanels.find(tp => tp.ideaId === p.id)
                const members = panel?.members || []
                return (
                  <div key={p.id} style={{ border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', background: '#fff', transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#d0d0d0'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e8e8'}
                  >
                    <div style={{ padding: '22px 24px', cursor: 'pointer' }} onClick={() => navigate(`/proyectos/${p.id}`)}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: p.formed ? 'rgba(34,197,94,.1)' : 'rgba(232,97,26,.1)', color: p.formed ? '#22c55e' : '#E8611A', border: `1px solid ${p.formed ? 'rgba(34,197,94,.2)' : 'rgba(232,97,26,.2)'}` }}>
                          {p.formed ? '✓ Equipo formado' : '⚡ Buscando equipo'}
                        </span>
                        {p.category && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f0f0f0', color: '#666', border: '1px solid #e8e8e8' }}>{p.category}</span>}
                        {p.stage && <span style={{ fontSize: 11, color: '#999' }}>{p.stage}</span>}
                      </div>
                      {/* Title + description */}
                      <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 6, lineHeight: 1.3 }}>{p.title}</h3>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, marginBottom: members.length > 0 ? 14 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.description}
                      </p>
                      {/* Team members */}
                      {members.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex' }}>
                            {members.slice(0, 5).map((m, i) => (
                              <div key={i} title={m.name} style={{ width: 26, height: 26, borderRadius: '50%', background: '#f0f0f0', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                                {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name?.charAt(0)?.toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: 12, color: '#888' }}>{members.length} {members.length === 1 ? 'miembro' : 'miembros'}</span>
                        </div>
                      )}
                    </div>
                    {/* Candidatos IA */}
                    {(invitedByIdea[p.id] || []).length > 0 && (
                      <div style={{ borderTop: '1px solid #f5f5f5', padding: '14px 24px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                          🤖 Candidatos encontrados por la IA
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                          {(invitedByIdea[p.id] || []).map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 99, fontSize: 12 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                                {m.users?.avatar_url ? <img src={m.users.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : m.users?.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: '#333' }}>{m.users?.name}</span>
                              <span style={{ color: '#bbb' }}>·</span>
                              <span style={{ color: '#777', fontSize: 11 }}>{m.role_suggested}</span>
                              <span style={{ fontSize: 10, padding: '1px 7px', background: 'rgba(251,191,36,.1)', color: '#d97706', border: '1px solid rgba(251,191,36,.25)', borderRadius: 99, fontWeight: 700 }}>Pendiente</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Footer with panel button */}
                    <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        {['Roadmap', 'Ideas IA', 'Consultor'].map(f => (
                          <span key={f} style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#E8611A' }}>·</span> {f}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/panel/${p.id}`) }}
                        style={{ padding: '8px 18px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d4561a'}
                        onMouseLeave={e => e.currentTarget.style.background = '#E8611A'}
                      >
                        ⚡ Panel IA →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Billetera de Equity (fundador) ── */}
        {!dataLoading && founderEquity.length > 0 && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={sectionTitle}>Equity distribuido</h2>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,.2)', borderRadius: 99, padding: '2px 10px' }}>Activo</span>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Participaciones comprometidas con tu equipo.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {founderEquity.map((e, i) => (
                <div key={i} style={{ padding: '18px 20px', border: '1px solid rgba(34,197,94,.2)', borderRadius: 12, background: 'rgba(34,197,94,.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Equity</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#0a0a0a', letterSpacing: -1, marginBottom: 4 }}>{e.equity_pct}<span style={{ fontSize: 18 }}>%</span></div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{e.role} · {e.ideaTitle}</div>
                </div>
              ))}
              <div style={{ padding: '18px 20px', border: '1px dashed #d0d0d0', borderRadius: 12, background: '#f8f9fa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, minHeight: 110 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#E8611A', letterSpacing: -1 }}>
                  {founderEquity.reduce((acc, e) => acc + e.equity_pct, 0).toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Total entregado</div>
              </div>
            </div>
          </div>
        )}

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
          <p style={{ color: '#666', fontSize: 15, marginBottom: 28 }}>Tus invitaciones a proyectos y el espacio privado de tu equipo.</p>

          <CreditBlock profile={profile} hasIdea={data.some(m => m.status === 'accepted')} />
          <ReferralBlock profile={profile} />

          {/* ── Paneles activos ── */}
          {teamPanels.length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={sectionTitle}>Tu espacio de equipo</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(232,97,26,.12)', color: '#E8611A', border: '1px solid rgba(232,97,26,.2)', borderRadius: 99, padding: '2px 10px' }}>IA</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Accedé al panel privado con roadmap, ideas y asesor IA de tu proyecto.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamPanels.map(p => <TeamPanelCard key={p.ideaId} {...p} />)}
              </div>
            </div>
          )}

          {/* ── Estado del perfil ── */}
          <div style={{ padding: '20px 24px', border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: profile.available ? '#22c55e' : '#666', animation: profile.available ? 'pulse 2s infinite' : 'none' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.available ? 'Perfil activo — visible para la IA' : 'Perfil pausado'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>La IA puede invitarte a proyectos que matcheen con tu perfil</div>
              </div>
            </div>
            <button className="btn-outline" onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', fontSize: 13 }}>Editar perfil</button>
          </div>

          {/* ── Billetera de Equity ── */}
          {!dataLoading && data.filter(m => m.status === 'accepted' && m.equity_pct).length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={sectionTitle}>Billetera de equity</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,.2)', borderRadius: 99, padding: '2px 10px' }}>Activa</span>
              </div>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Participaciones comprometidas en proyectos del ecosistema.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginBottom: 16 }}>
                {data.filter(m => m.status === 'accepted' && m.equity_pct).map(m => (
                  <div key={m.id} style={{ padding: '18px 20px', border: '1px solid rgba(34,197,94,.2)', borderRadius: 12, background: 'rgba(34,197,94,.04)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Equity</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0a0a0a', letterSpacing: -1, marginBottom: 4 }}>{m.equity_pct}<span style={{ fontSize: 18 }}>%</span></div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>{m.ideas?.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{m.role_suggested} · {m.ideas?.stage}</div>
                  </div>
                ))}
                <div style={{ padding: '18px 20px', border: '1px dashed #d0d0d0', borderRadius: 12, background: '#f8f9fa', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4, minHeight: 110 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#E8611A', letterSpacing: -1 }}>
                    {data.filter(m => m.status === 'accepted' && m.equity_pct).reduce((acc, m) => acc + (m.equity_pct || 0), 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Total acumulado</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Invitaciones ── */}
          <div>
            <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Invitaciones recibidas</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Proyectos donde la IA eligió tu perfil.</p>

            {dataLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
            ) : data.length === 0 ? (
              <div style={{ padding: 32, border: '1px dashed #e8e8e8', borderRadius: 12, textAlign: 'center', color: '#777' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                <div style={{ fontSize: 14 }}>Cuando la IA te elija para un proyecto, aparece acá.</div>
              </div>
            ) : (
              data.map(m => (
                <div key={m.id} style={{ padding: 22, border: '1px solid #e8e8e8', borderRadius: 12, background: '#f8f9fa', marginBottom: 12 }}>
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
                      Te eligieron para <strong style={{ color: '#0a0a0a' }}>{m.role_suggested}</strong>. {m.ai_reasoning}
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
        <p style={{ color: '#666', fontSize: 15, marginBottom: 28 }}>Tu pipeline de proyectos e inversiones.</p>

        <CreditBlock profile={profile} hasIdea={hasIdea} />
        <ReferralBlock profile={profile} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={sectionTitle}>Proyectos con equipo formado</h2>
            <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '8px 16px', fontSize: 13 }}>Ver todos →</button>
          </div>
          {dataLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : data.length === 0 ? (
            <div style={{ padding: 32, border: '1px dashed #e8e8e8', borderRadius: 12, textAlign: 'center', color: '#777' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💼</div>
              <div style={{ fontSize: 14 }}>Todavía no hay proyectos con equipos formados.</div>
            </div>
          ) : (
            <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {data.map(p => <ProjectCard key={p.id} project={p} onFavorite={() => {}} showContact />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return null
}
