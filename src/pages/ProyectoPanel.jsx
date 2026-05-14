import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { analyzeProject, chatWithProject } from '../lib/gemini'

function Icon({ name, size = 18, color = 'currentColor' }) {
  const paths = {
    overview: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    roadmap:  'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    ideas:    'M12 2a7 7 0 0 1 7 7c0 2.6-1.4 4.9-3.5 6.2V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.8C6.4 13.9 5 11.6 5 9a7 7 0 0 1 7-7z M9 21h6',
    metrics:  'M18 20V10 M12 20V4 M6 20v-6',
    team:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    chat:     'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    refresh:  'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    send:     'M22 2L11 13 M22 2L15 22l-4-9-9-4 22-7z',
    warning:  'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    zap:      'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    lock:     'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
    back:     'M19 12H5 M12 19l-7-7 7-7',
    bot:      'M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z M9 12h.01 M15 12h.01 M9 16s1 1 3 1 3-1 3-1',
    sparkle:  'M12 3l1.88 5.47L19 9l-4.5 4.07L15.76 19 12 16.25 8.24 19l1.26-5.93L5 9l5.12-.53L12 3z',
    log:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {(paths[name] || '').split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  )
}

function Skeleton({ w = '100%', h = 16, r = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#e8e8e8 25%,#d0d0d0 50%,#e8e8e8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

function SkeletonBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton h={22} w="60%" /><Skeleton h={14} /><Skeleton h={14} w="85%" /><Skeleton h={14} w="70%" />
    </div>
  )
}

function Pill({ label, color = '#f0f0f0', textColor = '#666' }) {
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color, color: textColor, letterSpacing: '.3px', textTransform: 'uppercase' }}>{label}</span>
}

const IMPACT_COLOR = { alto: ['rgba(232,97,26,.15)', '#E8611A'], medio: ['rgba(234,179,8,.12)', '#eab308'], bajo: ['rgba(100,100,100,.15)', '#666'] }
const PROB_COLOR   = { alta: ['rgba(239,68,68,.12)', '#ef4444'], media: ['rgba(234,179,8,.12)', '#eab308'], baja: ['rgba(74,222,128,.1)', '#4ade80'] }

// ── Chat bubble ────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,97,26,.15)', border: '1px solid rgba(232,97,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
          <Icon name="bot" size={14} color="#E8611A" />
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '12px 16px', borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#E8611A' : '#f0f0f0', border: isUser ? 'none' : '1px solid #e8e8e8',
        fontSize: 14, color: isUser ? '#fff' : '#333', lineHeight: 1.65, whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
        {msg._isDemo && <div style={{ marginTop: 8, fontSize: 11, color: isUser ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', fontStyle: 'italic' }}>Modo demo</div>}
      </div>
    </div>
  )
}

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,97,26,.15)', border: '1px solid rgba(232,97,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="bot" size={14} color="#E8611A" />
      </div>
      <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#f0f0f0', border: '1px solid #e8e8e8', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8611A', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Ask AI button ───────────────────────────────────────────────────────────
function AskAIButton({ question, onAsk }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
      <button
        onClick={() => onAsk(question)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px',
          background: hovered ? 'rgba(232,97,26,.14)' : 'rgba(232,97,26,.07)',
          border: '1px solid rgba(232,97,26,.2)', borderRadius: 99,
          color: '#E8611A', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s',
        }}>
        ✦ Preguntarle a la IA →
      </button>
    </div>
  )
}

const LOG_TYPES = [
  { id: 'milestone', label: 'Milestone',   icon: '⚡', color: '#E8611A', bg: 'rgba(232,97,26,.12)' },
  { id: 'decision',  label: 'Decisión',    icon: '🔵', color: '#3b82f6', bg: 'rgba(59,130,246,.1)'  },
  { id: 'learning',  label: 'Aprendizaje', icon: '💡', color: '#22c55e', bg: 'rgba(34,197,94,.1)'   },
  { id: 'team',      label: 'Equipo',      icon: '👥', color: '#a855f7', bg: 'rgba(168,85,247,.1)'  },
]

