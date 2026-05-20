import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const fn = (name = '') => (name || '').split(' ')[0] || name

function parseLinks(text = '') {
  const li = text.match(/linkedin\.com\/in\/[\w%-]+/i)?.[0]
  const gh = text.match(/github\.com\/[\w-]+/i)?.[0]
  const url = text.match(/https?:\/\/[^\s,]+/)?.[0]
  return {
    linkedin_url: li ? (li.startsWith('http') ? li : `https://${li}`) : null,
    portfolio_url: url || (gh ? `https://${gh}` : null),
  }
}

const QUESTIONS = {
  talento: [
    { key: 'name',       ask: ()  => '¡Hola! Soy el asistente de Equia 🤖\n\nTe voy a guiar para armar tu perfil en menos de 2 minutos. Cuanto más detalle des, mejor te va a matchear la IA con proyectos.\n\n¿Cómo te llamás?' },
    { key: 'location',   ask: a  => `Buenísimo, ${fn(a.name)}! 🙌\n\n¿Desde qué ciudad y país escribís?` },
    { key: 'role',       ask: ()  => '¿Cuál es tu rol principal como profesional?\n\nEj: Frontend Developer, UX Designer, Data Scientist, Marketing Manager...' },
    { key: 'experience', ask: a  => `Excelente. ¿Cuántos años de experiencia tenés como ${a.role || 'profesional'}?\n\nY si querés, contame con qué tecnologías o herramientas trabajás más.` },
    { key: 'bio',        ask: ()  => 'Contame un poco sobre vos 💡\n\nProyectos en los que trabajaste, logros, o qué tipo de startups te apasionan.\n\n(Esta es tu carta de presentación ante los founders)' },
    { key: 'links',      ask: ()  => '¿Tenés portfolio, GitHub o LinkedIn?\n\nPegá los links que quieras compartir. Si no tenés, escribí "ninguno".' },
    { key: 'available',  ask: ()  => '¡Última pregunta! ¿Estás disponible para sumarte a proyectos ahora?\n\n→ Sí, estoy buscando activamente\n→ Tal vez, depende del proyecto\n→ No por ahora' },
  ],
  visionario: [
    { key: 'name',     ask: ()  => '¡Hola! Soy el asistente de Equia 🤖\n\nVoy a ayudarte a configurar tu perfil en un momento.\n\n¿Cómo te llamás?' },
    { key: 'location', ask: a  => `¡Genial, ${fn(a.name)}! ¿Desde qué ciudad y país estás construyendo?` },
    { key: 'role',     ask: ()  => '¿Cuál es tu rol o experiencia principal?\n\nEj: CEO, CTO, Product Manager, Serial Entrepreneur, Founder...' },
    { key: 'bio',      ask: ()  => 'Contame sobre tu trayectoria 🚀\n\nExperiencia previa, industrias en las que trabajaste, qué te trajo a Equia.' },
    { key: 'links',    ask: ()  => '¿Tenés LinkedIn o web personal?\n\nPegá los links que tengas. Si no tenés, escribí "ninguno".' },
  ],
  inversor: [
    { key: 'name',     ask: ()  => '¡Hola! Soy el asistente de Equia 🤖\n\nVamos a configurar tu perfil de inversor en segundos.\n\n¿Cómo te llamás?' },
    { key: 'location', ask: a  => `¡Hola, ${fn(a.name)}! ¿Desde qué ciudad y país operás?` },
    { key: 'role',     ask: ()  => '¿Cómo describís tu perfil?\n\nEj: Ángel investor, VC, Aceleradora, Mentor estratégico, Family office...' },
    { key: 'bio',      ask: ()  => '¿En qué industrias o etapas preferís invertir? ¿Tenés una tesis de inversión particular?' },
    { key: 'links',    ask: ()  => '¿Tenés LinkedIn o web?\n\nPegá los links que quieras. Si no tenés, escribí "ninguno".' },
  ],
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '13px 16px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: '18px 18px 18px 4px', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#bbb', animation: `eqDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
      ))}
    </div>
  )
}

export default function ProfileChat() {
  const { user, profile, loading, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [typing, setTyping] = useState(true)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allSkills, setAllSkills] = useState([])
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  const questions = QUESTIONS[profile?.type] || QUESTIONS.talento
  const progress = done ? 100 : Math.round((qIdx / questions.length) * 100)

  useEffect(() => { if (!loading && !user) navigate('/login') }, [user, loading])

  useEffect(() => {
    supabase.from('skills').select('id, name').then(({ data }) => { if (data) setAllSkills(data) })
  }, [])

  useEffect(() => {
    if (!profile?.type) return
    const qs = QUESTIONS[profile.type] || QUESTIONS.talento
    const t = setTimeout(() => {
      setTyping(false)
      setMessages([{ role: 'bot', text: qs[0].ask({}) }])
    }, 700)
    return () => clearTimeout(t)
  }, [profile?.type])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  useEffect(() => {
    if (!typing && !done && !saving) inputRef.current?.focus()
  }, [typing, done, saving])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const send = () => {
    const text = input.trim()
    if (!text || typing || done || saving) return
    setInput('')

    const upd = { ...answers, [questions[qIdx].key]: text }
    setAnswers(upd)
    setMessages(prev => [...prev, { role: 'user', text }])

    const next = qIdx + 1
    if (next >= questions.length) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setSaving(true)
        setMessages(prev => [...prev, { role: 'bot', text: `¡Perfecto, ${fn(upd.name || profile?.name)}! Guardando tu perfil... ⏳` }])
        doSave(upd)
      }, 600)
    } else {
      setQIdx(next)
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, { role: 'bot', text: questions[next].ask(upd) }])
      }, 900)
    }
  }

  const doSave = async (a) => {
    try {
      const links = parseLinks(a.links || '')
      const isAvail = !((a.available || '').toLowerCase().includes('no por ahora'))

      const updates = {
        name: a.name || profile.name,
        location: a.location || '',
        bio: a.bio || '',
        cv_data: {
          ...(profile.cv_data || {}),
          job_title: a.role || '',
          experience_raw: a.experience || '',
          setup_via: 'ai_chat',
          setup_date: new Date().toISOString(),
        },
      }
      if (links.linkedin_url) updates.linkedin_url = links.linkedin_url
      if (links.portfolio_url) updates.portfolio = links.portfolio_url
      if (profile.type === 'talento') { updates.role = a.role || ''; updates.available = isAvail }

      await updateProfile(updates)

      // Match skills for talento
      if (profile.type === 'talento' && allSkills.length > 0) {
        const raw = ((a.experience || '') + ' ' + (a.bio || '')).toLowerCase()
        const matched = allSkills.filter(s => raw.includes(s.name.toLowerCase()))
        if (matched.length) {
          await supabase.from('user_skills').delete().eq('user_id', user.id).catch(() => {})
          await supabase.from('user_skills').insert(matched.map(s => ({ user_id: user.id, skill_id: s.id }))).catch(() => {})
        }
      }

      const name = fn(a.name || profile?.name)
      const msg = profile.type === 'talento'
        ? `✅ ¡Listo, ${name}! Tu perfil está activo.\n\nYa sos visible para la IA de Equia. Cuando una idea matchee con tu perfil, te llegará una invitación automática.`
        : profile.type === 'visionario'
        ? `✅ ¡Listo, ${name}! Tu perfil está configurado.\n\nAhora podés lanzar tu primera idea y la IA va a construir el equipo perfecto para vos.`
        : `✅ ¡Listo, ${name}! Tu perfil de inversor está activo.\n\nYa podés explorar proyectos con equipos formados por IA.`

      setMessages(prev => [...prev, { role: 'bot', text: msg, final: true }])
      setDone(true)
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Hubo un error al guardar. Podés completar tu perfil manualmente desde la sección "Mi perfil".' }])
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const nextRoute = profile?.type === 'visionario' ? '/lanzar' : profile?.type === 'inversor' ? '/proyectos' : '/dashboard'
  const ctaLabel = profile?.type === 'visionario' ? '💡 Lanzar mi primera idea →' : profile?.type === 'inversor' ? '💼 Explorar proyectos →' : '⚡ Ver mi dashboard →'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 64, background: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes eqDot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '10px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', whiteSpace: 'nowrap' }}>
            {done ? '✅ Perfil listo' : 'Configurando perfil'}
          </div>
          <div style={{ flex: 1, height: 4, background: '#e8e8e8', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#E8611A', borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {done ? `${questions.length}/${questions.length}` : `${qIdx}/${questions.length}`}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 58 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 8px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10, animation: 'msgIn .25s ease' }}>
              {msg.role === 'bot' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, marginRight: 9, marginTop: 2 }}>E</div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '12px 15px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#E8611A' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#0a0a0a',
                fontSize: 14, lineHeight: 1.75,
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                whiteSpace: 'pre-line',
                border: msg.role === 'bot' ? '1px solid #e8e8e8' : 'none',
              }}>
                {msg.text}
                {msg.final && done && (
                  <button
                    onClick={() => navigate(nextRoute)}
                    style={{ display: 'block', marginTop: 14, width: '100%', padding: '11px', background: '#E8611A', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#d4561a'}
                    onMouseLeave={e => e.currentTarget.style.background = '#E8611A'}
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, marginRight: 9, marginTop: 2 }}>E</div>
              <TypingDots />
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      {!done && (
        <div style={{ background: '#fff', borderTop: '1px solid #e8e8e8', padding: '12px 16px 16px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={el => { inputRef.current = el; textareaRef.current = el }}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={typing || saving ? 'Un momento...' : 'Escribí tu respuesta...'}
                disabled={typing || saving}
                rows={1}
                style={{
                  flex: 1, padding: '11px 14px',
                  background: '#f8f9fa', border: '1px solid #d0d0d0',
                  borderRadius: 12, fontSize: 14, fontFamily: 'Inter, sans-serif',
                  outline: 'none', resize: 'none', color: '#0a0a0a',
                  lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                  transition: 'border-color .15s',
                  opacity: (typing || saving) ? 0.5 : 1,
                }}
                onFocus={e => e.target.style.borderColor = '#E8611A'}
                onBlur={e => e.target.style.borderColor = '#d0d0d0'}
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing || saving}
                style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: input.trim() && !typing && !saving ? '#E8611A' : '#e0e0e0',
                  border: 'none', cursor: input.trim() && !typing && !saving ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s',
                }}
              >
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4z" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#bbb' }}>Enter para enviar · Shift+Enter para nueva línea</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
