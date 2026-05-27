import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ACTION_REGEX = /\[EJECUTAR:([\s\S]*?)\]/
const MEMORY_TRIGGER_COUNT = 6

function computeProfilePct(profile) {
  if (!profile) return 0
  const checks = [
    !!profile.name,
    !!profile.bio,
    !!profile.location,
    !!(profile.portfolio_url || profile.linkedin_url),
    !!profile.avatar_url,
    profile.type !== 'talento' || !!profile.role,
  ]
  return Math.round(checks.filter(Boolean).length / checks.length * 100)
}

const SUGGESTIONS = {
  visionario: (profile, hasIdea) => {
    const list = []
    if (!hasIdea) list.push('¿Cómo lanzo mi primera idea?', 'Ayudame a describir mi idea para la IA')
    else list.push('¿Cómo acelero el matching de mi equipo?', '¿Qué perfiles me faltan para el equipo?')
    if (computeProfilePct(profile) < 80) list.push('¿Cómo completo mi perfil?')
    list.push('¿Cómo funciona el algoritmo de IA?')
    return list.slice(0, 4)
  },
  talento: (profile) => {
    const list = []
    if (computeProfilePct(profile) < 80) list.push('Ayudame a completar mi perfil', '¿Qué le falta a mi perfil?')
    list.push('¿Qué proyectos están buscando mi perfil?', '¿Cómo consigo más invitaciones?', '¿Cómo funciona el equity?')
    return list.slice(0, 4)
  },
  inversor: () => [
    '¿Qué proyectos hay disponibles para invertir?',
    '¿Cómo contacto a un fundador?',
    '¿Cómo evalúa la IA los equipos?',
    '¿Qué métricas usan para los proyectos?',
  ],
  default: () => [
    '¿Cómo funciona Equia?',
    '¿Qué tipo de usuario soy?',
    '¿Cómo encuentro el equipo ideal?',
  ],
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 2 }}>
      <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '10px 16px', background: '#f1f1f1', borderRadius: '18px 18px 18px 4px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8611A', animation: `dc-bounce 1.2s ${i * 0.18}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#E8611A,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
            <line x1="13" y1="13" x2="3" y2="4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <line x1="13" y1="13" x2="23" y2="4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <line x1="13" y1="13" x2="3" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <line x1="13" y1="13" x2="23" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <line x1="13" y1="13" x2="13" y2="1" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <circle cx="13" cy="13" r="4.5" fill="#fff" opacity="0.95"/>
          </svg>
        </div>
      )}
      <div style={{
        maxWidth: '76%',
        padding: isUser ? '10px 16px' : '11px 15px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'linear-gradient(135deg,#E8611A,#f97316)' : '#f1f1f1',
        fontSize: 14,
        color: isUser ? '#fff' : '#1a1a1a',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.text}
      </div>
    </div>
  )
}

export default function DashboardChat({ hasIdea = false }) {
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [contextLoaded, setContextLoaded] = useState(false)
  const [userContext, setUserContext] = useState(null)
  const [userMemory, setUserMemory] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)
  const [slowMode, setSlowMode] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const newMsgCountRef = useRef(0)
  const messagesRef = useRef([])
  const slowTimerRef = useRef(null)

  useEffect(() => { messagesRef.current = messages }, [messages])
  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  useEffect(() => {
    if (!user || contextLoaded) return
    loadContext()
  }, [user])

  useEffect(() => { if (messages.length > 0) scrollToBottom() }, [messages])

  const loadContext = async () => {
    try {
      const [
        { data: skillsData },
        { data: ideasData },
        { data: histData },
        { data: memoryData },
      ] = await Promise.all([
        supabase.from('user_skills').select('skills(name)').eq('user_id', user.id),
        supabase.from('ideas').select('title, status').eq('founder_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('assistant_messages').select('role, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(16),
        supabase.from('user_memory').select('summary, goals, style, key_facts, conversation_count').eq('user_id', user.id).maybeSingle(),
      ])

      const skills = (skillsData || []).map(s => s.skills?.name).filter(Boolean)
      const memory = memoryData || { summary: '', goals: [], style: {}, key_facts: [], conversation_count: 0 }

      setUserMemory(memory)
      setUserContext({
        name: profile?.name,
        type: profile?.type,
        role: profile?.role,
        bio: profile?.bio,
        skills,
        location: profile?.location,
        available: profile?.available,
        ideas: ideasData || [],
        credits: profile?.credits ?? 0,
        profilePct: computeProfilePct(profile),
        cvData: profile?.cv_data || null,
        memory,
      })

      if (histData && histData.length > 0) {
        setMessages(histData.reverse().map(m => ({ role: m.role, text: m.text })))
      } else {
        const fn = profile?.name?.split(' ')[0] || ''
        const hasMemory = memory?.summary?.length > 10
        const type = profile?.type
        const pct = computeProfilePct(profile)
        let greeting = ''

        if (hasMemory) {
          greeting = `Hola${fn ? ` ${fn}` : ''}! Ya nos conocemos 😊\n\n${memory.goals?.length ? `Seguís trabajando en: ${memory.goals.slice(0, 2).join(' y ')}. ` : ''}¿En qué te ayudo hoy?`
        } else if (type === 'visionario') {
          greeting = `Hola${fn ? ` ${fn}` : ''}! Soy tu asistente en Equia 🚀\n\nPuedo ayudarte a lanzar tu idea, describir tu proyecto para que la IA encuentre el equipo ideal, o responder cualquier duda sobre la plataforma. ¿Por dónde empezamos?`
        } else if (type === 'talento') {
          const missing = pct < 80 ? ` Vi que tu perfil está al ${pct}% — completarlo te da más exposición a la IA de matching.` : ''
          greeting = `Hola${fn ? ` ${fn}` : ''}! Soy tu asistente en Equia ⚡\n\n${missing || 'Puedo ayudarte a encontrar proyectos que encajen con tu perfil,'} optimizar tu CV, o entender cómo funciona el algoritmo de matching. ¿En qué empezamos?`
        } else if (type === 'inversor') {
          greeting = `Hola${fn ? ` ${fn}` : ''}! Soy tu asistente en Equia 💼\n\nPuedo mostrarte los mejores proyectos con equipos formados, explicarte cómo evalúa la IA a los fundadores, o ayudarte a conectar con founders prometedores. ¿Qué necesitás?`
        } else {
          greeting = `Hola${fn ? ` ${fn}` : ''}! Soy el asistente IA de Equia.\n\n¿En qué puedo ayudarte?`
        }

        setMessages([{ role: 'ai', text: greeting }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: greeting }).catch(() => {})
      }
    } catch {
      const fn = profile?.name?.split(' ')[0] || ''
      setUserMemory({ summary: '', goals: [], style: {}, key_facts: [] })
      setUserContext({ name: profile?.name, type: profile?.type, role: profile?.role, skills: [], ideas: [], credits: profile?.credits ?? 0, profilePct: computeProfilePct(profile), memory: null })
      setMessages([{ role: 'ai', text: `Hola${fn ? ` ${fn}` : ''}! ¿En qué puedo ayudarte hoy?` }])
    } finally {
      setContextLoaded(true)
    }
  }

  const triggerMemorySave = useCallback(async () => {
    if (!user || !userContext || savingMemory) return
    const currentMessages = messagesRef.current
    if (currentMessages.length < 4) return
    newMsgCountRef.current = 0
    setSavingMemory(true)
    try {
      const { data } = await supabase.functions.invoke('claude-proxy', {
        body: { action: 'updateMemory', messages: currentMessages.slice(-20), currentMemory: userMemory || {}, userContext: { name: userContext.name, type: userContext.type, role: userContext.role } },
      })
      const raw = data?.content?.[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
      if (parsed?.summary) {
        const newMemory = { ...parsed, conversation_count: (userMemory?.conversation_count || 0) + 1 }
        await supabase.from('user_memory').upsert({ user_id: user.id, ...newMemory, last_updated: new Date().toISOString() }, { onConflict: 'user_id' })
        setUserMemory(newMemory)
        setUserContext(ctx => ctx ? { ...ctx, memory: newMemory } : ctx)
      }
    } catch { /* fire-and-forget */ }
    finally { setSavingMemory(false) }
  }, [user, userContext, userMemory, savingMemory])

  const sendMessage = useCallback(async (text = input.trim()) => {
    if (!text || loading || !userContext) return
    setInput('')
    setPendingAction(null)

    const historySnapshot = messages
    setMessages(h => [...h, { role: 'user', text }])
    setLoading(true)
    setSlowMode(false)
    scrollToBottom()

    slowTimerRef.current = setTimeout(() => setSlowMode(true), 6000)
    supabase.from('assistant_messages').insert({ user_id: user.id, role: 'user', text }).catch(() => {})

    try {
      const { data, error } = await Promise.race([
        supabase.functions.invoke('claude-proxy', {
          body: { action: 'assistantChat', message: text, history: historySnapshot.slice(-14), userContext },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 40000)),
      ])

      const rawText = data?.content?.[0]?.text || null
      if (!rawText) {
        let errDetail = data?.error ? ` (${data.error})` : error?.message && error.message !== 'FunctionsHttpError' ? ` (${error.message})` : ''
        setMessages(h => [...h, { role: 'ai', text: `No pude responder esta vez${errDetail}. Intentá de nuevo.` }])
        return
      }

      const match = rawText.match(ACTION_REGEX)
      let displayText = rawText
      let parsedAction = null

      if (match) {
        try { parsedAction = JSON.parse(match[1]); displayText = rawText.replace(ACTION_REGEX, '').trim() } catch { /* ignore */ }
      }

      setMessages(h => [...h, { role: 'ai', text: displayText }])
      supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: displayText }).catch(() => {})

      if (parsedAction?.type === 'navigate') {
        setTimeout(() => navigate(parsedAction.data.to), 400)
      } else if (parsedAction?.type === 'update_profile') {
        ;(async () => {
          try {
            await updateProfile(parsedAction.data)
            const labels = { linkedin_url: 'LinkedIn', portfolio_url: 'Portfolio', bio: 'Bio', location: 'Ubicación', name: 'Nombre', available: 'Disponibilidad' }
            const updated = Object.keys(parsedAction.data).map(k => labels[k] || k).join(', ')
            const confirmMsg = `✓ ${updated} actualizado en tu perfil.`
            setMessages(h => [...h, { role: 'ai', text: confirmMsg }])
            supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: confirmMsg }).catch(() => {})
            setUserContext(ctx => ctx ? { ...ctx, ...parsedAction.data } : ctx)
          } catch {
            setMessages(h => [...h, { role: 'ai', text: 'No pude actualizar el perfil. Podés hacerlo desde /perfil.' }])
          }
          scrollToBottom()
        })()
      } else if (parsedAction) {
        setPendingAction(parsedAction)
      }

      newMsgCountRef.current += 2
      if (newMsgCountRef.current >= MEMORY_TRIGGER_COUNT) triggerMemorySave()
    } catch {
      setMessages(h => [...h, { role: 'ai', text: 'No pude responder esta vez. Intentá de nuevo.' }])
    } finally {
      clearTimeout(slowTimerRef.current)
      setSlowMode(false)
      setLoading(false)
      scrollToBottom()
    }
  }, [input, loading, userContext, messages, user, triggerMemorySave, navigate, updateProfile])

  const executeAction = async () => {
    if (!pendingAction || executing) return
    setExecuting(true)
    const action = pendingAction
    setPendingAction(null)
    try {
      if (action.type === 'create_idea') {
        const d = action.data
        const { data: idea, error } = await supabase.from('ideas').insert({
          founder_id: user.id, title: d.title, description: d.description, category: d.category, status: 'open', is_public: true, stage: 'idea',
        }).select().single()
        if (error) throw error
        if (idea && d.roles?.length) supabase.from('idea_roles').insert(d.roles.map(r => ({ idea_id: idea.id, role_name: r }))).catch(() => {})
        const msg = `Tu idea "${d.title}" fue creada. Podés ir al dashboard para buscar el equipo.`
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg }).catch(() => {})
      } else if (action.type === 'update_profile') {
        await updateProfile(action.data)
        const msg = 'Perfil actualizado. Los cambios ya están guardados.'
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg }).catch(() => {})
        setUserContext(ctx => ({ ...ctx, ...action.data }))
      } else if (action.type === 'navigate') {
        navigate(action.data.to)
        return
      }
    } catch (err) {
      setMessages(h => [...h, { role: 'ai', text: `Error: ${err?.message || 'Intentá de nuevo.'}` }])
    }
    setExecuting(false)
    scrollToBottom()
  }

  if (!user || !profile) return null

  const suggestFn = SUGGESTIONS[profile?.type] || SUGGESTIONS.default
  const suggestions = suggestFn(profile, hasIdea)
  const hasMemory = userMemory?.summary?.length > 10
  const lastMsgIsAI = messages.length > 0 && messages[messages.length - 1]?.role === 'ai'
  const showSuggestions = contextLoaded && !loading && !input.trim() && lastMsgIsAI && !pendingAction

  return (
    <>
      <style>{`
        @keyframes dc-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes dc-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dc-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .dc-chip:hover { background:rgba(232,97,26,.1) !important; border-color:#E8611A !important; color:#E8611A !important; }
        .dc-send:hover:not(:disabled) { background:#c94e0f !important; }
        .dc-input:focus { outline:none; border-color:rgba(232,97,26,.5) !important; box-shadow:0 0 0 3px rgba(232,97,26,.08) !important; }
        .dc-collapse:hover { background:#f5f5f5 !important; }
      `}</style>

      <div style={{ marginBottom: 36, border: '1px solid #e8e8e8', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,.05)', animation: 'dc-fadein .4s ease' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#E8611A 0%,#f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
                <line x1="13" y1="13" x2="3" y2="4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <line x1="13" y1="13" x2="23" y2="4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <line x1="13" y1="13" x2="3" y2="22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <line x1="13" y1="13" x2="23" y2="22" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <line x1="13" y1="13" x2="13" y2="1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <line x1="13" y1="13" x2="1" y2="13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75"/>
                <circle cx="13" cy="13" r="4.5" fill="#fff" opacity="0.95"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-.2px' }}>Asistente IA</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.78)', display: 'flex', alignItems: 'center', gap: 5 }}>
                {savingMemory
                  ? <><span style={{ animation: 'dc-pulse 1.2s infinite' }}>●</span> Memorizando...</>
                  : hasMemory
                    ? <><span style={{ color: '#bbf7d0' }}>●</span> Te recuerda</>
                    : 'Te guía para sacar el máximo de Equia'
                }
              </div>
            </div>
          </div>
          <button
            className="dc-collapse"
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '6px 10px', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 5, transition: 'background .15s' }}
          >
            {collapsed ? 'Abrir chat' : 'Minimizar'}
            <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }}>▾</span>
          </button>
        </div>

        {!collapsed && (
          <>
            {/* Messages area */}
            <div style={{ height: messages.length <= 1 ? 180 : 320, overflowY: 'auto', padding: '16px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', transition: 'height .3s ease' }}>
              {!contextLoaded ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#bbb' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid #eee', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'assist-spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13 }}>Cargando tu contexto...</span>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                  {loading && <TypingDots />}
                  {loading && slowMode && (
                    <div style={{ fontSize: 11, color: '#bbb', paddingLeft: 36, marginTop: -4, animation: 'dc-pulse 1.5s ease-in-out infinite' }}>
                      Procesando, puede tardar unos segundos...
                    </div>
                  )}
                  {pendingAction && (
                    <div style={{ background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>¿Confirmás la acción?</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={executeAction} disabled={executing} style={{ flex: 1, padding: '9px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: executing ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: executing ? 0.7 : 1 }}>
                          {executing ? 'Ejecutando...' : '✓ Confirmar'}
                        </button>
                        <button onClick={() => { setPendingAction(null); setMessages(h => [...h, { role: 'user', text: 'Cancelar' }]) }} disabled={executing} style={{ padding: '9px 16px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </>
              )}
            </div>

            {/* Suggestions chips */}
            {showSuggestions && (
              <div style={{ padding: '10px 18px 0', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {suggestions.map(s => (
                  <button key={s} className="dc-chip" onClick={() => sendMessage(s)}
                    style={{ padding: '6px 13px', borderRadius: 99, border: '1px solid #e8e8e8', background: '#fafafa', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: '#555', transition: 'all .15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 18px 14px', borderTop: showSuggestions ? 'none' : '1px solid #f0f0f0', background: '#fff' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  className="dc-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={contextLoaded ? '¿En qué te puedo ayudar hoy?' : 'Cargando...'}
                  disabled={!contextLoaded || loading}
                  rows={1}
                  style={{ flex: 1, background: '#f8f8f8', border: '1px solid #e8e8e8', borderRadius: 12, color: '#111', fontSize: 14, fontFamily: 'Inter,sans-serif', padding: '11px 14px', resize: 'none', lineHeight: 1.45, transition: 'border-color .15s, box-shadow .15s', opacity: !contextLoaded ? 0.5 : 1 }}
                />
                <button
                  className="dc-send"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || !contextLoaded}
                  style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: input.trim() && !loading && contextLoaded ? '#E8611A' : '#f0f0f0',
                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: input.trim() && !loading && contextLoaded ? '#fff' : '#ccc',
                    fontSize: 18, transition: 'background .15s',
                    fontFamily: 'Inter,sans-serif',
                  }}
                  title="Enviar (Enter)"
                >
                  ↑
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
