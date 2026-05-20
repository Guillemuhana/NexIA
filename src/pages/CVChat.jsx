import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const uid = () => Math.random().toString(36).slice(2)

const STEPS = [
  {
    key: 'exp',
    ask: (name) => `¡Hola${name ? ' ' + name : ''}! Vamos a armar tu CV digital con IA.\n\nContame tu experiencia laboral: empresa, cargo, período y qué hacías. Podés listar todo de una sola vez. (Si no tenés experiencia laboral, escribí "no tengo")`,
    placeholder: 'Ej: Google – Software Engineer, 2021 a la actualidad. Desarrollo features para el buscador...',
    multiline: true,
  },
  {
    key: 'edu',
    ask: () => `¿Cuál es tu formación académica? Podés incluir todo: institución, carrera y período. (Si no tenés, escribí "no tengo")`,
    placeholder: 'Ej: UBA – Lic. en Sistemas, 2015-2021. UTN – Ingeniería Industrial, cursando.',
    multiline: true,
  },
  {
    key: 'lang',
    ask: () => `¿Qué idiomas manejás y en qué nivel?`,
    placeholder: 'Ej: inglés avanzado, portugués básico',
    multiline: false,
  },
  {
    key: 'cert_ask',
    ask: () => `¿Tenés certificaciones o cursos relevantes?`,
    options: ['Sí, tengo', 'No, omitir'],
  },
  {
    key: 'cert',
    ask: () => `¡Perfecto! Listá tus certificaciones: nombre, plataforma/institución y año.`,
    placeholder: 'Ej: AWS Solutions Architect – Amazon, 2023. Machine Learning – Coursera, 2022.',
    multiline: true,
    onlyIf: (a) => a.cert_ask?.includes('Sí'),
  },
]

