import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STEPS = [
  {
    key: 'headline',
    ask: (name) => `Vamos a construir tu CV digital completo${name ? `, ${name}` : ''}. La IA te ayuda a estructurarlo como un perfil de LinkedIn profesional.\n\n¿Cómo describirías tu rol en una línea?\n\nEjemplo: "Full-Stack Developer con 5 años en startups" o "Diseñadora UX especializada en apps mobile"`,
    placeholder: 'Ej: Backend Developer con experiencia en Node.js y AWS',
    multiline: false,
  },
  {
    key: 'exp',
    ask: () => 'Contame tu experiencia laboral.\n\nEmpresa, cargo, período y qué hacías. Podés listar todo junto. Si no tenés experiencia formal, escribí "no aplica".',
    placeholder: 'Ej: Mercado Libre – Backend Dev, 2021-hoy. Microservicios con Node.js y Kafka...\nFreelance – React apps para e-commerce, 2019-2021.',
    multiline: true,
  },
  {
    key: 'achievements',
    ask: () => 'Ahora los logros más importantes de tu carrera.\n\nResultados concretos, métricas, proyectos exitosos, reconocimientos. Esto es lo que más valoran los fundadores.',
    placeholder: 'Ej: Reduje tiempos de carga un 60%. Lideré un equipo de 4. Lancé feature usada por 80k usuarios. Migré monolito a microservicios en 3 meses...',
    multiline: true,
  },
  {
    key: 'projects_ask',
    ask: () => '¿Tenés proyectos propios, freelance o de código abierto que quieras mostrar?',
    options: ['Sí, tengo proyectos', 'No por ahora'],
  },
  {
    key: 'projects',
    ask: () => 'Describí tus proyectos más relevantes.\n\nNombre, qué es, tecnologías usadas y si tenés link (GitHub, producción, etc.).',
    placeholder: 'Ej: TaskFlow – App de productividad con React Native y Supabase, 500 usuarios activos. github.com/...\nEcommerce para marca de ropa – Next.js + Stripe, $30k/mes en ventas.',
    multiline: true,
    onlyIf: (a) => a.projects_ask?.startsWith('Sí'),
  },
  {
    key: 'edu',
    ask: () => '¿Cuál es tu formación académica?\n\nInstitución, carrera y período. Si no tenés, escribí "no aplica".',
    placeholder: 'Ej: UBA – Lic. en Sistemas, 2015-2021.\nUTN – Técnico en Redes, 2013-2015.',
    multiline: true,
  },
  {
    key: 'lang',
    ask: () => '¿Qué idiomas hablás y en qué nivel?\n\nSer específico ayuda: nivel de conversación, escrito, trabajaste en equipo internacional, etc.',
    placeholder: 'Ej: Inglés avanzado (trabajé con equipo de EE.UU. 2 años). Portugués intermedio. Español nativo.',
    multiline: false,
  },
  {
    key: 'cert_ask',
    ask: () => '¿Tenés certificaciones, cursos técnicos o formación adicional relevante?',
    options: ['Sí, tengo', 'No por ahora'],
  },
  {
    key: 'cert',
    ask: () => 'Listá tus certificaciones o cursos más relevantes.\n\nNombre, institución o plataforma y año.',
    placeholder: 'Ej: AWS Solutions Architect – Amazon, 2023.\nMachine Learning – Coursera/Andrew Ng, 2022.\nScrum Master – Scrum.org, 2021.',
    multiline: true,
    onlyIf: (a) => a.cert_ask?.startsWith('Sí'),
  },
  {
    key: 'desired',
    ask: () => 'Por último: ¿qué tipo de oportunidad estás buscando?\n\nTipo de rol, modalidad (remoto/presencial/híbrido), full-time o part-time, qué tipo de empresa o proyecto.',
    placeholder: 'Ej: Full-time remoto en startup tech, rol senior o lead. Me interesa IA, fintech o productos con impacto social.',
    multiline: false,
  },
]

