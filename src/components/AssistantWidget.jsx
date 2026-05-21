import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ACTION_REGEX = /\[EJECUTAR:([\s\S]*?)\]/

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
  const [contextLoaded, setContextLoaded] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [executing, setExecuting] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  useEffect(() => {
    if (!open || !user || contextLoaded) return
    loadContext()
  }, [open, user, contextLoaded])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300) }, [open])

  const loadContext = async () => {
    try {
      const [{ data: skillsData }, { data: ideasData }, { data: histData }] = await Promise.all([
        supabase.from('user_skills').select('skills(name)').eq('user_id', user.id),
        supabase.from('ideas').select('title, status').eq('founder_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('assistant_messages').select('role, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      const skills = (skillsData || []).map(s => s.skills?.name).filter(Boolean)
      setUserContext({
        name: profile?.name,
        type: profile?.type,
        role: profile?.role,
        bio: profile?.bio,
        skills,
        location: profile?.location,
        available: profile?.available,
        ideas: ideasData || [],
      })

      if (histData && histData.length > 0) {
        setMessages(histData.reverse().map(m => ({ role: m.role, text: m.text })))
      } else {
        const fn = profile?.name?.split(' ')[0] || ''
        const greeting = `Hola${fn ? ` ${fn}` : ''}! Soy tu asistente en Equia.\n\nPuedo ayudarte a lanzar ideas, configurar tu perfil, explorar proyectos o responder cualquier consulta sobre el ecosistema.\n\n¿En qué empezamos?`
        setMessages([{ role: 'ai', text: greeting }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: greeting })
      }
    } catch {
      const fn = profile?.name?.split(' ')[0] || ''
      setMessages([{ role: 'ai', text: `Hola${fn ? ` ${fn}` : ''}! ¿En qué puedo ayudarte?` }])
    } finally {
      setContextLoaded(true)
    }
  }

  useEffect(() => { if (messages.length > 0) scrollToBottom() }, [messages])

  const sendMessage = useCallback(async (text = input.trim()) => {
    if (!text || loading || !userContext) return
    setInput('')
    setPendingAction(null)

    const historySnapshot = messages
    setMessages(h => [...h, { role: 'user', text }])
    setLoading(true)
    scrollToBottom()

    supabase.from('assistant_messages').insert({ user_id: user.id, role: 'user', text })

    try {
      const { data, error } = await supabase.functions.invoke('claude-proxy', {
        body: { action: 'assistantChat', message: text, history: historySnapshot.slice(-14), userContext },
      })

      const rawText = data?.content?.[0]?.text || (error ? null : 'Sin respuesta.')

      if (!rawText) {
        setMessages(h => [...h, { role: 'ai', text: 'El servicio de IA no está disponible en este momento. Podés usar los accesos directos de abajo para navegar.' }])
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
      if (parsedAction) setPendingAction(parsedAction)
    } catch {
      setMessages(h => [...h, { role: 'ai', text: 'No pude conectarme. Usá los accesos directos de abajo o intentá de nuevo.' }])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }, [input, loading, userContext, messages, user])

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
          await supabase.from('idea_roles').insert(
            d.roles.map(r => ({ idea_id: idea.id, role_name: r }))
          )
        }

        const msg = `Tu idea "${d.title}" fue creada. Podés ir al dashboard para buscar el equipo.`
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg })
        setUserContext(ctx => ({ ...ctx, ideas: [{ title: d.title, status: 'open' }, ...(ctx?.ideas || [])] }))

      } else if (action.type === 'update_profile') {
        await updateProfile(action.data)
        const msg = 'Perfil actualizado. Los cambios ya están guardados.'
        setMessages(h => [...h, { role: 'ai', text: msg }])
        supabase.from('assistant_messages').insert({ user_id: user.id, role: 'ai', text: msg })
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
  }

  const handleQuickAction = (to) => {
    setOpen(false)
    navigate(to)
  }

  if (!user || !profile) return null
  const quickActions = QUICK_ACTIONS[profile?.type] || QUICK_ACTIONS.default

  return (
    <>
      <style>{`
        @keyframes assist-up { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes assist-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes assist-spin { to{transform:rotate(360deg)} }
        .assist-input:focus { outline:none;border-color:rgba(99,102,241,.5) !important; }
        .assist-chip:hover { background:rgba(99,102,241,.1) !important; border-color:#6366f1 !important; color:#6366f1 !important; }
        .assist-panel {
          position: fixed !important;
          bottom: 80px !important;
          right: 12px !important;
          width: calc(100vw - 24px) !important;
          max-width: 420px !important;
          height: min(600px, 85vh) !important;
        }
        @media (min-width: 500px) {
          .assist-panel {
            right: 84px !important;
            width: 420px !important;
          }
        }
      `}</style>

      <div style={{ position: 'fixed', bottom: 20, right: 'clamp(72px, 84px, 84px)', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

        {open && (
          <div className="assist-panel" style={{
            background: '#fff', borderRadius: 18,
            boxShadow: '0 12px 50px rgba(0,0,0,.18)',
            border: '1px solid #e0e0e0',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            marginBottom: 12,
            animation: 'assist-up .22s ease',
            zIndex: 9998,
          }}>

            {/* Header */}
            <div style={{ padding: '13px 16px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BotIcon />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Asistente Equia</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 1 }}>IA · con memoria de contexto</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.75)', fontSize: 24, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!contextLoaded && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: 13 }}>
                  <div style={{ width: 22, height: 22, border: '2px solid #e0e0e0', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'assist-spin 1s linear infinite', margin: '0 auto 12px' }} />
                  Cargando tu contexto...
                </div>
              )}
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '84%', padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser ? '#6366f1' : '#fff',
                      border: isUser ? 'none' : '1px solid #e8e8e8',
                      fontSize: 13.5, color: isUser ? '#fff' : '#222',
                      lineHeight: 1.65, whiteSpace: 'pre-wrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )
              })}
              {loading && <TypingDots />}
              {pendingAction && (
                <div style={{ background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '11px 13px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 9, textTransform: 'uppercase', letterSpacing: '.5px' }}>¿Confirmás la acción?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={executeAction} disabled={executing} style={{ flex: 1, padding: '9px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: executing ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: executing ? 0.7 : 1 }}>
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

            {/* Quick actions */}
            {contextLoaded && (
              <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Accesos directos</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {quickActions.map(a => (
                    <button
                      key={a.to}
                      className="assist-chip"
                      onClick={() => handleQuickAction(a.to)}
                      style={{ padding: '6px 12px', borderRadius: 99, border: '1px solid #e0e0e0', background: '#fafafa', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', color: '#444', transition: 'all .15s' }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 13px 13px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  className="assist-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={contextLoaded ? 'Escribí tu mensaje...' : 'Cargando...'}
                  disabled={!contextLoaded || loading}
                  rows={1}
                  style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 10, color: '#111', fontSize: 13.5, fontFamily: 'Inter,sans-serif', padding: '10px 13px', resize: 'none', lineHeight: 1.45, transition: 'border-color .15s', opacity: !contextLoaded ? 0.5 : 1 }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || !contextLoaded}
                  style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: input.trim() && !loading && contextLoaded ? '#6366f1' : '#f0f0f0',
                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: input.trim() && !loading && contextLoaded ? '#fff' : '#ccc',
                    fontSize: 16, transition: 'all .15s',
                  }}
                >→</button>
              </div>
            </div>
          </div>
        )}

        {/* Floating button */}
        <button
          onClick={() => setOpen(o => !o)}
          title="Asistente IA"
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: open ? '#5558e8' : 'linear-gradient(135deg,#6366f1,#818cf8)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,.4)',
            transition: 'transform .2s, box-shadow .2s, background .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,.6)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,.4)' }}
        >
          <BotIcon />
        </button>
      </div>
    </>
  )
}
