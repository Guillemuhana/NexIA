import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { analyzeProject } from '../lib/gemini'

// ── SVG Icons ──────────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = 'currentColor' }) {
  const paths = {
    overview:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    roadmap:   'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    ideas:     'M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8C6.4 13.9 5 11.6 5 9a7 7 0 0 1 7-7z M9 21h6 M10 17v1 M14 17v1',
    metrics:   'M18 20V10 M12 20V4 M6 20v-6',
    team:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    refresh:   'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    chevron:   'M9 18l6-6-6-6',
    arrow:     'M5 12h14 M12 5l7 7-7 7',
    warning:   'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    check:     'M20 6L9 17l-5-5',
    zap:       'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    target:    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    lock:      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
    back:      'M19 12H5 M12 19l-7-7 7-7',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(paths[name] || '').split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, r = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, #141414 25%, #1e1e1e 50%, #141414 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  )
}

function SkeletonBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton h={22} w="60%" />
      <Skeleton h={14} />
      <Skeleton h={14} w="85%" />
      <Skeleton h={14} w="70%" />
    </div>
  )
}

// ── Pill badge ─────────────────────────────────────────────────────────────
function Pill({ label, color = '#333', textColor = '#aaa' }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color, color: textColor, letterSpacing: '.3px', textTransform: 'uppercase' }}>
      {label}
    </span>
  )
}

const IMPACT_COLOR = { alto: ['rgba(232,97,26,.15)', '#E8611A'], medio: ['rgba(234,179,8,.12)', '#eab308'], bajo: ['rgba(100,100,100,.15)', '#666'] }
const PROB_COLOR   = { alta: ['rgba(239,68,68,.12)', '#ef4444'], media: ['rgba(234,179,8,.12)', '#eab308'], baja: ['rgba(74,222,128,.1)', '#4ade80'] }

