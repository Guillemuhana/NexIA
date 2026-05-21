import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { extractProfile } from '../lib/claude'

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

function calcCompleteness(prof) {
  if (!prof) return 0
  const cv = prof.cv_data || {}
  if (prof.type === 'talento') {
    const c = [
      !!prof.name, !!prof.location, !!prof.role, !!prof.bio,
      !!(prof.linkedin_url || prof.portfolio),
      prof.available !== undefined && prof.available !== null,
      !!(cv.experience?.length || cv.experience_raw),
      !!(cv.education?.length),
      !!(cv.languages?.length),
    ]
    return Math.round((c.filter(Boolean).length / c.length) * 100)
  }
  const c = [!!prof.name, !!prof.location, !!prof.role, !!prof.bio, !!(prof.linkedin_url || prof.portfolio)]
  return Math.round((c.filter(Boolean).length / c.length) * 100)
}

function motivational(pct) {
  if (pct >= 100) return 'Perfil completo. La IA puede matchearte con proyectos relevantes.'
  if (pct >= 80) return 'Casi listo. Unos datos más maximizan tus oportunidades.'
  if (pct >= 50) return 'Buen avance. Más información mejora la precisión del match.'
  if (pct >= 20) return 'Seguimos construyendo tu perfil profesional.'
  return 'Un perfil completo te hace visible para founders en todo el ecosistema.'
}

function getStatus(type, prof) {
  const cv = prof?.cv_data || {}
  const map = type === 'talento' ? {
    nombre: !!prof?.name,
    ubicación: !!prof?.location,
    rol: !!prof?.role,
    experiencia: !!(cv.experience?.length || cv.experience_raw),
    formación: !!(cv.education?.length),
    idiomas: !!(cv.languages?.length),
    bio: !!prof?.bio,
    links: !!(prof?.linkedin_url || prof?.portfolio),
  } : {
    nombre: !!prof?.name,
    ubicación: !!prof?.location,
    rol: !!prof?.role,
    bio: !!prof?.bio,
    links: !!(prof?.linkedin_url || prof?.portfolio),
  }
  return {
    completed: Object.entries(map).filter(([, v]) => v).map(([k]) => k),
    pending: Object.entries(map).filter(([, v]) => !v).map(([k]) => k),
  }
}

const TALENTO_QS = [
  {
    key: 'name', multiline: false,
    filled: p => !!p?.name,
    ask: () => '¿Cuál es tu nombre completo?',
  },
  {
    key: 'location', multiline: false,
    filled: p => !!p?.location,
    ask: () => '¿En qué ciudad y país te encontrás actualmente?',
  },
  {
    key: 'role', multiline: false,
    filled: p => !!p?.role,
    ask: () => '¿Cuál es tu rol o especialización principal?\n\nEjemplos: Frontend Developer, UX Designer, Data Scientist, Product Manager, Growth Marketing.',
  },
  {
    key: 'experience', multiline: true,
    filled: p => !!(p?.cv_data?.experience?.length || p?.cv_data?.experience_raw),
    ask: () => 'Describí tu trayectoria laboral.\n\nIncluí empresa, cargo y período. Si estás comenzando, podés mencionar proyectos personales o freelance. (Si no tenés, escribí "no aplica")',
  },
  {
    key: 'education', multiline: true,
    filled: p => !!(p?.cv_data?.education?.length),
    ask: () => '¿Cuál es tu formación académica?\n\nInstitución, carrera y año de egreso o estado actual. (Si no tenés, escribí "no aplica")',
  },
  {
    key: 'languages', multiline: false,
    filled: p => !!(p?.cv_data?.languages?.length),
    ask: () => '¿Qué idiomas manejás y en qué nivel?\n\nEjemplo: inglés avanzado, portugués básico.',
  },
  {
    key: 'certs_yn',
    filled: p => !!(p?.cv_data?.certifications?.length),
    ask: () => '¿Contás con certificaciones, cursos técnicos o formación adicional relevante para tu perfil?',
    options: ['Sí, tengo', 'No por ahora'],
  },
  {
    key: 'certifications', multiline: true,
    ask: () => 'Listá tus certificaciones más relevantes.\n\nNombre, institución y año.',
    onlyIf: a => a.certs_yn?.startsWith('Sí'),
  },
  {
    key: 'bio', multiline: true,
    filled: p => !!p?.bio,
    ask: () => 'Redactá una presentación profesional breve.\n\nDescribí tu perfil, qué tipo de proyectos te apasionan y qué valor aportás a un equipo. Será tu carta de presentación ante los founders.',
  },
  {
    key: 'links', multiline: false,
    filled: p => !!(p?.linkedin_url || p?.portfolio),
    ask: () => '¿Contás con portfolio, GitHub o LinkedIn?\n\nPegá los links disponibles. Si no tenés, escribí "ninguno".',
  },
  {
    key: 'available',
    filled: p => p?.available !== undefined && p?.available !== null,
    ask: () => '¿Estás disponible para incorporarte a proyectos de startup actualmente?',
    options: ['Sí, estoy buscando activamente', 'Disponible según el proyecto', 'No por el momento'],
  },
]

