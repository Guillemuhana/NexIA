import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ACTION_REGEX = /\[EJECUTAR:([\s\S]*?)\]/
const MEMORY_TRIGGER_COUNT = 6 // save memory every N new messages

const QUICK_ACTIONS = {
  talento: [
    { label: 'Completar mi perfil', to: '/perfil-chat' },
    { label: 'Ver proyectos', to: '/explorar' },
    { label: 'Mi CV', to: '/cv' },
    { label: 'Dashboard', to: '/dashboard' },
  ],
  visionario: [
    { label: 'Lanzar una idea', to: '/lanzar' },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Explorar talento', to: '/explorar' },
    { label: 'Mi perfil', to: '/perfil' },
  ],
  inversor: [
    { label: 'Ver proyectos', to: '/proyectos' },
    { label: 'Explorar', to: '/explorar' },
    { label: 'Mi perfil', to: '/perfil' },
  ],
  default: [
    { label: 'Explorar', to: '/explorar' },
    { label: 'Mi perfil', to: '/perfil' },
    { label: 'Dashboard', to: '/dashboard' },
  ],
}

function BotIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M16 3h-4a2 2 0 0 0-2 2v2h8V5a2 2 0 0 0-2-2z" />
      <circle cx="9" cy="13" r="1" fill="#fff" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="#fff" stroke="none" />
      <path d="M9 17s1 1 3 1 3-1 3-1" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '14px 14px 14px 3px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `assist-bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