// ── Main component ─────────────────────────────────────────────────────────
export default function ProyectoPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [idea, setIdea]           = useState(null)
  const [team, setTeam]           = useState([])
  const [access, setAccess]       = useState(null) // null=checking, true, false
  const [activeSection, setActive] = useState('overview')
  const [ai, setAi]               = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState(null)

  // Fetch project + check access
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }

    async function load() {
      const { data: ideaData } = await supabase
        .from('ideas')
        .select('*, users(name, email, avatar_url)')
        .eq('id', id)
        .single()

      if (!ideaData) { setAccess(false); return }
      setIdea(ideaData)

      // Check if founder
      if (ideaData.founder_id === user.id) {
        setAccess(true)
        loadTeam(ideaData)
        return
      }

      // Check if accepted talent
      const { data: match } = await supabase
        .from('matches')
        .select('id')
        .eq('idea_id', id)
        .eq('talent_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (match) {
        setAccess(true)
        loadTeam(ideaData)
      } else {
        setAccess(false)
      }
    }

    async function loadTeam(ideaData) {
      const { data: matches } = await supabase
        .from('matches')
        .select('talent_id, role_sought, users(name, avatar_url)')
        .eq('idea_id', id)
        .eq('status', 'accepted')

      const members = [
        {
          id: ideaData.founder_id,
          name: ideaData.users?.name || 'Fundador',
          avatar_url: ideaData.users?.avatar_url,
          role: 'Fundador / CEO',
          isSelf: ideaData.founder_id === user.id,
        },
        ...(matches || []).map(m => ({
          id: m.talent_id,
          name: m.users?.name || 'Miembro',
          avatar_url: m.users?.avatar_url,
          role: m.role_sought || 'Talento',
          isSelf: m.talent_id === user.id,
        })),
      ]
      setTeam(members)
    }

    load()
  }, [id, user, authLoading])

  const generateAI = useCallback(async () => {
    if (!idea) return
    setAiLoading(true)
    setAiError(null)
    try {
      const result = await analyzeProject({
        projectTitle: idea.title,
        projectDescription: idea.description,
        projectCategory: idea.category,
        projectStage: idea.stage,
        team: team.map(m => ({ name: m.name, role: m.role })),
      })
      setAi(result)
    } catch (err) {
      setAiError('Error al conectar con la IA. Verificá tu configuración.')
    } finally {
      setAiLoading(false)
    }
  }, [idea, team])

  // Auto-generate on first load when idea + team are ready
  useEffect(() => {
    if (idea && team.length > 0 && !ai && !aiLoading) generateAI()
  }, [idea, team])

  // ── Loading states ─────────────────────────────────────────────────────
  if (authLoading || access === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080808' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (access === false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080808', gap: 16, textAlign: 'center', padding: 24 }}>
        <Icon name="lock" size={40} color="#333" />
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Acceso restringido</h2>
        <p style={{ color: '#555', fontSize: 15, maxWidth: 360, margin: 0 }}>Este panel es exclusivo para el equipo del proyecto. Necesitás ser fundador o miembro aceptado.</p>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: 8, padding: '10px 24px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          Ir al Dashboard
        </button>
      </div>
    )
  }

  const NAV = [
    { id: 'overview', label: 'Visión General', icon: 'overview' },
    { id: 'roadmap',  label: 'Hoja de Ruta',  icon: 'roadmap'  },
    { id: 'ideas',    label: 'Ideas IA',       icon: 'ideas'    },
    { id: 'metrics',  label: 'Métricas',       icon: 'metrics'  },
    { id: 'team',     label: 'Equipo',         icon: 'team'     },
  ]

  return (
    <>
      <style>{`
        @keyframes shimmer { to { background-position: -200% 0 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .panel-nav-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:8px; cursor:pointer; font-size:13.5px; font-weight:500; color:#555; border:none; background:none; width:100%; text-align:left; transition:all .15s; font-family:Inter,sans-serif; }
        .panel-nav-item:hover { color:#ccc; background:rgba(255,255,255,.04); }
        .panel-nav-item.active { color:#E8611A; background:rgba(232,97,26,.1); font-weight:700; }
        .panel-card { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:12px; padding:24px; animation:fadeUp .3s ease; }
        .panel-card + .panel-card { margin-top:16px; }
        .ai-chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:rgba(232,97,26,.1); border:1px solid rgba(232,97,26,.2); border-radius:99px; font-size:11px; font-weight:700; color:#E8611A; letter-spacing:.3px; }
        .phase-row { display:grid; grid-template-columns:200px 1fr; gap:0; }
        .phase-row + .phase-row { border-top:1px solid #111; }
        .ideas-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .idea-card { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:10px; padding:18px; transition:border-color .15s; }
        .idea-card:hover { border-color:#2a2a2a; }
        .metrics-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        .team-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .team-member { background:#0a0a0a; border:1px solid #1a1a1a; border-radius:10px; padding:18px; text-align:center; }
        .riesgo-row { display:grid; grid-template-columns:1fr auto; align-items:start; gap:16px; padding:16px 0; }
        .riesgo-row + .riesgo-row { border-top:1px solid #111; }
        .next-step { display:flex; align-items:flex-start; gap:12px; padding:12px 0; }
        .next-step + .next-step { border-top:1px solid #0d0d0d; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#080808', fontFamily: 'Inter, sans-serif' }}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', padding: '24px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          {/* Logo */}
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', marginBottom: 32, paddingLeft: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -1 }}>nex</span>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -1, color: '#E8611A' }}>IA</span>
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#333', letterSpacing: 1, textTransform: 'uppercase', border: '1px solid #222', borderRadius: 4, padding: '1px 5px' }}>Panel</span>
          </div>

          {/* Project name */}
          <div style={{ paddingLeft: 4, marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: '#333', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Proyecto</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ccc', lineHeight: 1.3, wordBreak: 'break-word' }}>{idea?.title}</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(n => (
              <button key={n.id} className={`panel-nav-item${activeSection === n.id ? ' active' : ''}`} onClick={() => setActive(n.id)}>
                <Icon name={n.icon} size={15} color={activeSection === n.id ? '#E8611A' : '#444'} />
                {n.label}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ paddingTop: 16, borderTop: '1px solid #111' }}>
            <button onClick={() => navigate('/dashboard')} className="panel-nav-item" style={{ color: '#333' }}>
              <Icon name="back" size={15} color="#333" />
              Dashboard
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', maxWidth: 1100 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="ai-chip"><Icon name="zap" size={10} color="#E8611A" /> Powered by Gemini</span>
                {idea?.stage && <Pill label={idea.stage} color="#111" textColor="#555" />}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0, lineHeight: 1.2 }}>{NAV.find(n => n.id === activeSection)?.label}</h1>
              {ai?.vision && activeSection === 'overview' && (
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#555', fontStyle: 'italic' }}>{ai.vision}</p>
              )}
            </div>
            <button
              onClick={generateAI}
              disabled={aiLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: aiLoading ? '#111' : 'rgba(232,97,26,.12)', border: '1px solid rgba(232,97,26,.25)', borderRadius: 8, cursor: aiLoading ? 'not-allowed' : 'pointer', color: aiLoading ? '#444' : '#E8611A', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', transition: 'all .15s', flexShrink: 0 }}
            >
              <Icon name="refresh" size={14} color={aiLoading ? '#444' : '#E8611A'} />
              {aiLoading ? 'Analizando...' : 'Regenerar con IA'}
            </button>
          </div>

          {aiError && (
            <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10, color: '#ef4444', fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="warning" size={16} color="#ef4444" /> {aiError}
            </div>
          )}

          {/* ── OVERVIEW ──────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="panel-card">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Resumen estratégico</div>
                {aiLoading ? <SkeletonBlock /> : ai?.resumen
                  ? <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{ai.resumen}</p>
                  : <p style={{ color: '#333', fontSize: 14, margin: 0 }}>Generando análisis...</p>
                }
              </div>

              {/* Next steps */}
              <div className="panel-card">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Próximos pasos</div>
                {aiLoading
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(5)].map((_, i) => <Skeleton key={i} h={14} w={`${80 - i * 8}%`} />)}</div>
                  : (ai?.proximos_pasos || []).map((step, i) => (
                    <div key={i} className="next-step">
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(232,97,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#E8611A' }}>{i + 1}</span>
                      </div>
                      <span style={{ color: '#bbb', fontSize: 14, lineHeight: 1.5, paddingTop: 3 }}>{step}</span>
                    </div>
                  ))
                }
              </div>

              {/* Team advice */}
              {(ai?.consejo_equipo || aiLoading) && (
                <div className="panel-card" style={{ background: 'rgba(232,97,26,.04)', borderColor: 'rgba(232,97,26,.15)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Consejo para el equipo</div>
                  {aiLoading ? <Skeleton h={14} w="90%" /> : (
                    <p style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{ai.consejo_equipo}"</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ROADMAP ───────────────────────────────────────────── */}
          {activeSection === 'roadmap' && (
            <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
              {aiLoading
                ? <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{[...Array(4)].map((_, i) => <SkeletonBlock key={i} />)}</div>
                : (ai?.roadmap || []).map((phase, i) => (
                  <div key={i} className="phase-row">
                    {/* Left: phase info */}
                    <div style={{ padding: '28px 24px', borderRight: '1px solid #111', background: i % 2 === 0 ? '#0a0a0a' : 'transparent' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Fase {i + 1}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{phase.fase.replace(/^Fase \d+:\s*/i, '')}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: '#111', borderRadius: 99, fontSize: 11, color: '#555' }}>
                        {phase.duracion}
                      </div>
                    </div>
                    {/* Right: tasks */}
                    <div style={{ padding: '28px 24px' }}>
                      <div style={{ fontSize: 12, color: '#555', marginBottom: 12, fontWeight: 600 }}>{phase.objetivo}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(phase.tareas || []).map((tarea, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 16, height: 16, border: '1.5px solid #2a2a2a', borderRadius: 4, flexShrink: 0, marginTop: 1 }} />
                            <span style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5 }}>{tarea}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── IDEAS IA ──────────────────────────────────────────── */}
          {activeSection === 'ideas' && (
            <>
              <p style={{ color: '#444', fontSize: 13, marginBottom: 20 }}>Ideas generadas por IA ordenadas por impacto y esfuerzo.</p>
              <div className="ideas-grid">
                {aiLoading
                  ? [...Array(6)].map((_, i) => (
                    <div key={i} className="idea-card">
                      <Skeleton h={14} w="70%" r={4} />
                      <div style={{ marginTop: 10 }}><Skeleton h={12} /></div>
                      <div style={{ marginTop: 6 }}><Skeleton h={12} w="80%" /></div>
                    </div>
                  ))
                  : (ai?.ideas || []).map((idea, i) => {
                    const [ibg, itxt] = IMPACT_COLOR[idea.impacto] || IMPACT_COLOR.medio
                    return (
                      <div key={i} className="idea-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e0', lineHeight: 1.3 }}>{idea.titulo}</span>
                          <Pill label={idea.categoria} color="#111" textColor="#444" />
                        </div>
                        <p style={{ color: '#555', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 14px' }}>{idea.descripcion}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Pill label={`Impacto ${idea.impacto}`} color={ibg} textColor={itxt} />
                          <Pill label={`Esfuerzo ${idea.esfuerzo}`} color="#111" textColor="#555" />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </>
          )}

          {/* ── METRICS ───────────────────────────────────────────── */}
          {activeSection === 'metrics' && (
            <>
              <div className="metrics-grid" style={{ marginBottom: 24 }}>
                {aiLoading
                  ? [...Array(4)].map((_, i) => (
                    <div key={i} className="panel-card"><SkeletonBlock /></div>
                  ))
                  : (ai?.metricas_clave || []).map((m, i) => (
                    <div key={i} className="panel-card">
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{m.tipo}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{m.meta}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#ccc', marginBottom: 6 }}>{m.nombre}</div>
                      <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.5 }}>{m.descripcion}</div>
                    </div>
                  ))
                }
              </div>

              {/* Risks */}
              <div className="panel-card">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Riesgos a monitorear</div>
                {aiLoading
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(3)].map((_, i) => <SkeletonBlock key={i} />)}</div>
                  : (ai?.riesgos || []).map((r, i) => {
                    const [pbg, ptxt] = PROB_COLOR[r.probabilidad] || PROB_COLOR.media
                    const [ibg, itxt] = IMPACT_COLOR[r.impacto] || IMPACT_COLOR.medio
                    return (
                      <div key={i} className="riesgo-row">
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#ddd', marginBottom: 4 }}>{r.nombre}</div>
                          <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.descripcion}</div>
                          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                            <span style={{ color: '#555', fontWeight: 600 }}>Mitigación: </span>{r.mitigacion}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                          <Pill label={`Prob. ${r.probabilidad}`} color={pbg} textColor={ptxt} />
                          <Pill label={`Impacto ${r.impacto}`} color={ibg} textColor={itxt} />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </>
          )}

          {/* ── TEAM ──────────────────────────────────────────────── */}
          {activeSection === 'team' && (
            <>
              <div className="team-grid">
                {team.map(member => (
                  <div key={member.id} className="team-member">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: member.isSelf ? '2px solid #E8611A' : '2px solid #1a1a1a' }} />
                      : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: member.isSelf ? '2px solid #E8611A' : '2px solid #1a1a1a' }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: member.isSelf ? '#E8611A' : '#555' }}>
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )
                    }
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0', marginBottom: 4 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: '#555' }}>{member.role}</div>
                    {member.isSelf && <div style={{ marginTop: 8 }}><Pill label="Vos" color="rgba(232,97,26,.15)" textColor="#E8611A" /></div>}
                  </div>
                ))}
              </div>

              {ai?.consejo_equipo && !aiLoading && (
                <div className="panel-card" style={{ marginTop: 24, background: 'rgba(232,97,26,.04)', borderColor: 'rgba(232,97,26,.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="zap" size={14} color="#E8611A" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase' }}>Consejo de la IA para el equipo</span>
                  </div>
                  <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{ai.consejo_equipo}"</p>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </>
  )
}
