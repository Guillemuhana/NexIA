import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function Avatar({ user, size = 36 }) {
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

export default function ChatWidget() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [activeUser, setActiveUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isTeammate, setIsTeammate] = useState(false)
  const [teamChecked, setTeamChecked] = useState(false)
  const [paywallMsg, setPaywallMsg] = useState(null)
  const [paywallPaying, setPaywallPaying] = useState(false)
  const endRef = useRef(null)
  const channelRef = useRef(null)

  const loadConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at, is_read')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!data) return

    // Collect unique partner IDs
    const partnerIds = [...new Set(
      data.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id)
    )]
    if (partnerIds.length === 0) { setConversations([]); return }

    const { data: partners } = await supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', partnerIds)

    const partnerMap = {}
    ;(partners || []).forEach(p => { partnerMap[p.id] = p })

    const convMap = {}
    data.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!convMap[otherId]) {
        convMap[otherId] = { user: partnerMap[otherId], lastMsg: msg, unread: 0 }
      }
      if (!msg.is_read && msg.receiver_id === user.id) convMap[otherId].unread++
    })
    setConversations(Object.values(convMap))
  }, [user])

  useEffect(() => {
    if (user) loadConversations()
  }, [user, loadConversations])

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`dm-inbox-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
        filter: `receiver_id=eq.${user.id}`,
      }, payload => {
        loadConversations()
        if (activeUser && payload.new.sender_id === activeUser.id) {
          setMessages(m => [...m, payload.new])
        }
      })
      .subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [user, activeUser, loadConversations])

  const loadMessages = useCallback(async (otherId) => {
    if (!user) return
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    const convoMsgs = (data || []).filter(m =>
      (m.sender_id === user.id && m.receiver_id === otherId) ||
      (m.sender_id === otherId && m.receiver_id === user.id)
    )
    setMessages(convoMsgs)

    // Mark received as read
    await supabase.from('direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherId)
      .eq('is_read', false)

    loadConversations()
  }, [user, loadConversations])

  const checkTeammate = useCallback(async (otherId) => {
    if (!user) return
    setTeamChecked(false)
    let teammate = false

    // Founder ↔ accepted talent
    const { data: asFounder } = await supabase
      .from('ideas')
      .select('id')
      .eq('founder_id', user.id)
      .limit(20)

    if (asFounder?.length) {
      const ideaIds = asFounder.map(i => i.id)
      const { data: m } = await supabase
        .from('matches')
        .select('id')
        .eq('talent_id', otherId)
        .eq('status', 'accepted')
        .in('idea_id', ideaIds)
        .limit(1)
      if (m?.length) teammate = true
    }

    if (!teammate) {
      const { data: asFounder2 } = await supabase
        .from('ideas')
        .select('id')
        .eq('founder_id', otherId)
        .limit(20)
      if (asFounder2?.length) {
        const ideaIds = asFounder2.map(i => i.id)
        const { data: m } = await supabase
          .from('matches')
          .select('id')
          .eq('talent_id', user.id)
          .eq('status', 'accepted')
          .in('idea_id', ideaIds)
          .limit(1)
        if (m?.length) teammate = true
      }
    }

    if (!teammate) {
      const { data: myMatches } = await supabase
        .from('matches')
        .select('idea_id')
        .eq('talent_id', user.id)
        .eq('status', 'accepted')
      if (myMatches?.length) {
        const ideaIds = myMatches.map(m => m.idea_id)
        const { data: shared } = await supabase
          .from('matches')
          .select('id')
          .eq('talent_id', otherId)
          .eq('status', 'accepted')
          .in('idea_id', ideaIds)
          .limit(1)
        if (shared?.length) teammate = true
      }
    }

    setIsTeammate(teammate)
    setTeamChecked(true)
  }, [user])

  const openChat = useCallback(async (otherUser) => {
    setActiveUser(otherUser)
    setView('chat')
    setOpen(true)
    setMessages([])
    setIsTeammate(false)
    setTeamChecked(false)
    await Promise.all([
      loadMessages(otherUser.id),
      checkTeammate(otherUser.id),
    ])
  }, [loadMessages, checkTeammate])

  // External trigger: dispatch 'nexia-open-chat' event from anywhere
  useEffect(() => {
    const handler = async (e) => {
      const { userId, userName, userAvatar } = e.detail || {}
      if (userId) await openChat({ id: userId, name: userName, avatar_url: userAvatar })
    }
    window.addEventListener('nexia-open-chat', handler)
    return () => window.removeEventListener('nexia-open-chat', handler)
  }, [openChat])

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages])

  const send = async () => {
    const content = input.trim()
    if (!content || sending) return
    if (!isTeammate) { setPaywallMsg(content); return }
    setSending(true)
    setInput('')
    const { data } = await supabase.from('direct_messages').insert({
      sender_id: user.id, receiver_id: activeUser.id, content, is_read: false,
    }).select().single()
    if (data) setMessages(m => [...m, data])
    setSending(false)
  }

  const handlePayAndSend = async () => {
    setPaywallPaying(true)
    await new Promise(r => setTimeout(r, 1400))
    const { data } = await supabase.from('direct_messages').insert({
      sender_id: user.id, receiver_id: activeUser.id, content: paywallMsg, is_read: false,
    }).select().single()
    if (data) { setMessages(m => [...m, data]); loadConversations() }
    setPaywallMsg(null)
    setPaywallPaying(false)
  }

  if (!user || !profile) return null

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unread, 0)
  const isMobile = window.innerWidth < 500

  return (
    <>
      <style>{`
        @keyframes chat-up { from{opacity:0;transform:translateY(16px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .chat-input:focus { outline: none; border-color: rgba(232,97,26,.4) !important; }
      `}</style>

      {/* Paywall overlay */}
      {paywallMsg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,.18)', animation: 'chat-up .25s ease' }}>
            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 14 }}>🔒</div>
            <h2 style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.5px', textAlign: 'center', marginBottom: 8 }}>Chat Premium</h2>
            <p style={{ color: '#666', fontSize: 14, lineHeight: 1.65, textAlign: 'center', marginBottom: 20 }}>
              Solo los miembros del mismo equipo chatean gratis.<br />Actualizá para hablar con cualquier talento.
            </p>
            <div style={{ padding: '14px 16px', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 10, marginBottom: 22 }}>
              <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Tu mensaje pendiente</div>
              <div style={{ fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 1.5 }}>"{paywallMsg}"</div>
            </div>
            <button
              onClick={handlePayAndSend}
              disabled={paywallPaying}
              style={{ width: '100%', padding: '14px', background: '#E8611A', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter,sans-serif', marginBottom: 10, opacity: paywallPaying ? 0.7 : 1, transition: 'opacity .15s' }}
            >
              {paywallPaying ? 'Enviando...' : '⚡ Enviar mensaje · $9.99/mes'}
            </button>
            <button
              onClick={() => setPaywallMsg(null)}
              disabled={paywallPaying}
              style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid #e8e8e8', borderRadius: 10, color: '#666', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Floating widget */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>

        {/* Chat panel */}
        {open && (
          <div style={{
            width: isMobile ? 'calc(100vw - 32px)' : 340,
            height: 460,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,.16)',
            border: '1px solid #e8e8e8',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            marginBottom: 12,
            animation: 'chat-up .22s ease',
          }}>
            {/* Header */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              {view === 'chat' && activeUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <button onClick={() => { setView('list'); setActiveUser(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0, display: 'flex', flexShrink: 0 }}>
                    <BackIcon />
                  </button>
                  <Avatar user={activeUser} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.name}</div>
                    {teamChecked && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: isTeammate ? '#22c55e' : '#E8611A' }}>
                        {isTeammate ? '● Compañero de equipo' : '🔒 Chat premium'}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a' }}>Mensajes</span>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 22, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>

            {/* List view */}
            {view === 'list' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#444' }}>Sin mensajes aún</div>
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>Hacé click en "Mensajear" en el perfil de un talento para empezar.</div>
                  </div>
                ) : (
                  conversations.map(c => (
                    <div
                      key={c.user?.id}
                      onClick={() => openChat(c.user)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <Avatar user={c.user} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.user?.name}</div>
                        <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.lastMsg?.sender_id === user.id ? 'Vos: ' : ''}{c.lastMsg?.content}
                        </div>
                      </div>
                      {c.unread > 0 && (
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8611A', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {c.unread > 9 ? '9+' : c.unread}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat view */}
            {view === 'chat' && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#999', fontSize: 13 }}>
                      Empezá la conversación con {activeUser?.name?.split(' ')[0]}
                    </div>
                  )}
                  {messages.map(msg => {
                    const mine = msg.sender_id === user.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%', padding: '8px 12px',
                          borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                          background: mine ? '#E8611A' : '#fff',
                          border: mine ? 'none' : '1px solid #e8e8e8',
                          fontSize: 13, color: mine ? '#fff' : '#333', lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef} />
                </div>

                {/* Input area */}
                <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', background: '#fff', flexShrink: 0 }}>
                  {teamChecked && !isTeammate && (
                    <div style={{ fontSize: 11, color: '#E8611A', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                      🔒 <span>No son equipo — enviar mensaje requiere plan premium</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                      className="chat-input"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      placeholder="Escribí un mensaje..."
                      rows={1}
                      style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 8, color: '#0a0a0a', fontSize: 13, fontFamily: 'Inter,sans-serif', padding: '9px 11px', resize: 'none', lineHeight: 1.4, transition: 'border-color .15s' }}
                    />
                    <button
                      onClick={send}
                      disabled={!input.trim() || sending}
                      style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: input.trim() ? '#E8611A' : '#f0f0f0',
                        border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: input.trim() ? '#fff' : '#bbb', transition: 'all .15s',
                      }}
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: '#E8611A', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(232,97,26,.4)',
            transition: 'transform .2s, box-shadow .2s',
            position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 26px rgba(232,97,26,.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,97,26,.4)' }}
        >
          <ChatIcon />
          {unreadTotal > 0 && !open && (
            <span style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