const VISIONARIO_QS = [
  { key: 'name', multiline: false, filled: p => !!p?.name, ask: () => '¿Cuál es tu nombre completo?' },
  { key: 'location', multiline: false, filled: p => !!p?.location, ask: () => '¿Desde qué ciudad y país estás desarrollando tu proyecto?' },
  { key: 'role', multiline: false, filled: p => !!p?.role, ask: () => '¿Cómo definís tu rol o experiencia principal?\n\nEjemplos: CEO, CTO, Product Manager, Serial Entrepreneur, Founder.' },
  { key: 'bio', multiline: true, filled: p => !!p?.bio, ask: () => 'Contá tu trayectoria como fundador o emprendedor.\n\nExperiencia previa, industrias en las que trabajaste y qué te llevó a Equia.' },
  { key: 'links', multiline: false, filled: p => !!(p?.linkedin_url || p?.portfolio), ask: () => '¿Tenés LinkedIn u otra presencia online?\n\nPegá los links disponibles. Si no tenés, escribí "ninguno".' },
]

const INVERSOR_QS = [
  { key: 'name', multiline: false, filled: p => !!p?.name, ask: () => '¿Cuál es tu nombre completo?' },
  { key: 'location', multiline: false, filled: p => !!p?.location, ask: () => '¿Desde qué ciudad y país operás?' },
  { key: 'role', multiline: false, filled: p => !!p?.role, ask: () => '¿Cómo describís tu perfil de inversión?\n\nEjemplos: Ángel investor, VC, Aceleradora, Mentor estratégico, Family office.' },
  { key: 'bio', multiline: true, filled: p => !!p?.bio, ask: () => '¿En qué industrias o etapas preferís invertir?\n\n¿Tenés una tesis de inversión particular o criterios de selección específicos?' },
  { key: 'links', multiline: false, filled: p => !!(p?.linkedin_url || p?.portfolio), ask: () => '¿Tenés LinkedIn u otra presencia online?\n\nPegá los links disponibles. Si no tenés, escribí "ninguno".' },
]

const QS_BY_TYPE = { talento: TALENTO_QS, visionario: VISIONARIO_QS, inversor: INVERSOR_QS }