const SUGGESTED = [
  '¿Cuál debería ser nuestra primera prioridad esta semana?',
  '¿Cómo validamos el mercado antes de gastar en desarrollo?',
  '¿Qué estrategia de pricing nos recomendás?',
  '¿Cuáles son los 3 errores más comunes en startups como la nuestra?',
]

export default function ProyectoPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [idea, setIdea]             = useState(null)
  const [team, setTeam]             = useState([])
  const [access, setAccess]         = useState(null)
  const [activeSection, setActive]  = useState('overview')
  const [ai, setAi]                 = useState(null)
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiError, setAiError]       = useState(null)

  // Build log state
  const [buildLogs, setBuildLogs] = useState([])
  const [newLog, setNewLog]       = useState('')
  const [logType, setLogType]     = useState('milestone')
  const [logSaving, setLogSaving] = useState(false)

  // Chat state
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatGreeted, setChatGreeted] = useState(false)
  const chatEndRef = useRef(null)

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

      if (ideaData.founder_id === user.id) { setAccess(true); loadTeam(ideaData); loadLogs(); return }

      const { data: match } = await supabase
        .from('matches').select('id').eq('idea_id', id).eq('talent_id', user.id).eq('status', 'accepted').single()

      if (match) { setAccess(true); loadTeam(ideaData); loadLogs() }
      else setAccess(false)
    }

    async function loadLogs() {
      const { data: logsData } = await supabase
        .from('build_logs').select('*, users(name)').eq('idea_id', id).order('created_at', { ascending: false })
      setBuildLogs(logsData || [])
    }

    async function loadTeam(ideaData) {
      const { data: matches } = await supabase
        .from('matches')
        .select('talent_id, role_sought, users(name, avatar_url)')
        .eq('idea_id', id).eq('status', 'accepted')

      setTeam([
        { id: ideaData.founder_id, name: ideaData.users?.name || 'Fundador', avatar_url: ideaData.users?.avatar_url, role: 'Fundador / CEO', isSelf: ideaData.founder_id === user.id },
        ...(matches || []).map(m => ({ id: m.talent_id, name: m.users?.name || 'Miembro', avatar_url: m.users?.avatar_url, role: m.role_sought || 'Talento', isSelf: m.talent_id === user.id })),
      ])
    }

    load()
  }, [id, user, authLoading])

  const generateAI = useCallback(async () => {
    if (!idea) return
    setAiLoading(true); setAiError(null)
    try {
      const result = await analyzeProject({
        projectTitle: idea.title, projectDescription: idea.description,
        projectCategory: idea.category, projectStage: idea.stage,
        team: team.map(m => ({ name: m.name, role: m.role })),
      })
      setAi(result)
    } catch { setAiError('Error al conectar con la IA.') }
    finally { setAiLoading(false) }
  }, [idea, team])

  useEffect(() => { if (idea && team.length > 0 && !ai && !aiLoading) generateAI() }, [idea, team])

  const sendChat = async (question = chatInput.trim()) => {
    if (!question || chatLoading || !idea) return
    setChatInput('')
    const userMsg = { role: 'user', text: question }
    setChatHistory(h => [...h, userMsg])
    setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { answer, _isDemo } = await chatWithProject({
      projectTitle: idea.title,
      projectDescription: idea.description,
      projectCategory: idea.category,
      question,
      history: chatHistory.slice(-6),
    })
    setChatHistory(h => [...h, { role: 'ai', text: answer, _isDemo }])
    setChatLoading(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const addLog = async () => {
    if (!newLog.trim() || !user || !idea || logSaving) return
    setLogSaving(true)
    const { data } = await supabase.from('build_logs').insert({
      idea_id: idea.id, user_id: user.id, type: logType, content: newLog.trim(),
    }).select('*, users(name)').single()
    if (data) setBuildLogs(l => [data, ...l])
    setNewLog('')
    setLogSaving(false)
  }

  const askAI = (question) => {
    if (!chatGreeted && chatHistory.length === 0 && idea) {
      setChatGreeted(true)
      const greeting = ai?.resumen
        ? `¡Hola equipo de ${idea.title}! 👋\n\nYa analicé el proyecto. ${ai.resumen.slice(0, 220)}\n\n¿En qué los puedo ayudar hoy?`
        : `¡Hola equipo de ${idea.title}! 👋\n\nSoy el consultor IA del equipo. Pregúntenme sobre estrategia, producto, decisiones o cualquier desafío. ¿Qué necesitan?`
      setChatHistory([{ role: 'ai', text: greeting }])
    }
    setActive('chat')
    setTimeout(() => {
      if (question) sendChat(question)
    }, 100)
  }

  // ── Access guards ──────────────────────────────────────────────────────
  if (authLoading || access === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (access === false) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f9fa', gap: 16, textAlign: 'center', padding: 24 }}>
      <Icon name="lock" size={40} color="#bbb" />
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0 }}>Acceso restringido</h2>
      <p style={{ color: '#666', fontSize: 15, maxWidth: 360, margin: 0 }}>Este panel es exclusivo para el equipo del proyecto.</p>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: 8, padding: '10px 24px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Ir al Dashboard</button>
    </div>
  )

  const NAV = [
    { id: 'overview', label: 'Visión General', icon: 'overview' },
    { id: 'roadmap',  label: 'Hoja de Ruta',  icon: 'roadmap'  },
    { id: 'ideas',    label: 'Ideas IA',       icon: 'ideas'    },
    { id: 'metrics',  label: 'Métricas',       icon: 'metrics'  },
    { id: 'team',     label: 'Equipo',         icon: 'team'     },
    { id: 'chat',     label: 'Consultor IA',   icon: 'chat'     },
    { id: 'buildlog', label: 'Build Log',       icon: 'log'      },
  ]

  return (
    <>
      <style>{`
        @keyframes shimmer { to { background-position:-200% 0 } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .pnav { display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:500;color:#666;border:none;background:none;width:100%;text-align:left;transition:all .15s;font-family:Inter,sans-serif; }
        .pnav:hover  { color:#333;background:rgba(0,0,0,0.04); }
        .pnav.active { color:#E8611A;background:rgba(232,97,26,.1);font-weight:700; }
        .pcard  { background:#ffffff;border:1px solid #e8e8e8;border-radius:12px;padding:24px;animation:fadeUp .3s ease; }
        .pcard+.pcard { margin-top:16px; }
        .ai-chip { display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:rgba(232,97,26,.1);border:1px solid rgba(232,97,26,.2);border-radius:99px;font-size:11px;font-weight:700;color:#E8611A;letter-spacing:.3px; }
        .phase-row { display:grid;grid-template-columns:200px 1fr; }
        .phase-row+.phase-row { border-top:1px solid #f0f0f0; }
        .ideas-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:12px; }
        .icard { background:#f8f9fa;border:1px solid #e8e8e8;border-radius:10px;padding:18px;transition:border-color .15s; }
        .icard:hover { border-color:#bbb; }
        .metrics-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:12px; }
        .team-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:12px; }
        .tmember { background:#f8f9fa;border:1px solid #e8e8e8;border-radius:10px;padding:18px;text-align:center; }
        .rrisk+.rrisk { border-top:1px solid #f0f0f0; }
        .nstep+.nstep { border-top:1px solid #f5f5f5; }
        .chat-input:focus { outline:none;border-color:rgba(232,97,26,.4); }
        .suggest-btn { background:#f8f9fa;border:1px solid #e8e8e8;border-radius:8px;padding:8px 12px;color:#666;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;text-align:left;transition:all .15s; }
        .suggest-btn:hover { border-color:#bbb;color:#555; }
        .panel-mobile-nav { display:none; }
        @media (max-width:768px) {
          .panel-sidebar { display:none !important; }
          .panel-mobile-nav { display:flex;overflow-x:auto;gap:4px;padding:8px 12px;background:#f8f9fa;border-bottom:1px solid #e8e8e8;position:sticky;top:64px;z-index:50;scrollbar-width:none; }
          .panel-mobile-nav::-webkit-scrollbar { display:none; }
          .panel-mobile-btn { display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;border-radius:8px;border:none;background:none;cursor:pointer;font-family:Inter,sans-serif;font-size:10px;font-weight:600;color:#666;white-space:nowrap;flex-shrink:0;transition:all .15s; }
          .panel-mobile-btn.active { color:#E8611A;background:rgba(232,97,26,.1); }
          .panel-main { padding:16px !important; }
          .panel-chat-main { padding:12px !important; }
          .panel-chat-header { padding:14px 16px !important; }
          .panel-chat-input { padding:10px 12px 16px !important; }
          .panel-buildlog { padding:16px !important; }
          .ideas-grid { grid-template-columns:1fr !important; }
          .metrics-grid { grid-template-columns:1fr !important; }
          .team-grid { grid-template-columns:repeat(2,1fr) !important; }
          .phase-row { grid-template-columns:1fr !important; }
          .phase-row > div:first-child { border-right:none !important;border-bottom:1px solid #f0f0f0; }
          .suggest-grid { grid-template-columns:1fr !important; }
          .panel-header { flex-direction:column;align-items:flex-start;gap:12px; }
          .panel-regen { align-self:flex-start; }
          .pcard { padding:16px !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'Inter, sans-serif' }}>

        {/* ── Mobile tab bar ──────────────────────────────────────── */}
        <div className="panel-mobile-nav">
          {NAV.map(n => (
            <button key={n.id} className={`panel-mobile-btn${activeSection === n.id ? ' active' : ''}`} onClick={() => {
              if (n.id === 'chat' && chatHistory.length === 0 && idea && !chatGreeted) {
                setChatGreeted(true)
                const greeting = ai?.resumen
                  ? `¡Hola equipo de ${idea.title}! 👋\n\nYa analicé el proyecto. ${ai.resumen.slice(0, 220)}\n\n¿En qué los puedo ayudar hoy?`
                  : `¡Hola equipo de ${idea.title}! 👋\n\nSoy el consultor IA del equipo. ¿Qué necesitan?`
                setChatHistory([{ role: 'ai', text: greeting }])
              }
              setActive(n.id)
            }}>
              <Icon name={n.icon} size={16} color={activeSection === n.id ? '#E8611A' : '#777'} />
              {n.label}
            </button>
          ))}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="panel-sidebar" style={{ width: 224, flexShrink: 0, borderRight: '1px solid #e8e8e8', background: '#ffffff', display: 'flex', flexDirection: 'column', padding: '24px 12px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', marginBottom: 32, paddingLeft: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -1 }}>Equ</span>
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -1, color: '#E8611A' }}>ia</span>
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', border: '1px solid #d0d0d0', borderRadius: 4, padding: '1px 5px' }}>Panel</span>
          </div>

          {/* Project name + team count */}
          <div style={{ paddingLeft: 4, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Proyecto</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', lineHeight: 1.3, wordBreak: 'break-word', marginBottom: 8 }}>{idea?.title}</div>
          </div>

          {/* Team mini-avatars */}
          {team.length > 0 && (
            <div style={{ paddingLeft: 4, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 0 }}>
              {team.slice(0, 5).map((m, i) => (
                <div key={m.id} style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #f8f9fa', marginLeft: i === 0 ? 0 : -8, background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: m.isSelf ? '#E8611A' : '#666', overflow: 'hidden', flexShrink: 0 }}>
                  {m.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.name.charAt(0).toUpperCase()}
                </div>
              ))}
              <span style={{ marginLeft: 10, fontSize: 11, color: '#777' }}>{team.length} miembros</span>
            </div>
          )}

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(n => (
              <button key={n.id} className={`pnav${activeSection === n.id ? ' active' : ''}`} onClick={() => {
                if (n.id === 'chat' && chatHistory.length === 0 && idea && !chatGreeted) {
                  setChatGreeted(true)
                  const greeting = ai?.resumen
                    ? `¡Hola equipo de ${idea.title}! 👋\n\nYa analicé el proyecto. ${ai.resumen.slice(0, 220)}\n\n¿En qué los puedo ayudar hoy?`
                    : `¡Hola equipo de ${idea.title}! 👋\n\nSoy el consultor IA del equipo. Pregúntenme sobre estrategia, producto, decisiones o cualquier desafío. ¿Qué necesitan?`
                  setChatHistory([{ role: 'ai', text: greeting }])
                }
                setActive(n.id)
              }}>
                <Icon name={n.icon} size={15} color={activeSection === n.id ? '#E8611A' : '#777'} />
                {n.label}
                {n.id === 'buildlog' && buildLogs.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#f0f0f0', color: '#666', borderRadius: 99, padding: '1px 6px', border: '1px solid #e8e8e8' }}>{buildLogs.length}</span>
                )}
                {n.id === 'chat' && chatHistory.length === 0 && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,.6)', flexShrink: 0 }} />
                )}
                {n.id === 'chat' && chatHistory.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#E8611A', color: '#fff', borderRadius: 99, padding: '1px 6px' }}>{Math.ceil(chatHistory.length / 2)}</span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ paddingTop: 16, borderTop: '1px solid #e8e8e8' }}>
            <button onClick={() => navigate('/dashboard')} className="pnav" style={{ color: '#888' }}>
              <Icon name="back" size={15} color="#888" /> Dashboard
            </button>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main className={activeSection !== 'chat' && activeSection !== 'buildlog' ? 'panel-main' : ''} style={{ flex: 1, overflowY: 'auto', padding: (activeSection === 'chat' || activeSection === 'buildlog') ? 0 : '40px 48px', maxWidth: 1100, display: 'flex', flexDirection: 'column' }}>

          {activeSection !== 'chat' && activeSection !== 'buildlog' && (
            <>
              {/* Header */}
              <div className="panel-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className="ai-chip"><Icon name="zap" size={10} color="#E8611A" /> Gemini AI</span>
                    {ai?._isDemo && <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>modo demo</span>}
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0a0a0a', letterSpacing: '-1px', margin: 0 }}>{NAV.find(n => n.id === activeSection)?.label}</h1>
                  {ai?.vision && activeSection === 'overview' && (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666', fontStyle: 'italic' }}>{ai.vision}</p>
                  )}
                </div>
                <button onClick={generateAI} disabled={aiLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: aiLoading ? '#f0f0f0' : 'rgba(232,97,26,.1)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 8, cursor: aiLoading ? 'not-allowed' : 'pointer', color: aiLoading ? '#777' : '#E8611A', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
                  <Icon name="refresh" size={14} color={aiLoading ? '#777' : '#E8611A'} />
                  {aiLoading ? 'Analizando...' : 'Regenerar'}
                </button>
              </div>

              {ai?._isDemo && (
                <div style={{ padding: '11px 16px', background: 'rgba(234,179,8,.06)', border: '1px solid rgba(234,179,8,.12)', borderRadius: 10, fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#eab308' }}>
                  <Icon name="warning" size={14} color="#eab308" />
                  Datos de ejemplo. Configurá tu GEMINI_API_KEY para análisis real.
                </div>
              )}
            </>
          )}

          {/* ── OVERVIEW ──────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="pcard">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Resumen estratégico</div>
                {aiLoading ? <SkeletonBlock /> : <p style={{ color: '#555', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{ai?.resumen || '...'}</p>}
              </div>
              <div className="pcard">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Próximos pasos</div>
                {aiLoading
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(5)].map((_, i) => <Skeleton key={i} h={14} w={`${80 - i * 8}%`} />)}</div>
                  : (ai?.proximos_pasos || []).map((step, i) => (
                    <div key={i} className="nstep" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(232,97,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#E8611A' }}>{i + 1}</span>
                      </div>
                      <span style={{ color: '#444', fontSize: 14, lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
                    </div>
                  ))
                }
              </div>
              {(ai?.consejo_equipo || aiLoading) && (
                <div className="pcard" style={{ background: 'rgba(232,97,26,.03)', borderColor: 'rgba(232,97,26,.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Icon name="sparkle" size={13} color="#E8611A" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase' }}>Consejo para el equipo</span>
                  </div>
                  {aiLoading ? <Skeleton h={14} w="90%" /> : <p style={{ color: '#333', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{ai?.consejo_equipo}"</p>}
                </div>
              )}
              <AskAIButton question="¿Cuál debería ser nuestra primera prioridad esta semana para avanzar más rápido?" onAsk={askAI} />
            </div>
          )}

          {/* ── ROADMAP ───────────────────────────────────────────── */}
          {activeSection === 'roadmap' && (
            <>
              <div className="pcard" style={{ padding: 0, overflow: 'hidden' }}>
                {aiLoading
                  ? <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{[...Array(4)].map((_, i) => <SkeletonBlock key={i} />)}</div>
                  : (ai?.roadmap || []).map((phase, i) => (
                    <div key={i} className="phase-row">
                      <div style={{ padding: '26px 22px', borderRight: '1px solid #f0f0f0', background: i % 2 === 0 ? '#f8f9fa' : 'transparent' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Fase {i + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 8, lineHeight: 1.3 }}>{phase.fase.replace(/^Fase \d+:\s*/i, '')}</div>
                        <span style={{ fontSize: 11, padding: '3px 8px', background: '#f0f0f0', borderRadius: 99, color: '#666' }}>{phase.duracion}</span>
                      </div>
                      <div style={{ padding: '26px 22px' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 12, fontWeight: 600 }}>{phase.objetivo}</div>
                        {(phase.tareas || []).map((t, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 15, height: 15, border: '1.5px solid #d0d0d0', borderRadius: 4, flexShrink: 0, marginTop: 1 }} />
                            <span style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }
              </div>
              <AskAIButton question="¿Cómo ajustamos el roadmap para llegar al MVP más rápido?" onAsk={askAI} />
            </>
          )}

          {/* ── IDEAS IA ──────────────────────────────────────────── */}
          {activeSection === 'ideas' && (
            <>
              <p style={{ color: '#777', fontSize: 13, marginBottom: 18 }}>Ideas generadas por IA — ordenadas por impacto.</p>
              <div className="ideas-grid">
                {aiLoading
                  ? [...Array(6)].map((_, i) => <div key={i} className="icard"><Skeleton h={14} w="70%" /><div style={{ marginTop: 10 }}><Skeleton h={12} /></div><div style={{ marginTop: 6 }}><Skeleton h={12} w="80%" /></div></div>)
                  : (ai?.ideas || []).map((idea, i) => {
                    const [ibg, itxt] = IMPACT_COLOR[idea.impacto] || IMPACT_COLOR.medio
                    return (
                      <div key={i} className="icard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#222', lineHeight: 1.3 }}>{idea.titulo}</span>
                          <Pill label={idea.categoria} />
                        </div>
                        <p style={{ color: '#666', fontSize: 12.5, lineHeight: 1.6, margin: '0 0 12px' }}>{idea.descripcion}</p>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <Pill label={`Impacto ${idea.impacto}`} color={ibg} textColor={itxt} />
                          <Pill label={`Esfuerzo ${idea.esfuerzo}`} />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
              <AskAIButton question="¿Cuál de estas ideas tiene más potencial dado nuestro contexto y recursos actuales?" onAsk={askAI} />
            </>
          )}

          {/* ── METRICS ───────────────────────────────────────────── */}
          {activeSection === 'metrics' && (
            <>
              <div className="metrics-grid" style={{ marginBottom: 16 }}>
                {aiLoading
                  ? [...Array(4)].map((_, i) => <div key={i} className="pcard"><SkeletonBlock /></div>)
                  : (ai?.metricas_clave || []).map((m, i) => (
                    <div key={i} className="pcard">
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{m.tipo}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#0a0a0a', marginBottom: 4 }}>{m.meta}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>{m.nombre}</div>
                      <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.5 }}>{m.descripcion}</div>
                    </div>
                  ))
                }
              </div>
              <div className="pcard">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Riesgos a monitorear</div>
                {aiLoading
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{[...Array(3)].map((_, i) => <SkeletonBlock key={i} />)}</div>
                  : (ai?.riesgos || []).map((r, i) => {
                    const [pbg, ptxt] = PROB_COLOR[r.probabilidad] || PROB_COLOR.media
                    const [ibg, itxt] = IMPACT_COLOR[r.impacto] || IMPACT_COLOR.medio
                    return (
                      <div key={i} className="rrisk" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, padding: '14px 0' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#222', marginBottom: 4 }}>{r.nombre}</div>
                          <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.5, marginBottom: 6 }}>{r.descripcion}</div>
                          <div style={{ fontSize: 12, color: '#666' }}><span style={{ fontWeight: 600 }}>Mitigación: </span>{r.mitigacion}</div>
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
              <AskAIButton question="¿Cómo aceleramos el logro de las métricas clave y mitigamos el riesgo más crítico?" onAsk={askAI} />
            </>
          )}

          {/* ── TEAM ──────────────────────────────────────────────── */}
          {activeSection === 'team' && (
            <>
              <div className="team-grid" style={{ marginBottom: 16 }}>
                {team.map(member => (
                  <div key={member.id} className="tmember">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', marginBottom: 10, border: member.isSelf ? '2px solid #E8611A' : '2px solid #e8e8e8' }} />
                      : <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: member.isSelf ? '2px solid #E8611A' : '2px solid #e8e8e8' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: member.isSelf ? '#E8611A' : '#666' }}>{member.name.charAt(0).toUpperCase()}</span>
                        </div>
                    }
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 3 }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{member.role}</div>
                    {member.isSelf && <div style={{ marginTop: 8 }}><Pill label="Vos" color="rgba(232,97,26,.15)" textColor="#E8611A" /></div>}
                  </div>
                ))}
              </div>
              {ai?.consejo_equipo && (
                <div className="pcard" style={{ background: 'rgba(232,97,26,.03)', borderColor: 'rgba(232,97,26,.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Icon name="sparkle" size={13} color="#E8611A" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase' }}>Consejo de la IA para el equipo</span>
                  </div>
                  <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{ai.consejo_equipo}"</p>
                </div>
              )}
              <AskAIButton question="¿Qué roles o habilidades le faltan al equipo para maximizar las probabilidades de éxito?" onAsk={askAI} />
            </>
          )}

          {/* ── CHAT ──────────────────────────────────────────────── */}
          {activeSection === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
              {/* Chat header */}
              <div className="panel-chat-header" style={{ padding: '24px 32px 20px', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,97,26,.15)', border: '1px solid rgba(232,97,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="bot" size={16} color="#E8611A" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a' }}>Consultor IA del equipo</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Preguntale cualquier cosa sobre "{idea?.title}"</div>
                </div>
              </div>

              {/* Messages */}
              <div className="panel-chat-main" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#f8f9fa' }}>
                {chatHistory.length === 0 && (
                  <div style={{ textAlign: 'center', paddingTop: 32 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(232,97,26,.1)', border: '1px solid rgba(232,97,26,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Icon name="sparkle" size={22} color="#E8611A" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 6 }}>Tu asesor de startup privado</div>
                    <div style={{ fontSize: 13, color: '#777', marginBottom: 28, lineHeight: 1.6 }}>Preguntá sobre estrategia, producto, equipo o cualquier duda del proyecto.</div>
                    <div className="suggest-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 520, margin: '0 auto' }}>
                      {SUGGESTED.map(q => (
                        <button key={q} className="suggest-btn" onClick={() => sendChat(q)}>{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatHistory.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
                {chatLoading && <TypingDots />}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="panel-chat-input" style={{ padding: '16px 32px 24px', borderTop: '1px solid #e8e8e8', background: '#ffffff' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    className="chat-input"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                    placeholder="Escribí tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
                    rows={2}
                    style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 10, color: '#0a0a0a', fontSize: 14, fontFamily: 'Inter,sans-serif', padding: '12px 14px', resize: 'none', outline: 'none', lineHeight: 1.5, transition: 'border-color .15s' }}
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={!chatInput.trim() || chatLoading}
                    style={{ width: 44, height: 44, borderRadius: 10, background: chatInput.trim() && !chatLoading ? '#E8611A' : '#f0f0f0', border: '1px solid #e8e8e8', cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}
                  >
                    <Icon name="send" size={16} color={chatInput.trim() && !chatLoading ? '#fff' : '#bbb'} />
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>Powered by Gemini 1.5 Flash · Contexto del proyecto incluido</div>
              </div>
            </div>
          )}

          {/* ── BUILD LOG ─────────────────────────────────────────── */}
          {activeSection === 'buildlog' && (
            <div className="panel-buildlog" style={{ padding: '40px 48px' }}>
              <div className="pcard" style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Nueva entrada</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {LOG_TYPES.map(t => (
                    <button key={t.id} onClick={() => setLogType(t.id)} style={{
                      padding: '5px 14px', borderRadius: 99,
                      border: `1px solid ${logType === t.id ? t.color + '60' : '#e8e8e8'}`,
                      background: logType === t.id ? t.bg : 'transparent',
                      color: logType === t.id ? t.color : '#666',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                      transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newLog}
                  onChange={e => setNewLog(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addLog() }}
                  placeholder="¿Qué pasó hoy? Un avance, una decisión, un aprendizaje..."
                  rows={3}
                  style={{ width: '100%', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 8, color: '#0a0a0a', fontSize: 14, fontFamily: 'Inter,sans-serif', padding: '12px 14px', resize: 'none', outline: 'none', lineHeight: 1.55, boxSizing: 'border-box', transition: 'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(232,97,26,.4)'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
                <button
                  onClick={addLog}
                  disabled={!newLog.trim() || logSaving}
                  style={{ marginTop: 10, padding: '10px 20px', background: newLog.trim() ? '#E8611A' : '#f0f0f0', border: 'none', borderRadius: 8, color: newLog.trim() ? '#fff' : '#bbb', fontWeight: 700, fontSize: 13, cursor: newLog.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif', transition: 'all .15s', opacity: logSaving ? 0.7 : 1 }}
                >
                  {logSaving ? 'Guardando...' : '+ Agregar al Build Log'}
                </button>
              </div>

              {buildLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#666', marginBottom: 6 }}>El historial está vacío</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>Cada avance, decisión o aprendizaje que agregues<br />queda registrado aquí para siempre.</div>
                </div>
              ) : (
                <div>
                  {buildLogs.map((log, i) => {
                    const type = LOG_TYPES.find(t => t.id === log.type) || LOG_TYPES[0]
                    const d = new Date(log.created_at)
                    const dateStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={log.id} style={{ display: 'flex', gap: 14, marginBottom: 16, animation: 'fadeUp .3s ease' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: type.bg, border: `1px solid ${type.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{type.icon}</div>
                          {i < buildLogs.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 20, background: '#e8e8e8', marginTop: 6 }} />}
                        </div>
                        <div className="pcard" style={{ flex: 1, padding: '14px 18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: type.bg, color: type.color }}>{type.label}</span>
                              <span style={{ fontSize: 12, color: '#777' }}>{log.users?.name || 'Equipo'}</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#888' }}>{dateStr}</span>
                          </div>
                          <p style={{ color: '#444', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{log.content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {buildLogs.length > 0 && (
                <AskAIButton question={`Analizá nuestro Build Log con ${buildLogs.length} entradas y danos un diagnóstico del ritmo y salud del proyecto.`} onAsk={askAI} />
              )}
            </div>
          )}

        </main>
      </div>
    </>
  )
}