export default function AssistantWidget() {
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userContext, setUserContext] = useState(null)
  const [userMemory, setUserMemory] = useState(null)
  const [contextLoaded, setContextLoaded] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const newMsgCountRef = useRef(0)
  const messagesRef = useRef([])

  // Keep ref in sync so saveMemory closure always has latest messages
  useEffect(() => { messagesRef.current = messages }, [messages])

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  useEffect(() => {
    if (!open || !user || contextLoaded) return
    loadContext()
  }, [open, user, contextLoaded])

  useEffect(() => {
    if (!open) {
      setLoading(false)
      // Save memory when closing if there are new messages
      if (newMsgCountRef.current >= 2 && user && userContext) {
        triggerMemorySave()
      }
    }
  }, [open])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])

  const loadContext = async () => {
    try {
      const ctxTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('ctx-timeout')), 8000))
      const [
        { data: skillsData },
        { data: ideasData },
        { data: histData },
        { data: memoryData },
      ] = await Promise.race([
        Promise.all([
          supabase.from('user_skills').select('skills(name)').eq('user_id', user.id),
          supabase.from('ideas').select('title, status').eq('founder_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('assistant_messages').select('role, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('user_memory').select('summary, goals, style, key_facts, conversation_count').eq('user_id', user.id).maybeSingle(),
        ]),
        ctxTimeout,
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
        memory,
      })

      if (histData && histData.length > 0) {
        setMessages(histData.reverse().map(m => ({ role: m.role, text: m.text })))
      } else {
        const fn = profile?.name?.split(' ')[0] || ''
        const hasMemory = memory?.summary?.length > 10
        const greeting = hasMemory
          ? `Hola${fn ? ` ${fn}` : ''}! Estoy de vuelta.\n\n${memory.goals?.length ? `Sé que estás trabajando en: ${memory.goals.slice(0, 2).join(' y ')}. ` : ''}¿En qué te ayudo hoy?`
          : `Hola${fn ? ` ${fn}` : ''}! Soy tu asistente en Equia.\n\nPuedo ayudarte a lanzar ideas, configurar tu perfil, explorar proyectos o responder cualquier consulta sobre el ecosistema.\n\n¿En qué empezamos?`
        setMessages([{ role: 'ai', text: greeting }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: greeting })
          .then(() => {}).catch(() => {})
      }
    } catch {
      const fn = profile?.name?.split(' ')[0] || ''
      setUserMemory({ summary: '', goals: [], style: {}, key_facts: [] })
      setUserContext({ name: profile?.name, type: profile?.type, role: profile?.role, skills: [], ideas: [], memory: null })
      setMessages([{ role: 'ai', text: `Hola${fn ? ` ${fn}` : ''}! ¿En qué puedo ayudarte?` }])
    } finally {
      setContextLoaded(true)
    }
  }

  useEffect(() => { if (messages.length > 0) scrollToBottom() }, [messages])

  const triggerMemorySave = useCallback(async () => {
    if (!user || !userContext || savingMemory) return
    const currentMessages = messagesRef.current
    if (currentMessages.length < 4) return
    newMsgCountRef.current = 0
    setSavingMemory(true)
    try {
      const { data } = await supabase.functions.invoke('claude-proxy', {
        body: {
          action: 'updateMemory',
          messages: currentMessages.slice(-20),
          currentMemory: userMemory || {},
          userContext: { name: userContext.name, type: userContext.type, role: userContext.role },
        },
      })
      const raw = data?.content?.[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
      if (parsed?.summary) {
        const newMemory = { ...parsed, conversation_count: (userMemory?.conversation_count || 0) + 1 }
        await supabase.from('user_memory').upsert({
          user_id: user.id,
          ...newMemory,
          last_updated: new Date().toISOString(),
        }, { onConflict: 'user_id' })
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
    scrollToBottom()

    supabase.from('assistant_messages').insert({ user_id: user.id, role: 'user', text })
      .then(() => {}).catch(() => {})

    try {
      const invokePromise = supabase.functions.invoke('claude-proxy', {
        body: { action: 'assistantChat', message: text, history: historySnapshot.slice(-14), userContext },
      })
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 14000)
      )

      const { data, error } = await Promise.race([invokePromise, timeoutPromise])

      const rawText = data?.content?.[0]?.text || (error ? null : 'Sin respuesta.')

      if (!rawText) {
        setMessages(h => [...h, { role: 'ai', text: 'El servicio de IA no está disponible. Podés usar los accesos directos de abajo para navegar.' }])
        return
      }

      const match = rawText.match(ACTION_REGEX)
      let displayText = rawText
      let parsedAction = null

      if (match) {
        try {
          parsedAction = JSON.parse(match[1])
          displayText = rawText.replace(ACTION_REGEX, '').trim()
        } catch { /* ignore */ }
      }

      setMessages(h => [...h, { role: 'ai', text: displayText }])
      supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: displayText })
        .then(() => {}).catch(() => {})

      if (parsedAction?.type === 'navigate') {
        // Navegar sin confirmación — fluido e instantáneo
        setTimeout(() => { setOpen(false); navigate(parsedAction.data.to) }, 350)
      } else if (parsedAction?.type === 'update_profile') {
        // Actualizar perfil sin confirmación — el usuario lo pidió explícitamente
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

      // Track new messages; trigger memory save every N exchanges
      newMsgCountRef.current += 2
      if (newMsgCountRef.current >= MEMORY_TRIGGER_COUNT) {
        triggerMemorySave()
      }
    } catch {
      setMessages(h => [...h, { role: 'ai', text: 'No pude conectarme. Usá los accesos directos de abajo o intentá de nuevo.' }])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }, [input, loading, userContext, messages, user, triggerMemorySave])

  const executeAction = async () => {
    if (!pendingAction || executing) return
    setExecuting(true)
    const action = pendingAction
    setPendingAction(null)

    try {
      if (action.type === 'create_idea') {
        const d = action.data
        const { data: idea, error } = await supabase.from('ideas').insert({
          founder_id: user.id,
          title: d.title,
          description: d.description,
          category: d.category,
          status: 'open',
          is_public: true,
          stage: 'idea',
        }).select().single()

        if (error) throw error

        if (idea && d.roles?.length) {
          supabase.from('idea_roles').insert(d.roles.map(r => ({ idea_id: idea.id, role_name: r })))
            .then(() => {}).catch(() => {})
        }

        const msg = `Tu idea "${d.title}" fue creada. Podés ir al dashboard para buscar el equipo.`
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg })
          .then(() => {}).catch(() => {})
        setUserContext(ctx => ({ ...ctx, ideas: [{ title: d.title, status: 'open' }, ...(ctx?.ideas || [])] }))

      } else if (action.type === 'update_profile') {
        await updateProfile(action.data)
        const msg = 'Perfil actualizado. Los cambios ya están guardados.'
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg })
          .then(() => {}).catch(() => {})
        setUserContext(ctx => ({ ...ctx, ...action.data }))

      } else if (action.type === 'navigate') {
        setOpen(false)
        navigate(action.data.to)
        return
      }
    } catch (err) {
      setMessages(h => [...h, { role: 'ai', text: `Error: ${err?.message || 'Intentá de nuevo.'}` }])
    }
    setExecuting(false)
    scrollToBottom()
  }

  const cancelAction = () => {
    setPendingAction(null)
    setMessages(h => [...h, { role: 'user', text: 'Cancelar' }])
    supabase.from('assistant_messages').insert({ user_id: user.id, role: 'user', text: 'Cancelar' })
      .then(() => {}).catch(() => {})
  }

  const handleQuickAction = (to) => {
    setOpen(false)
    navigate(to)
  }

  if (!user || !profile) return null
  const quickActions = QUICK_ACTIONS[profile?.type] || QUICK_ACTIONS.default
  const hasMemory = userMemory?.summary?.length > 10

  return (
    <>
      <style>{`
        @keyframes assist-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes assist-spin { to{transform:rotate(360deg)} }
        @keyframes assist-pulse-txt { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes neuron-ring { 0%{box-shadow:0 0 0 0 rgba(232,97,26,.5),0 4px 18px rgba(232,97,26,.35)} 70%{box-shadow:0 0 0 10px rgba(232,97,26,.0),0 4px 18px rgba(232,97,26,.35)} 100%{box-shadow:0 0 0 0 rgba(232,97,26,.0),0 4px 18px rgba(232,97,26,.35)} }
        @keyframes panel-in { from{transform:translateX(100%)} to{transform:translateX(0)} }
        .assist-input:focus { outline:none;border-color:rgba(232,97,26,.5) !important; }
        .assist-chip:hover { background:rgba(232,97,26,.08) !important; border-color:#E8611A !important; color:#E8611A !important; }
        .assist-send:hover:not(:disabled) { background:#c94e0f !important; }
      `}</style>

      {/* ── Panel lateral deslizante ── */}
      {open && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(390px, 100vw)',
          background: '#fff',
          boxShadow: '-6px 0 40px rgba(0,0,0,.14)',
          borderLeft: '1px solid #ececec',
          display: 'flex', flexDirection: 'column',
          zIndex: 9998,
          animation: 'panel-in .28s cubic-bezier(.4,0,.2,1)',
        }}>

          {/* Header */}
          <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#E8611A 0%,#f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {/* Neurona mini en el header */}
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.95"/>
                  <line x1="12" y1="12" x2="2" y2="3" stroke="#fff" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="22" y2="3" stroke="#fff" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="2" y2="21" stroke="#fff" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="22" y2="21" stroke="#fff" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="12" y2="1" stroke="#fff" strokeWidth="1.4" opacity="0.6" strokeLinecap="round"/>
                  <circle cx="2" cy="3" r="1.5" fill="#fff" opacity="0.5"/>
                  <circle cx="22" cy="3" r="1.5" fill="#fff" opacity="0.5"/>
                  <circle cx="2" cy="21" r="1.5" fill="#fff" opacity="0.5"/>
                  <circle cx="22" cy="21" r="1.5" fill="#fff" opacity="0.5"/>
                  <circle cx="12" cy="1" r="1.5" fill="#fff" opacity="0.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>Asistente Equia</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.78)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {savingMemory
                    ? <><span style={{ animation: 'assist-pulse-txt 1.2s ease-in-out infinite' }}>●</span> Memorizando...</>
                    : hasMemory
                      ? <><span style={{ color: '#bbf7d0' }}>●</span> Te recuerda</>
                      : 'IA · con memoria persistente'
                  }
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.8)', fontSize: 26, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!contextLoaded && (
              <div style={{ textAlign: 'center', padding: '50px 0', color: '#aaa', fontSize: 13 }}>
                <div style={{ width: 22, height: 22, border: '2px solid #eee', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'assist-spin 1s linear infinite', margin: '0 auto 12px' }} />
                Cargando tu contexto...
              </div>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '86%', padding: '10px 14px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? '#E8611A' : '#fff',
                    border: isUser ? 'none' : '1px solid #eaeaea',
                    fontSize: 13.5, color: isUser ? '#fff' : '#222',
                    lineHeight: 1.65, whiteSpace: 'pre-wrap',
                    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  }}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            {loading && <TypingDots />}
            {pendingAction && (
              <div style={{ background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.5px' }}>¿Confirmás la acción?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={executeAction} disabled={executing} style={{ flex: 1, padding: '9px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: executing ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: executing ? 0.7 : 1 }}>
                    {executing ? 'Ejecutando...' : '✓ Confirmar'}
                  </button>
                  <button onClick={cancelAction} disabled={executing} style={{ padding: '9px 16px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Accesos directos */}
          {contextLoaded && (
            <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#bbb', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Accesos directos</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickActions.map(a => (
                  <button key={a.to} className="assist-chip" onClick={() => handleQuickAction(a.to)}
                    style={{ padding: '6px 12px', borderRadius: 99, border: '1px solid #e8e8e8', background: '#fafafa', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: '#555', transition: 'all .15s' }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                className="assist-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={contextLoaded ? 'Escribí o "mi linkedin es https://..."' : 'Cargando...'}
                disabled={!contextLoaded || loading}
                rows={1}
                style={{ flex: 1, background: '#f8f8f8', border: '1px solid #e8e8e8', borderRadius: 10, color: '#111', fontSize: 13.5, fontFamily: 'Inter,sans-serif', padding: '10px 13px', resize: 'none', lineHeight: 1.45, transition: 'border-color .15s', opacity: !contextLoaded ? 0.5 : 1 }}
              />
              <button
                className="assist-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || !contextLoaded}
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !loading && contextLoaded ? '#E8611A' : '#f0f0f0',
                  border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: input.trim() && !loading && contextLoaded ? '#fff' : '#ccc',
                  fontSize: 17, transition: 'background .15s',
                }}
              >→</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Botón neurona flotante ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Asistente IA"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 54, height: 54, borderRadius: '50%',
          background: open ? '#c94e0f' : 'linear-gradient(135deg,#E8611A 0%,#f97316 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: open ? 'none' : 'neuron-ring 2.4s ease-in-out infinite',
          zIndex: 9999,
          transition: 'background .2s, transform .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {/* SVG neurona */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <line x1="13" y1="13" x2="3" y2="4"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="13" y1="13" x2="23" y2="4"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="13" y1="13" x2="3" y2="22"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="13" y1="13" x2="23" y2="22"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="13" y1="13" x2="13" y2="1"  stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1="13" y1="13" x2="1"  y2="13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <circle cx="3"  cy="4"  r="2" fill="#fff" opacity="0.55"/>
          <circle cx="23" cy="4"  r="2" fill="#fff" opacity="0.55"/>
          <circle cx="3"  cy="22" r="2" fill="#fff" opacity="0.55"/>
          <circle cx="23" cy="22" r="2" fill="#fff" opacity="0.55"/>
          <circle cx="13" cy="1"  r="2" fill="#fff" opacity="0.55"/>
          <circle cx="1"  cy="13" r="2" fill="#fff" opacity="0.55"/>
          <circle cx="13" cy="13" r="5" fill="#fff" opacity="0.95"/>
        </svg>
        {hasMemory && !open && (
          <div style={{ position: 'absolute', top: 3, right: 3, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
        )}
      </button>
    </>
  )
}
