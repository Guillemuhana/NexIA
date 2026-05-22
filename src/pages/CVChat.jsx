import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const STEPS = [
  {
    key: 'exp',
    ask: (name) => `Vamos a construir tu CV digital con IA${name ? `, ${name}` : ''}.\n\nContame tu experiencia laboral: empresa, cargo, período y qué hacías. Podés listar todo de una sola vez. Si no tenés experiencia, escribí "no aplica".`,
    placeholder: 'Ej: Google – Software Engineer, 2021 a la actualidad. Desarrollo de features para el buscador...',
    multiline: true,
  },
  {
    key: 'edu',
    ask: () => '¿Cuál es tu formación académica?\n\nInstitución, carrera y período. Si no tenés, escribí "no aplica".',
    placeholder: 'Ej: UBA – Lic. en Sistemas, 2015-2021. UTN – Ingeniería Industrial, cursando.',
    multiline: true,
  },
  {
    key: 'lang',
    ask: () => '¿Qué idiomas manejás y en qué nivel?',
    placeholder: 'Ej: inglés avanzado, portugués básico',
    multiline: false,
  },
  {
    key: 'cert_ask',
    ask: () => '¿Contás con certificaciones, cursos técnicos o formación adicional relevante?',
    options: ['Sí, tengo', 'No por ahora'],
  },
  {
    key: 'cert',
    ask: () => 'Listá tus certificaciones más relevantes.\n\nNombre, institución y año.',
    placeholder: 'Ej: AWS Solutions Architect – Amazon, 2023. Machine Learning – Coursera, 2022.',
    multiline: true,
    onlyIf: (a) => a.cert_ask?.startsWith('Sí'),
  },
]

function buildSteps(answers) {
  return STEPS.filter(s => !s.onlyIf || s.onlyIf(answers))
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

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '11px 14px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '16px 16px 16px 3px', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#c8c8c8', animation: `cvDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
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

  const totalSteps = buildSteps({}).length
  const progress = awaitingConfirm || saved
    ? 100
    : Math.round((stepIdx / totalSteps) * 100)

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
          text: 'Tengo toda la información. Voy a procesar tu CV con IA y estructurarlo automáticamente.\n\n¿Guardamos ahora?',
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
      + `\n${Object.entries(answers).filter(([, v]) => v).map(([k, v]) => `[${k}]: ${v}`).join(' | ')}`

    let cvData = null
    try {
      const { data } = await supabase.functions.invoke('claude-proxy', {
        body: { action: 'extractCV', conversation: conversationText, userName: profile?.name || 'usuario' },
      })
      const raw = data?.content?.[0]?.text || ''
      cvData = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
    } catch {
      cvData = {
        summary: answers.exp && answers.exp !== 'no aplica' ? `Profesional con experiencia en ${answers.exp.slice(0, 100)}` : '',
        experience: [],
        education: [],
        languages: answers.lang ? [{ name: answers.lang, level: 'Intermedio' }] : [],
        certifications: [],
      }
    }

    const { error } = await supabase.from('users').update({ cv_data: cvData }).eq('id', user.id)
    setSaving(false)

    if (error) {
      setMessages(m => [...m, { role: 'bot', text: `Hubo un error al guardar. Intentá de nuevo.` }])
      setAwaitingConfirm(true)
      return
    }

    setSaved(true)
    recalculateCredits().catch(() => {})
    setMessages(m => [...m, {
      role: 'bot',
      text: `Tu CV digital fue guardado. La IA estructuró tu información automáticamente.\n\nPodés verlo, editarlo o compartirlo desde la sección de CV.`,
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
        @keyframes cvIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Progress header */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #ebebeb', padding: '10px 20px 12px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 3, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#E8611A', borderRadius: 99, transition: 'width .5s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E8611A', minWidth: 34, textAlign: 'right' }}>{progress}%</span>
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            {saved ? 'CV guardado con IA.' : saving ? 'Procesando con IA...' : awaitingConfirm ? 'Revisá y confirmá para guardar.' : 'CV Digital con IA'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 62 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12, animation: 'cvIn .2s ease' }}>
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
                {msg.final && saved && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      className="btn-primary"
                      onClick={() => navigate('/cv')}
                      style={{ flex: 1, padding: '11px', fontSize: 13, borderRadius: 8 }}
                    >
                      Ver mi CV →
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => navigate('/perfil')}
                      style={{ flex: 1, padding: '11px', fontSize: 13, borderRadius: 8 }}
                    >
                      Mi perfil
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
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
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: saving ? 0.7 : 1, letterSpacing: '0.2px' }}
            >
              Guardar CV con IA →
            </button>
          </div>
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#888', fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            La IA está procesando tu CV...
          </div>
        </div>
      )}

      {/* Option chips */}
      {!isTyping && hasOptions && !awaitingConfirm && !saved && (
        <div style={{ background: '#fff', borderTop: '1px solid #ebebeb', padding: '12px 20px 16px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentStep.options.map(opt => (
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
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: input.trim() ? '#E8611A' : '#f0f0f0',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s',
                }}
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