function buildActive(type, prof, answers) {
  return (QS_BY_TYPE[type] || TALENTO_QS).filter(q => {
    if (q.filled?.(prof)) return false
    if (q.onlyIf) return q.onlyIf(answers)
    return true
  })
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '11px 14px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px 16px 16px 3px', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8c8c8', animation: `pcDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
      ))}
    </div>
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
  const [startPct, setStartPct] = useState(0)
  const [totalActive, setTotalActive] = useState(1)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const messagesRef = useRef([])

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { if (!loading && !user) navigate('/login') }, [user, loading])
  useEffect(() => {
    supabase.from('skills').select('id, name').then(({ data }) => { if (data) setAllSkills(data) })
  }, [])

  useEffect(() => {
    if (!profile?.type) return
    const type = profile.type
    const pct = calcCompleteness(profile)
    const active = buildActive(type, profile, {})

    setStartPct(pct)
    setTotalActive(Math.max(1, active.length))

    const name = fn(profile.name)

    if (active.length === 0) {
      setTyping(false)
      setMessages([{
        role: 'bot',
        text: `Tu perfil está completo${name ? `, ${name}` : ''}.\n\nTodo está al día. Podés actualizar cualquier dato directamente desde "Mi perfil".`,
        final: true,
      }])
      setDone(true)
      return
    }

    setTimeout(() => {
      setTyping(false)

      if (pct > 0) {
        const { completed, pending } = getStatus(type, profile)
        const lines = [
          `Retomamos tu perfil${name ? `, ${name}` : ''}. Está al ${pct}% completado.`,
          '',
          completed.length ? `Completado: ${completed.join(', ')}.` : '',
          pending.length ? `Pendiente: ${pending.join(', ')}.` : '',
          '',
          'Continuamos con los datos faltantes.',
        ].filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n')

        setMessages([{ role: 'bot', text: lines }])
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setMessages(m => [...m, { role: 'bot', text: active[0].ask({}) }])
        }, 1000)
      } else {
        const intro = 'Vamos a construir tu perfil profesional completo en Equia.\n\nCuanto más completo esté, mayor es la precisión con la que la IA te conecta con proyectos y founders que buscan tu perfil.'
        setMessages([{ role: 'bot', text: intro }])
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setMessages(m => [...m, { role: 'bot', text: active[0].ask({}) }])
        }, 900)
      }

      setQIdx(0)
    }, 600)
  }, [profile?.type])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (!typing && !done && !saving) setTimeout(() => inputRef.current?.focus(), 100)
  }, [typing, done, saving])

  const activeQuestions = buildActive(profile?.type || 'talento', profile, answers)
  const currentQ = activeQuestions[qIdx]
  const hasOptions = !!currentQ?.options

  const sessionPct = totalActive > 0 ? (qIdx / totalActive) * (100 - startPct) : 0
  const progress = done ? 100 : saving ? Math.min(98, Math.round(startPct + sessionPct)) : Math.round(startPct + sessionPct)

  const advance = (value) => {
    if (typing || done || saving || !currentQ) return
    const newAnswers = { ...answers, [currentQ.key]: value }
    setAnswers(newAnswers)
    setMessages(m => [...m, { role: 'user', text: value }])
    setInput('')

    const nextActive = buildActive(profile.type, profile, newAnswers)
    const nextIdx = qIdx + 1

    if (nextIdx >= nextActive.length) {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setSaving(true)
        setMessages(m => [...m, { role: 'bot', text: 'Procesando tu información con IA. En unos segundos tu perfil quedará actualizado.' }])
        doSave(newAnswers)
      }, 600)
    } else {
      setQIdx(nextIdx)
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages(m => [...m, { role: 'bot', text: nextActive[nextIdx].ask(newAnswers) }])
      }, 800)
    }
  }

  const doSave = async (a) => {
    try {
      const conversationText = messagesRef.current
        .map(m => `${m.role === 'bot' ? 'Asistente' : 'Usuario'}: ${m.text}`)
        .join('\n')

      const [aiResult, cvResp] = await Promise.allSettled([
        extractProfile({ history: messagesRef.current, userRole: profile.type }),
        supabase.functions.invoke('claude-proxy', {
          body: { action: 'extractCV', conversation: conversationText, userName: profile?.name || 'usuario' },
        }),
      ])

      const ai = aiResult.status === 'fulfilled' ? aiResult.value : null
      let cvData = null
      if (cvResp.status === 'fulfilled' && !cvResp.value.error) {
        try {
          const raw = cvResp.value.data?.content?.[0]?.text || ''
          cvData = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
        } catch {}
      }

      const links = parseLinks(a.links || '')
      const name = ai?.name || a.name || profile.name
      const location = ai?.location || a.location || profile.location || ''
      const bio = ai?.bio || a.bio || profile.bio || ''
      const role = ai?.role || a.role || profile.role || ''
      const liUrl = ai?.linkedin_url || links.linkedin_url
      const ptUrl = ai?.portfolio_url || links.portfolio_url

      const availStr = a.available || ''
      const isAvail = availStr.includes('buscando activamente') ? true
        : availStr.includes('No por') ? false
        : null

      const existingCv = profile.cv_data || {}
      const mergedCv = {
        ...existingCv,
        ...(cvData || {}),
        job_title: role,
        ...(a.experience ? { experience_raw: a.experience } : {}),
        skills_ai: ai?.skills || existingCv.skills_ai || [],
        setup_via: 'profile_chat_v2',
        setup_date: new Date().toISOString(),
      }

      const updates = { name, location, bio, cv_data: mergedCv }
      if (liUrl) updates.linkedin_url = liUrl
      if (ptUrl) updates.portfolio = ptUrl
      if (profile.type === 'talento') {
        updates.role = role
        if (isAvail !== null) updates.available = isAvail
      }

      await updateProfile(updates)

      if (profile.type === 'talento' && allSkills.length > 0) {
        const aiSkills = (ai?.skills || []).map(s => s.toLowerCase())
        const rawText = ((a.experience || '') + ' ' + (a.bio || '')).toLowerCase()
        const matched = allSkills.filter(s => {
          const n = s.name.toLowerCase()
          return aiSkills.some(as => as.includes(n) || n.includes(as)) || rawText.includes(n)
        })
        if (matched.length) {
          await supabase.from('user_skills').delete().eq('user_id', user.id).catch(() => {})
          await supabase.from('user_skills').insert(matched.map(s => ({ user_id: user.id, skill_id: s.id }))).catch(() => {})
        }
      }

      const displayName = fn(name)
      const finalMsg = profile.type === 'talento'
        ? `Tu perfil ha sido guardado, ${displayName}.\n\nLa IA de Equia puede conectarte con proyectos que buscan tu perfil. Cuando una idea sea compatible con tu experiencia, recibirás una invitación.`
        : profile.type === 'visionario'
        ? `Tu perfil está configurado, ${displayName}.\n\nAhora podés lanzar tu primera idea y la IA construirá el equipo ideal para vos.`
        : `Tu perfil de inversor está activo, ${displayName}.\n\nPodés explorar proyectos con equipos formados por IA.`

      setMessages(m => [...m, { role: 'bot', text: finalMsg, final: true }])
      setDone(true)
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Hubo un error al guardar. Podés completar tu perfil manualmente desde "Mi perfil".' }])
    } finally {
      setSaving(false)
    }
  }

  const nextRoute = profile?.type === 'visionario' ? '/lanzar' : profile?.type === 'inversor' ? '/proyectos' : '/dashboard'
  const ctaLabel = profile?.type === 'visionario' ? 'Lanzar mi primera idea →' : profile?.type === 'inversor' ? 'Explorar proyectos →' : 'Ver mi dashboard →'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 64, background: '#fafafa', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes pcDot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes pcIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Progress header */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #ebebeb', padding: '10px 20px 12px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 5 }}>
            <div style={{ flex: 1, height: 3, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#E8611A', borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E8611A', minWidth: 34, textAlign: 'right' }}>{progress}%</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.1px' }}>{motivational(progress)}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 62 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12, animation: 'pcIn .2s ease' }}>
              {msg.role === 'bot' && <BotAvatar />}
              <div style={{
                maxWidth: '78%', padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#E8611A' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#111',
                fontSize: 14, lineHeight: 1.75,
                border: msg.role === 'bot' ? '1px solid #ebebeb' : 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
                {msg.final && done && (
                  <button
                    onClick={() => navigate(nextRoute)}
                    style={{ display: 'block', marginTop: 16, width: '100%', padding: '11px', background: '#E8611A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.2px' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <BotAvatar />
              <TypingDots />
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Chip options */}
      {!done && !typing && !saving && hasOptions && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 20px 16px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentQ.options.map(opt => (
              <button
                key={opt}
                onClick={() => advance(opt)}
                style={{ padding: '9px 20px', borderRadius: 99, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: '#333', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8611A'; e.currentTarget.style.color = '#E8611A' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#333' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      {!done && !typing && !saving && !hasOptions && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 16px 18px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.trim()) advance(input.trim()) } }}
                placeholder="Escribí tu respuesta..."
                rows={currentQ?.multiline ? 3 : 1}
                style={{
                  flex: 1, padding: '11px 14px',
                  background: '#f8f9fa', border: '1.5px solid #e8e8e8',
                  borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif',
                  outline: 'none', resize: 'none', color: '#111',
                  lineHeight: 1.6, transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#E8611A'}
                onBlur={e => e.target.style.borderColor = '#e8e8e8'}
              />
              <button
                onClick={() => { if (input.trim()) advance(input.trim()) }}
                disabled={!input.trim()}
                style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: input.trim() ? '#E8611A' : '#f0f0f0',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s',
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4z" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 7 }}>
              <span style={{ fontSize: 11, color: '#ccc' }}>Enter para enviar · Shift+Enter para nueva línea</span>
            </div>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            La IA está procesando tu perfil...
          </div>
        </div>
      )}
    </div>
  )
}
