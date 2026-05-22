import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../lib/constants'
import { matchTeam } from '../lib/claude'
import { supabase } from '../lib/supabase'
import TalentCard from '../components/TalentCard'
import PaywallModal from '../components/PaywallModal'
import { useAuth } from '../context/AuthContext'

const MATCHING_STEPS = [
  'Analizando descripción del proyecto...',
  'Identificando stack técnico requerido...',
  'Evaluando perfiles disponibles...',
  'Calculando compatibilidad de habilidades...',
  'Verificando disponibilidad y estilo de trabajo...',
  'Optimizando composición del equipo...',
  '¡Equipo ideal encontrado!',
]

const CHAT_STEPS = ['title', 'description', 'category', 'stage', 'roles', 'visibility', 'confirm']

const STEP_OPTIONS = {
  category: ['Tech', 'HealthTech', 'EdTech', 'Fintech', 'Marketplace', 'SaaS', 'Otro'],
  stage: ['Idea (solo concepto)', 'MVP en desarrollo', 'Con primeros usuarios', 'Buscando inversión'],
  visibility: ['🌍 Pública', '🔒 Privada'],
}

function botMsg(stepKey, answers) {
  const t = answers.title || 'tu proyecto'
  switch (stepKey) {
    case 'title':       return '¡Hola! Estoy listo para lanzar tu idea en Equia.\n\n¿Cómo se llama el proyecto?'
    case 'description': return `Buenísimo, **${t}**. Ahora describílo: ¿qué problema resuelve y cómo funciona? Cuanto más detalle, mejor el matching.`
    case 'category':    return `Entendido. ¿En qué categoría entraría mejor **${t}**?`
    case 'stage':       return '¿En qué etapa está la idea ahora?'
    case 'roles':       return `¿Qué roles necesitás en el equipo? Escribilos como quieras, ej: "dev backend, diseñador UX y alguien de marketing".`
    case 'visibility':  return '¿Querés que la idea sea pública (visible para inversores) o privada?'
    case 'confirm':     return `¡Perfecto! Tengo todo para lanzar **${t}**.\n\nVoy a buscar el equipo ideal con IA. ¿Arrancamos?`
    default:            return ''
  }
}

function parseBold(text) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

function BotAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7, background: '#111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginRight: 10, marginTop: 2,
      fontSize: 10, fontWeight: 800, color: '#E8611A', letterSpacing: '-0.3px',
    }}>EQ</div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && <BotAvatar />}
      <div style={{
        maxWidth: '78%', padding: '11px 15px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#E8611A' : '#fff',
        border: isUser ? 'none' : '1px solid #ebebeb',
        fontSize: 14, color: isUser ? '#fff' : '#111', lineHeight: 1.75, whiteSpace: 'pre-wrap',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
      }}>
        {parseBold(msg.text)}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', marginBottom: 12 }}>
      <BotAvatar />
      <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '11px 15px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px 16px 16px 4px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8c8c8', animation: `lanzar-bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

function parseRoles(text) {
  return text
    .split(/[,;\/\n]|\s+y\s+|\s+e\s+/)
    .map(r => r.trim().replace(/^(un|una|el|la|los|las)\s+/i, '').trim())
    .filter(r => r.length > 2 && r.length < 60)
    .slice(0, 8)
}

export default function LanzarIdea() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // Stage: 'chat' | 'matching' | 'results'
  const [stage, setStage] = useState('chat')
  const [currentStep, setCurrentStep] = useState(0)
  const [aiData, setAiData] = useState(null)
  const [flash, setFlash] = useState(false)
  const [matched, setMatched] = useState([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [savedIdeaId, setSavedIdeaId] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([])
  const [chatStepIdx, setChatStepIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  // Initial greeting
  useEffect(() => {
    const greeting = profile?.name
      ? `¡Hola ${profile.name.split(' ')[0]}! Estoy listo para lanzar tu idea en Equia.\n\n¿Cómo se llama el proyecto?`
      : '¡Hola! Estoy listo para lanzar tu idea en Equia.\n\n¿Cómo se llama el proyecto?'
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages([{ role: 'bot', text: greeting }])
    }, 700)
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const currentStepKey = CHAT_STEPS[chatStepIdx]
  const hasOptions = !!STEP_OPTIONS[currentStepKey]

  const advance = (value) => {
    const newAnswers = { ...answers, [currentStepKey]: value }
    setAnswers(newAnswers)

    const userText = currentStepKey === 'visibility'
      ? (value === '🌍 Pública' ? 'Pública' : 'Privada')
      : value
    setMessages(m => [...m, { role: 'user', text: userText }])
    setInput('')

    const nextIdx = chatStepIdx + 1
    if (nextIdx >= CHAT_STEPS.length) return

    const nextKey = CHAT_STEPS[nextIdx]
    setIsTyping(true)
    setChatStepIdx(nextIdx)

    setTimeout(() => {
      setIsTyping(false)
      const nextMsg = botMsg(nextKey, newAnswers)
      setMessages(m => [...m, { role: 'bot', text: nextMsg }])
      if (nextKey === 'confirm') setAwaitingConfirm(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 700)
  }

  const handleSend = () => {
    const val = input.trim()
    if (!val || isTyping) return
    advance(val)
  }

  const handleLaunch = async () => {
    if (!user) { navigate('/registro?rol=visionario'); return }
    setStage('matching')
    setCurrentStep(0)

    const roles = parseRoles(answers.roles || '')
    const isPublic = !answers.visibility?.includes('Privada')

    const fallback = {
      pitch: `${(answers.description || '').slice(0, 120)}...`,
      whyThisTeam: 'Equipo seleccionado por compatibilidad de habilidades y disponibilidad.',
      teamSize: 4, complexity: 'Media', timeEstimate: '4 meses',
      successTip: 'Empezá con un MVP simple y validá con usuarios reales antes de escalar.',
      risks: 'No validar el mercado antes de construir.',
      rolesNeeded: roles,
    }

    const animationDone = new Promise(resolve => {
      let step = 0
      const iv = setInterval(() => {
        step++
        setCurrentStep(step)
        if (step >= MATCHING_STEPS.length - 1) { clearInterval(iv); setTimeout(resolve, 600) }
      }, 600)
    })

    const dataDone = (async () => {
      let analysis = fallback
      try {
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000))
        analysis = await Promise.race([
          matchTeam({ title: answers.title, description: answers.description, category: answers.category, roles }),
          timeout,
        ])
      } catch { /* usa fallback */ }
      setAiData(analysis)

      const rolesNeeded = analysis.rolesNeeded?.length ? analysis.rolesNeeded : roles
      try {
        const { data: tpRows } = await supabase
          .from('talent_profiles')
          .select('user_id, available, main_role, match_score_avg, projects_count')
          .eq('available', true)
          .in('main_role', rolesNeeded.length ? rolesNeeded : ['__none__'])
          .limit(6)

        if (tpRows?.length) {
          const uids = tpRows.map(r => r.user_id)
          const [{ data: usersRows }, { data: skillRows }] = await Promise.all([
            supabase.from('users').select('id, name, avatar_url, location, bio').in('id', uids),
            supabase.from('user_skills').select('user_id, skills(name)').in('user_id', uids),
          ])
          const usersById = Object.fromEntries((usersRows || []).map(u => [u.id, u]))
          const skillsByUser = {}
          ;(skillRows || []).forEach(r => {
            if (!skillsByUser[r.user_id]) skillsByUser[r.user_id] = []
            if (r.skills?.name) skillsByUser[r.user_id].push(r.skills.name)
          })
          setMatched(tpRows.filter(r => usersById[r.user_id]).map(r => {
            const u = usersById[r.user_id]
            return { id: u.id, name: u.name || 'Usuario', avatar: (u.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), avatar_url: u.avatar_url || null, location: u.location || '', bio: u.bio || '', role: r.main_role || '', available: r.available, score: Math.round(r.match_score_avg || 75), projects: r.projects_count || 0, skills: skillsByUser[r.user_id] || [] }
          }))
        }
      } catch {}
    })().catch(() => {})

    const hardTimeout = new Promise(resolve => setTimeout(resolve, 25000))
    await Promise.race([Promise.all([animationDone, dataDone]), hardTimeout])
    setStage('results')
    setFlash(true)
    setTimeout(() => setFlash(false), 700)
  }

  const handleSaveIdea = async () => {
    if (!user) { navigate('/registro?rol=visionario'); return }
    setSaveError('')
    setSending(true)
    const { count } = await supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('founder_id', user.id)
    if ((count || 0) >= 1) { setSending(false); setShowPaywall(true); return }
    await doSaveIdea()
  }

  const handlePayAndSave = async () => {
    setPaymentLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setPaymentLoading(false)
    setShowPaywall(false)
    setSending(true)
    await doSaveIdea()
  }

  const doSaveIdea = async () => {
    setSaveError('')
    const roles = parseRoles(answers.roles || '')
    const isPublic = !answers.visibility?.includes('Privada')
    try {
      const { data: idea, error: ideaError } = await supabase.from('ideas').insert({
        founder_id: user.id,
        title: answers.title,
        description: answers.description,
        category: answers.category || null,
        stage: answers.stage || 'Idea (solo concepto)',
        status: 'active',
        ai_analysis: aiData || null,
        is_public: isPublic,
      }).select().single()

      if (ideaError) throw new Error(ideaError.message)

      // Fire-and-forget — errors here never block the idea from saving
      const rolesNeeded = aiData?.rolesNeeded?.length ? aiData.rolesNeeded : roles
      if (rolesNeeded.length) {
        supabase.from('idea_roles')
          .insert(rolesNeeded.map(r => ({ idea_id: idea.id, role_name: r, filled: false })))
          .then(() => {}).catch(() => {})
      }

      if (matched.length) {
        supabase.from('matches')
          .insert(matched.map(t => ({
            idea_id: idea.id, talent_id: t.id, role_suggested: t.role,
            score: t.score, ai_reasoning: aiData?.whyThisTeam || '', status: 'invited',
          })))
          .then(({ error }) => {
            if (!error) {
              supabase.from('notifications').insert(
                matched.map(t => ({
                  user_id: t.id, type: 'match_received',
                  title: `Fuiste elegido para "${answers.title}"`,
                  body: `La IA te seleccionó como ${t.role} para este proyecto.`,
                  link: '/dashboard', data: { idea_id: idea.id },
                }))
              ).then(() => {}).catch(() => {})
            }
          })
          .catch(() => {})
      }

      setSavedIdeaId(idea.id)
      setSent(true)
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page-wrap">
      <style>{`@keyframes lanzar-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>

      {showPaywall && (
        <PaywallModal
          title="Publicar una idea adicional"
          description="Ya usaste tu idea gratis. Cada idea adicional incluye matching IA garantizado e invitaciones automáticas."
          perks={['Matching IA con los mejores perfiles', 'Invitaciones automáticas personalizadas', 'Equipo garantizado o te devolvemos el dinero']}
          loading={paymentLoading}
          onClose={() => setShowPaywall(false)}
          onConfirm={handlePayAndSave}
        />
      )}

      {/* ── CHAT ─────────────────────────────────────────────────────── */}
      {stage === 'chat' && (
        <div style={{ padding: '90px 24px 60px', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Lanzador de ideas</div>
          <h1 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 6 }}>Tu idea,<br /><span style={{ color: '#E8611A' }}>el equipo perfecto.</span></h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Contestá las preguntas del chat y la IA construirá tu equipo ideal.</p>

          {/* Chat box */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

            {/* Messages */}
            <div style={{ padding: '20px 20px 8px', minHeight: 240, maxHeight: 400, overflowY: 'auto', background: '#fafafa' }}>
              {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
              {isTyping && <TypingDots />}
              <div ref={endRef} />
            </div>

            {/* Option chips */}
            {!isTyping && hasOptions && !awaitingConfirm && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 20px 16px', background: '#fff', borderTop: '1px solid #ebebeb' }}>
                {STEP_OPTIONS[currentStepKey].map(opt => (
                  <button
                    key={opt}
                    onClick={() => advance(opt)}
                    style={{
                      padding: '9px 18px', borderRadius: 99, border: '1.5px solid #e0e0e0',
                      background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      fontFamily: 'Inter,sans-serif', transition: 'all .15s', color: '#333',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8611A'; e.currentTarget.style.color = '#E8611A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#333' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Confirm button */}
            {!isTyping && awaitingConfirm && (
              <div style={{ padding: '8px 20px 20px', background: '#fff', borderTop: '1px solid #ebebeb' }}>
                <button
                  onClick={handleLaunch}
                  style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter,sans-serif', letterSpacing: '0.2px' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Buscar mi equipo con IA →
                </button>
                {!user && <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8 }}>Te pediremos que te registres antes de ver los resultados.</p>}
              </div>
            )}

            {/* Text input */}
            {!isTyping && !hasOptions && !awaitingConfirm && messages.length > 0 && (
              <div style={{ borderTop: '1px solid #ebebeb', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', background: '#fff' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={currentStepKey === 'description' ? 'Describí tu idea...' : currentStepKey === 'roles' ? 'Ej: dev backend, diseñador UX, marketing...' : 'Escribí tu respuesta...'}
                  rows={currentStepKey === 'description' ? 3 : 1}
                  style={{ flex: 1, background: '#f8f9fa', border: '1.5px solid #e8e8e8', borderRadius: 8, color: '#111', fontSize: 14, fontFamily: 'Inter,sans-serif', padding: '10px 12px', resize: 'none', outline: 'none', lineHeight: 1.5, transition: 'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor = '#E8611A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, background: input.trim() ? '#E8611A' : '#f0f0f0', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#bbb'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#E8611A', borderRadius: 99, transition: 'width .4s ease', width: `${Math.round((Math.min(chatStepIdx, CHAT_STEPS.length - 2) / (CHAT_STEPS.length - 2)) * 100)}%` }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', minWidth: 30, textAlign: 'right' }}>
              {Math.round((Math.min(chatStepIdx, CHAT_STEPS.length - 2) / (CHAT_STEPS.length - 2)) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ── MATCHING ─────────────────────────────────────────────────── */}
      {stage === 'matching' && (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>IA en acción</h2>
          <p style={{ color: '#666', marginBottom: 40, fontSize: 14 }}>Analizando: <strong style={{ color: '#0a0a0a' }}>{answers.title}</strong></p>
          <div style={{ width: 48, height: 48, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 40px' }} />
          <div style={{ textAlign: 'left' }}>
            {MATCHING_STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', opacity: i <= currentStep ? 1 : 0.2, transition: 'opacity .4s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i < currentStep ? '#22c55e' : i === currentStep ? '#E8611A' : '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0, transition: 'background .3s' }}>
                  {i < currentStep ? '✓' : ''}
                </div>
                <span style={{ fontSize: 14, color: i <= currentStep ? '#0a0a0a' : '#666' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS ──────────────────────────────────────────────────── */}
      {stage === 'results' && (
        <>
          {flash && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(232,97,26,0.18) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)', animation: 'lightning .7s ease forwards' }} />
          )}
          <div style={{ padding: '100px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>⚡ Equipo encontrado</div>
            <h1 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Tu equipo ideal</h1>
            <p style={{ color: '#666', marginBottom: 32, fontSize: 15 }}>
              {matched.length > 0
                ? `La IA seleccionó ${matched.length} profesionales para "${answers.title}"`
                : `La IA analizó "${answers.title}". Todavía no hay talentos registrados que coincidan.`}
            </p>

            {aiData && (
              <div style={{ padding: 24, marginBottom: 28, border: '1px solid #d0d0d0', borderRadius: 12, background: '#f8f9fa' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>🤖 Análisis de Equia</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', marginBottom: 20 }}>{aiData.pitch}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 20, fontStyle: 'italic' }}>"{aiData.whyThisTeam}"</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 16 }}>
                  {[['Equipo ideal', `${aiData.teamSize} personas`], ['Complejidad', aiData.complexity], ['Tiempo est.', aiData.timeEstimate]].map(([k, v]) => (
                    <div key={k} style={{ padding: '12px 14px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#E8611A' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {aiData.successTip && <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 8, fontSize: 13, color: '#22c55e', lineHeight: 1.6, marginBottom: 10 }}>💡 <strong>Tip:</strong> {aiData.successTip}</div>}
                {aiData.risks && <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 8, fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>⚠️ <strong>Riesgo principal:</strong> {aiData.risks}</div>}
              </div>
            )}

            {matched.length > 0 && (
              <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
                {matched.map((t, i) => (
                  <div key={t.id} style={{ animation: `cardReveal .5s cubic-bezier(.22,1,.36,1) ${i * 120}ms both` }}>
                    <TalentCard talent={t} showInvite={false} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: '28px 24px', border: '1px solid #d0d0d0', borderRadius: 12, textAlign: 'center' }}>
              {sent ? (
                <>
                  <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>Proyecto guardado</h3>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                    {matched.length > 0
                      ? 'Tu proyecto fue guardado y los talentos recibieron su invitación.'
                      : 'Tu proyecto fue guardado. Cuando haya talentos disponibles, se enviarán invitaciones automáticas.'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {savedIdeaId && <button className="btn-primary" onClick={() => navigate(`/panel/${savedIdeaId}`)} style={{ padding: '14px 32px', fontSize: 15 }}>Abrir Panel IA →</button>}
                    <button className="btn-outline" onClick={() => navigate('/dashboard')} style={{ padding: '14px 22px', fontSize: 15 }}>Ver mi dashboard</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>¿Te gusta este equipo?</h3>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                    {matched.length > 0
                      ? 'Se guardará tu proyecto y se enviarán invitaciones personalizadas a cada talento.'
                      : 'Se guardará tu proyecto. Cuando haya talentos disponibles, podrás invitarlos.'}
                  </p>
                  {saveError && (
                    <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>
                      {saveError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={handleSaveIdea} disabled={sending} style={{ padding: '14px 32px', fontSize: 15, opacity: sending ? 0.7 : 1 }}>
                      {sending ? 'Guardando...' : matched.length > 0 ? 'Guardar y enviar invitaciones' : 'Guardar proyecto'}
                    </button>
                    <button className="btn-outline" onClick={() => { setStage('chat'); setAiData(null); setMatched([]); setSent(false); setAwaitingConfirm(false); setChatStepIdx(0); setAnswers({}); setMessages([]); setTimeout(() => { setIsTyping(true); setTimeout(() => { setIsTyping(false); setMessages([{ role: 'bot', text: botMsg('title', {}) }]) }, 700) }, 100) }} style={{ padding: '14px 22px', fontSize: 15 }}>✏️ Editar idea</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