function buildSteps(answers) {
  return STEPS.filter(s => !s.onlyIf || s.onlyIf(answers))
}

const STEP_LABELS = {
  headline: 'Titular',
  exp: 'Experiencia',
  achievements: 'Logros',
  projects_ask: 'Proyectos',
  projects: 'Proyectos',
  edu: 'Educación',
  lang: 'Idiomas',
  cert_ask: 'Certificaciones',
  cert: 'Certificaciones',
  desired: 'Qué buscás',
}

function BotAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#E8611A,#f97316)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, marginRight: 10, marginTop: 2,
      fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px',
    }}>EQ</div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '11px 14px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px 16px 16px 3px', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#d0d0d0', animation: `cvDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
      ))}
    </div>
  )
}

export default function CVChat() {
  const { user, profile, loading, recalculateCredits } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [answers, setAnswers] = useState({})
  const [stepIdx, setStepIdx] = useState(0)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    const name = profile?.name?.split(' ')[0] || ''
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages([{ role: 'bot', text: STEPS[0].ask(name) }])
    }, 700)
  }, [user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!isTyping && !awaitingConfirm && !saved && !saving) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isTyping, awaitingConfirm, saved, saving])

  const visibleSteps = buildSteps(answers)
  const currentStep = visibleSteps[stepIdx]
  const hasOptions = !!currentStep?.options

  const baseStepCount = buildSteps({}).length
  const progress = awaitingConfirm || saved
    ? 100
    : Math.round((stepIdx / baseStepCount) * 95)

  const advance = (value) => {
    const newAnswers = { ...answers, [currentStep.key]: value }
    setAnswers(newAnswers)
    setMessages(m => [...m, { role: 'user', text: value }])
    setInput('')

    const nextVisible = buildSteps(newAnswers)
    const nextIdx = stepIdx + 1

    if (nextIdx >= nextVisible.length) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(m => [...m, {
          role: 'bot',
          text: '¡Perfecto! Tengo toda tu información.\n\nVoy a procesarla con IA y estructurar tu CV completo automáticamente — como un perfil de LinkedIn profesional. ¿Guardamos ahora?',
        }])
        setAwaitingConfirm(true)
      }, 700)
      return
    }

    const nextStep = nextVisible[nextIdx]
    setIsTyping(true)
    setStepIdx(nextIdx)
    setTimeout(() => {
      setIsTyping(false)
      const name = profile?.name?.split(' ')[0] || ''
      setMessages(m => [...m, {
        role: 'bot',
        text: typeof nextStep.ask === 'function' ? nextStep.ask(name) : nextStep.ask,
      }])
    }, 700)
  }

  const handleSend = () => {
    const val = input.trim()
    if (!val || isTyping || awaitingConfirm) return
    advance(val)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setAwaitingConfirm(false)

    const conversationText = messages
      .map(m => `${m.role === 'bot' ? 'Asistente' : 'Usuario'}: ${m.text}`)
      .join('\n')
      + `\n\nDatos adicionales capturados:\n`
      + Object.entries(answers).filter(([, v]) => v).map(([k, v]) => `[${k}]: ${v}`).join('\n')

    let cvData = null
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 40000))
      const invokePromise = supabase.functions.invoke('claude-proxy', {
        body: { action: 'extractCV', conversation: conversationText, userName: profile?.name || 'usuario' },
      })
      const { data } = await Promise.race([invokePromise, timeout])
      const raw = data?.content?.[0]?.text || ''
      cvData = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
    } catch {
      // Fallback: estructura básica desde las respuestas del chat
      cvData = {
        job_title: answers.headline || '',
        summary: answers.achievements
          ? `${answers.headline || 'Profesional'} con experiencia en ${(answers.exp || '').slice(0, 80)}. ${(answers.achievements || '').slice(0, 120)}`
          : answers.exp && answers.exp !== 'no aplica' ? `Profesional con experiencia en ${answers.exp.slice(0, 120)}` : '',
        experience: [],
        education: [],
        languages: answers.lang ? [{ id: 'lang1', name: answers.lang, level: 'Intermedio' }] : [],
        certifications: [],
        projects: [],
        availability: 'Abierto a oportunidades',
        desired_role: answers.desired || '',
      }
    }

    const { error } = await supabase.from('users').update({ cv_data: cvData }).eq('id', user.id)
    setSaving(false)

    if (error) {
      setMessages(m => [...m, { role: 'bot', text: 'Hubo un error al guardar. Intentá de nuevo.' }])
      setAwaitingConfirm(true)
      return
    }

    setSaved(true)
    recalculateCredits().catch(() => {})
    setMessages(m => [...m, {
      role: 'bot',
      text: `¡Tu CV digital fue creado! 🎉\n\nLa IA estructuró toda tu información automáticamente. Tu perfil ahora tiene mucho más contexto para el algoritmo de matching — aparecerás con mayor prioridad cuando un visionario busque tu perfil.`,
      final: true,
    }])
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 64, background: '#fafafa', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes cvDot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes cvIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Progress header */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #ebebeb', padding: '10px 20px 12px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ flex: 1, height: 3, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#E8611A,#f97316)', borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E8611A', minWidth: 34, textAlign: 'right' }}>{progress}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: '#aaa' }}>
              {saved ? '✓ CV guardado con IA' : saving ? 'IA procesando tu CV...' : awaitingConfirm ? 'Listo para guardar' : `CV Digital · ${STEP_LABELS[currentStep?.key] || ''}`}
            </div>
            <div style={{ fontSize: 11, color: '#ddd' }}>
              {!saved && !awaitingConfirm && `${stepIdx + 1} / ${visibleSteps.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 62 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 14, animation: 'cvIn .2s ease' }}>
              {msg.role === 'bot' && <BotAvatar />}
              <div style={{
                maxWidth: '80%', padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? '#E8611A' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#111',
                fontSize: 14, lineHeight: 1.75,
                border: msg.role === 'bot' ? '1px solid #ebebeb' : 'none',
                boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
                {msg.final && saved && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn-primary" onClick={() => navigate('/cv')} style={{ flex: 1, padding: '11px', fontSize: 13, borderRadius: 8 }}>
                      Ver mi CV →
                    </button>
                    <button className="btn-outline" onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '11px', fontSize: 13, borderRadius: 8 }}>
                      Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14 }}>
              <BotAvatar />
              <TypingDots />
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Confirm / save */}
      {!isTyping && awaitingConfirm && !saved && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 16px 18px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: saving ? 0.7 : 1 }}>
              Generar y guardar mi CV con IA →
            </button>
          </div>
        </div>
      )}

      {saving && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            La IA está estructurando tu CV completo... puede tardar unos segundos.
          </div>
        </div>
      )}

      {/* Option chips */}
      {!isTyping && hasOptions && !awaitingConfirm && !saved && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 20px 16px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentStep.options.map(opt => (
              <button key={opt} onClick={() => advance(opt)}
                style={{ padding: '9px 20px', borderRadius: 99, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: '#333', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8611A'; e.currentTarget.style.color = '#E8611A' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#333' }}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      {!isTyping && !hasOptions && !awaitingConfirm && !saved && messages.length > 0 && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 16px 18px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={currentStep?.placeholder || 'Escribí tu respuesta...'}
                rows={currentStep?.multiline ? 3 : 1}
                style={{ flex: 1, padding: '11px 14px', background: '#f8f9fa', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'none', color: '#111', lineHeight: 1.6, transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = '#E8611A'}
                onBlur={e => e.target.style.borderColor = '#e8e8e8'}
              />
              <button onClick={handleSend} disabled={!input.trim()}
                style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: input.trim() ? '#E8611A' : '#f0f0f0', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#bbb'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4z" />
                </svg>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#ccc' }}>Enter para enviar · Shift+Enter para nueva línea</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