function buildSteps(answers) {
  return STEPS.filter(s => !s.onlyIf || s.onlyIf(answers))
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(232,97,26,.12)', border: '1px solid rgba(232,97,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2, fontSize: 14 }}>🤖</div>
      )}
      <div style={{
        maxWidth: '80%', padding: '11px 15px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? '#E8611A' : '#f0f0f0',
        border: isUser ? 'none' : '1px solid #e8e8e8',
        fontSize: 14, color: isUser ? '#fff' : '#333', lineHeight: 1.65, whiteSpace: 'pre-wrap',
      }}>
        {msg.text}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(232,97,26,.12)', border: '1px solid rgba(232,97,26,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, fontSize: 14 }}>🤖</div>
      <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '11px 15px', background: '#f0f0f0', border: '1px solid #e8e8e8', borderRadius: '16px 16px 16px 4px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8611A', animation: `cv-bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  )
}

export default function CVChat() {
  const { user, profile, loading } = useAuth()
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

  const scrollToBottom = () => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

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

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const visibleSteps = buildSteps(answers)
  const currentStep = visibleSteps[stepIdx]
  const hasOptions = !!currentStep?.options

  const advance = (value) => {
    const newAnswers = { ...answers, [currentStep.key]: value }
    setAnswers(newAnswers)
    setMessages(m => [...m, { role: 'user', text: value }])
    setInput('')

    const nextVisible = buildSteps(newAnswers)
    const nextIdx = stepIdx + 1

    if (nextIdx >= nextVisible.length) {
      // All steps done → show confirm
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(m => [...m, { role: 'bot', text: `¡Genial! Tengo todo para armar tu CV digital.\n\nVoy a usar IA para organizar la información perfectamente. ¿Lo guardamos ahora?` }])
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
      setMessages(m => [...m, { role: 'bot', text: typeof nextStep.ask === 'function' ? nextStep.ask(name) : nextStep.ask }])
      setTimeout(() => inputRef.current?.focus(), 100)
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

    // Build conversation text for AI
    const conversationText = messages
      .map(m => `${m.role === 'bot' ? 'Asistente' : 'Usuario'}: ${m.text}`)
      .join('\n')
      + `\nUsuario: ${Object.entries(answers).filter(([, v]) => v).map(([k, v]) => `[${k}]: ${v}`).join(' | ')}`

    let cvData = null
    try {
      const { data } = await supabase.functions.invoke('claude-proxy', {
        body: { action: 'extractCV', conversation: conversationText, userName: profile?.name || 'usuario' },
      })
      const raw = data?.content?.[0]?.text || ''
      cvData = JSON.parse(raw.replace(/```json\n?|```/g, '').trim())
    } catch {
      // Fallback: build minimal structure from answers
      cvData = {
        summary: answers.exp !== 'no tengo' ? `Profesional con experiencia en ${answers.exp?.slice(0, 100)}` : '',
        experience: [],
        education: [],
        languages: answers.lang ? [{ name: answers.lang, level: 'Intermedio' }] : [],
        certifications: [],
      }
    }

    const { error } = await supabase.from('users').update({ cv_data: cvData }).eq('id', user.id)
    setSaving(false)

    if (error) {
      setMessages(m => [...m, { role: 'bot', text: `Hubo un error al guardar: ${error.message}. Intentá de nuevo.` }])
      setAwaitingConfirm(true)
      return
    }

    setSaved(true)
    setMessages(m => [...m, { role: 'bot', text: `¡Listo! Tu CV digital fue guardado con IA. Ya podés verlo, editarlo o compartirlo desde la sección de CV.` }])
    scrollToBottom()
  }

  if (loading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const progress = awaitingConfirm || saved ? visibleSteps.length : stepIdx

  return (
    <div className="page-wrap">
      <style>{`@keyframes cv-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>

      <div style={{ padding: '90px 24px 60px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>CV Digital con IA</div>
        <h1 style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>
          Tu CV, <span style={{ color: '#E8611A' }}>armado con IA.</span>
        </h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Respondé las preguntas del chat y la IA estructura todo automáticamente.</p>

        {/* Chat box */}
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

          {/* Messages */}
          <div style={{ padding: '20px 20px 8px', minHeight: 200, maxHeight: 440, overflowY: 'auto' }}>
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {isTyping && <TypingDots />}
            <div ref={endRef} />
          </div>

          {/* Option chips */}
          {!isTyping && hasOptions && !awaitingConfirm && !saved && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 20px 16px' }}>
              {currentStep.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => advance(opt)}
                  style={{
                    padding: '9px 20px', borderRadius: 99, border: '1px solid #d0d0d0',
                    background: '#f8f9fa', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif', transition: 'all .15s', color: '#333',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#E8611A'; e.currentTarget.style.color = '#E8611A' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.color = '#333' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Confirm / save */}
          {!isTyping && awaitingConfirm && !saved && (
            <div style={{ padding: '8px 20px 20px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', opacity: saving ? 0.7 : 1, transition: 'opacity .15s' }}
              >
                {saving ? 'La IA está procesando tu CV...' : '🤖 Guardar CV con IA →'}
              </button>
            </div>
          )}

          {/* Post-save actions */}
          {saved && (
            <div style={{ padding: '8px 20px 20px', display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={() => navigate('/cv')} style={{ flex: 1, padding: '12px', fontSize: 14 }}>📄 Ver mi CV →</button>
              <button className="btn-outline" onClick={() => navigate('/perfil')} style={{ flex: 1, padding: '12px', fontSize: 14 }}>Mi perfil</button>
            </div>
          )}

          {/* Text input */}
          {!isTyping && !hasOptions && !awaitingConfirm && !saved && messages.length > 0 && (
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={currentStep?.placeholder || 'Escribí tu respuesta...'}
                rows={currentStep?.multiline ? 3 : 1}
                style={{ flex: 1, background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 8, color: '#0a0a0a', fontSize: 14, fontFamily: 'Inter,sans-serif', padding: '10px 12px', resize: 'none', outline: 'none', lineHeight: 1.5, transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(232,97,26,.4)'}
                onBlur={e => e.target.style.borderColor = '#e8e8e8'}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: input.trim() ? '#E8611A' : '#f0f0f0', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: input.trim() ? '#fff' : '#bbb', fontSize: 16, transition: 'all .15s' }}
              >→</button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {visibleSteps.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < progress ? '#E8611A' : '#e0e0e0', transition: 'all .3s' }} />
          ))}
        </div>

        {/* Link to form */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 16 }}>
          ¿Preferís el formulario clásico?{' '}
          <button onClick={() => navigate('/cv')} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Inter,sans-serif' }}>
            Ir al CV manual
          </button>
        </p>
      </div>
    </div>
  )
}
