import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoEquia from '../components/LogoEquia'
import { supabase } from '../lib/supabase'

/* ── Particle canvas background ── */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []

    const init = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const count = window.innerWidth < 640 ? 32 : 68
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r: Math.random() * 1.4 + 0.4,
      }))
    }
    init()
    window.addEventListener('resize', init)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(232,97,26,${(1 - d / 130) * 0.22})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.52)'
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    />
  )
}

/* ── Scroll-in animation hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

/* ── Typewriter ── */
function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const phrase = phrases[phraseIdx]
    let t
    if (!deleting && charIdx < phrase.length) { t = setTimeout(() => { setText(phrase.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, 65) }
    else if (!deleting && charIdx === phrase.length) { t = setTimeout(() => setDeleting(true), 2400) }
    else if (deleting && charIdx > 0) { t = setTimeout(() => { setText(phrase.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }, 32) }
    else { setDeleting(false); setPhraseIdx(i => (i + 1) % phrases.length) }
    return () => clearTimeout(t)
  }, [charIdx, deleting, phraseIdx])
  return text
}

/* ── Data ── */
const STEPS = [
  { n: '01', icon: '💡', title: 'Describí tu idea', desc: 'Nombre, descripción y los roles que necesitás. Sin formularios largos.' },
  { n: '02', icon: '🤖', title: 'La IA arma el equipo', desc: 'Analiza perfiles disponibles y elige los más compatibles con tu proyecto.' },
  { n: '03', icon: '🤝', title: 'El equipo acepta', desc: 'Cada talento recibe una invitación personalizada. Acepta y el equipo está formado.' },
  { n: '04', icon: '🚀', title: 'Panel privado del equipo', desc: 'Roadmap, ideas y un asesor IA exclusivo para que el equipo ejecute.', highlight: true },
]

const PANEL_FEATURES = [
  { icon: '🗺️', title: 'Hoja de Ruta IA', desc: 'Fases, tareas y tiempos generados por Gemini específicos para tu proyecto.' },
  { icon: '💡', title: 'Ideas personalizadas', desc: '6 ideas accionables clasificadas por impacto y esfuerzo. Actualizables en cualquier momento.' },
  { icon: '📊', title: 'Métricas y riesgos', desc: 'KPIs clave y riesgos identificados con estrategias de mitigación incluidas.' },
  { icon: '🤖', title: 'Consultor IA 24/7', desc: 'Preguntale cualquier cosa al asesor. Responde con contexto total de tu proyecto.' },
]

const ROLES_DATA = [
  { label: 'Visionario', tag: 'Tenés una idea', desc: 'Describila y la IA construye tu equipo ideal en minutos. Primera idea gratis.', cta: 'Tengo una idea', path: '/registro?rol=visionario', accent: true },
  { label: 'Talento', tag: 'Sos un profesional', desc: 'Cargá tus skills y recibí invitaciones a proyectos que matchean con tu perfil.', cta: 'Postúlate', path: '/registro?rol=talento', accent: false },
  { label: 'Inversor', tag: 'Buscás proyectos', desc: 'Explorá proyectos con equipos ya formados por IA. Contactá directo con el founder.', cta: 'Invertí en una idea', path: '/registro?rol=inversor', accent: false },
]

const ROLE_COLORS = {
  'Desarrollador Full Stack': { bg: 'rgba(232,97,26,.08)', color: '#E8611A' },
  'Desarrollador Frontend': { bg: 'rgba(59,130,246,.08)', color: '#2563eb' },
  'Desarrollador Backend': { bg: 'rgba(139,92,246,.08)', color: '#7c3aed' },
  'UX/UI Designer': { bg: 'rgba(236,72,153,.08)', color: '#be185d' },
  'Marketing Digital': { bg: 'rgba(16,185,129,.08)', color: '#059669' },
  'Product Manager': { bg: 'rgba(245,158,11,.08)', color: '#b45309' },
  'Data Scientist / IA': { bg: 'rgba(99,102,241,.08)', color: '#4338ca' },
}

export default function Home() {
  const navigate = useNavigate()
  const typed = useTypewriter(['el equipo ideal.', 'hace realidad tu idea.', 'encuentra tu equipo.'])
  const [talents, setTalents] = useState([])
  const [ideas, setIdeas] = useState([])
  const [stepsRef, stepsVisible] = useInView(0.1)
  const [rolesRef, rolesVisible] = useInView(0.1)
  const [panelRef, panelVisible] = useInView(0.1)

  useEffect(() => {
    supabase.from('talent_profiles')
      .select('available, main_role, users(id, name, location, user_skills(skills(name)))')
      .eq('available', true)
      .limit(18)
      .then(({ data }) => {
        const shuffled = [...(data || [])].sort(() => Math.random() - 0.5).slice(0, 6)
        setTalents(shuffled)
      })
      .catch(() => {})

    supabase.from('ideas')
      .select('id, title, description, category, stage, idea_roles(role_name)')
      .eq('is_public', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setIdeas(data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="page-wrap">

      {/* ── HERO ── */}
      <div className="hero-section" style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.82) 50%, rgba(0,0,0,0.65) 100%)',
        }} />

        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(84px,14vw,130px) clamp(20px,6vw,64px) clamp(32px,5vw,60px)',
        }}>
          <div style={{ maxWidth: 540, width: '100%' }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: '#999',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100,
              padding: '6px 16px', marginBottom: 32,
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
              animation: 'fadeUp .6s ease both',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0 }} />
              Matching con IA para startups
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(52px, 13vw, 88px)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: '-1px',
              marginBottom: 20,
              color: '#fff',
              animation: 'fadeUp .6s ease .1s both',
            }}>
              Tu idea,
              <span style={{
                display: 'block',
                minHeight: '2.2em',
                color: '#E8611A',
                lineHeight: 1.0,
                textShadow: '0 0 40px rgba(232,97,26,0.35)',
              }}>
                {typed}<span style={{ animation: 'blink 1s infinite' }}>|</span>
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 4vw, 17px)',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.75,
              marginBottom: 36,
              maxWidth: 400,
              animation: 'fadeUp .6s ease .2s both',
            }}>
              Describí tu proyecto y la IA encuentra las personas exactas para construirlo. Sin entrevistas, sin perder tiempo.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, animation: 'fadeUp .6s ease .3s both' }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/lanzar')}
                style={{ padding: '17px 24px', fontSize: 17, borderRadius: 12, letterSpacing: '.2px', width: '100%', boxShadow: '0 0 32px rgba(232,97,26,0.3)' }}
              >
                Tengo una idea →
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Postúlate', path: '/registro?rol=talento' },
                  { label: `💡 ${ideas.length || '–'} ideas`, path: '/proyectos' },
                ].map(b => (
                  <button
                    key={b.path + b.label}
                    onClick={() => navigate(b.path)}
                    style={{
                      padding: '14px 10px', fontSize: 13, fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                      cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
                      color: '#888', fontFamily: 'Inter, sans-serif',
                      transition: 'all .2s', backdropFilter: 'blur(6px)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/registro?rol=inversor')}
                style={{
                  padding: '14px 10px', fontSize: 13, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
                  color: '#888', fontFamily: 'Inter, sans-serif',
                  transition: 'all .2s', backdropFilter: 'blur(6px)', width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                Invertí en una idea
              </button>
            </div>

          </div>
        </div>

        {/* Trust strip */}
        <div style={{
          position: 'relative', zIndex: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)',
          padding: 'clamp(16px,4vw,24px) clamp(20px,6vw,64px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 8,
        }}>
          {[
            { value: 'Gratis', sub: 'para empezar' },
            { value: '< 5 min', sub: 'matching con IA' },
            { value: 'Latam', sub: 'comunidad activa' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 'clamp(13px,3.5vw,16px)', fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>{s.value}</div>
              <div style={{ fontSize: 'clamp(10px,2.5vw,12px)', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── dark section */}
      <div ref={stepsRef} style={{ padding: 'clamp(64px,12vw,100px) clamp(20px,6vw,40px)', background: '#0c0c0c' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(44px,8vw,64px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '3px', textTransform: 'uppercase' }}>Proceso</span>
            <h2 style={{
              fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900,
              letterSpacing: '-1.5px', marginTop: 12, lineHeight: 1.1, color: '#fff',
            }}>
              De la idea al equipo<br />en minutos
            </h2>
          </div>

          {/* Steps grid */}
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: 44, left: '12%', right: '12%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(232,97,26,0.3) 20%, rgba(232,97,26,0.3) 80%, transparent)',
              zIndex: 0,
            }} />

            {STEPS.map((s, i) => (
              <div
                key={s.n}
                style={{
                  padding: '0 12px',
                  textAlign: 'center',
                  position: 'relative', zIndex: 1,
                  opacity: stepsVisible ? 1 : 0,
                  transform: stepsVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity .55s ease ${i * 0.13}s, transform .55s ease ${i * 0.13}s`,
                }}
              >
                {/* Icon circle */}
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32,
                  background: s.highlight
                    ? 'radial-gradient(circle, rgba(232,97,26,0.25) 0%, rgba(232,97,26,0.08) 100%)'
                    : 'rgba(255,255,255,0.04)',
                  border: s.highlight ? '1px solid rgba(232,97,26,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: s.highlight ? '0 0 36px rgba(232,97,26,0.25)' : 'none',
                }}>
                  {s.icon}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 2, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontSize: 'clamp(13px,3vw,15px)', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{s.title}</div>
                {s.highlight && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(232,97,26,.18)', color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', display: 'inline-block', marginBottom: 8 }}>Exclusivo</span>
                )}
                <div style={{ fontSize: 'clamp(11px,2.5vw,13px)', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── PANEL FEATURES ── */}
      <div ref={panelRef} style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8', background: '#f8f9fa' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 32, flexWrap: 'wrap', marginBottom: 'clamp(36px,7vw,52px)',
            opacity: panelVisible ? 1 : 0, transform: panelVisible ? 'none' : 'translateY(20px)',
            transition: 'all .6s ease',
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase' }}>Solo para el equipo</span>
              <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10, lineHeight: 1.1 }}>
                Tu propio espacio<br />privado con IA
              </h2>
            </div>
            <p style={{ fontSize: 'clamp(13px,3.5vw,15px)', color: '#666', lineHeight: 1.75, maxWidth: 320, paddingTop: 8 }}>
              Cuando el equipo está formado, Equia les otorga automáticamente un panel exclusivo. Nadie de afuera puede verlo.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 1, border: '1px solid #e8e8e8', marginBottom: 40 }}>
            {PANEL_FEATURES.map((f, i) => (
              <div key={i} style={{
                padding: 'clamp(22px,4vw,28px)', background: '#ffffff',
                borderRight: i % 2 === 0 ? '1px solid #e8e8e8' : 'none',
                opacity: panelVisible ? 1 : 0, transform: panelVisible ? 'none' : 'translateY(16px)',
                transition: `all .5s ease ${i * 0.1}s`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-.3px', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Preview mockup */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ padding: '10px 16px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: .5 }} />)}
              </div>
              <div style={{ flex: 1, height: 22, background: '#f0f0f0', borderRadius: 4, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ fontSize: 11, color: '#888' }}>equia.app/panel/mi-proyecto</span>
              </div>
            </div>
            <div className="home-panel-mockup-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 220 }}>
              <div className="home-panel-sidebar" style={{ borderRight: '1px solid #f0f0f0', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Visión General', 'Hoja de Ruta', 'Ideas IA', 'Build Log', 'Equipo', 'Consultor IA'].map((item, i) => (
                  <div key={item} style={{ padding: '8px 10px', borderRadius: 6, background: i === 0 ? 'rgba(232,97,26,.1)' : 'transparent', fontSize: 12, color: i === 0 ? '#E8611A' : '#888', fontWeight: i === 0 ? 700 : 400 }}>{item}</div>
                ))}
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Resumen estratégico</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[90, 75, 60, 80].map((w, i) => (
                    <div key={i} style={{ height: 9, borderRadius: 99, background: '#f0f0f0', width: `${w}%` }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  {['Roadmap generado', '6 ideas IA', 'Asesor activo'].map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A', border: '1px solid rgba(232,97,26,.15)', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── ROLES ── */}
      <div ref={rolesRef} style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,7vw,56px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Para todos</span>
            <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10 }}>¿Quién sos en Equia?</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #e8e8e8' }}>
            {ROLES_DATA.map((r, i) => (
              <div
                key={r.label}
                style={{
                  padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,32px)',
                  background: r.accent ? '#f5f5f5' : '#ffffff',
                  display: 'flex', alignItems: 'center', gap: 20,
                  borderBottom: '1px solid #e8e8e8', flexWrap: 'wrap',
                  opacity: rolesVisible ? 1 : 0, transform: rolesVisible ? 'none' : 'translateX(-16px)',
                  transition: `all .5s ease ${i * 0.12}s`,
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(16px,4vw,18px)', fontWeight: 900, letterSpacing: '-.5px' }}>{r.label}</span>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: r.accent ? 'rgba(232,97,26,.12)' : 'rgba(0,0,0,.05)', color: r.accent ? '#E8611A' : '#666', border: `1px solid ${r.accent ? 'rgba(232,97,26,.2)' : '#e8e8e8'}`, fontWeight: 600 }}>
                      {r.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 'clamp(13px,3.5vw,14px)', color: '#666', lineHeight: 1.7 }}>{r.desc}</p>
                </div>
                <button
                  onClick={() => navigate(r.path)}
                  style={{
                    padding: '12px 22px', fontSize: 14, fontWeight: 700,
                    borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all .15s', whiteSpace: 'nowrap',
                    background: r.accent ? '#E8611A' : 'transparent',
                    color: r.accent ? '#fff' : '#666',
                    border: r.accent ? 'none' : '1px solid #d0d0d0',
                  }}
                  onMouseEnter={e => { if (!r.accent) { e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.color = '#333' } }}
                  onMouseLeave={e => { if (!r.accent) { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.color = '#666' } }}
                >
                  {r.cta} →
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── IDEAS ACTIVAS ── */}
      {ideas.length > 0 && (
        <div style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8', background: '#f8f9fa' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(32px,6vw,48px)', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase' }}>Ideas buscando equipo</span>
                <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10, lineHeight: 1.1 }}>
                  Proyectos que necesitan<br />tu talento
                </h2>
              </div>
              <button
                onClick={() => navigate('/proyectos')}
                style={{ padding: '11px 22px', fontSize: 14, fontWeight: 600, border: '1px solid #d0d0d0', borderRadius: 9, background: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#aaa'; e.currentTarget.style.color = '#111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.color = '#555' }}
              >
                Ver todos →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 10 }}>
              {ideas.map((idea) => {
                const roles = (idea.idea_roles || []).map(r => r.role_name).filter(Boolean)
                return (
                  <div
                    key={idea.id}
                    onClick={() => navigate(`/proyectos/${idea.id}`)}
                    style={{ padding: '22px 22px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {idea.category && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(232,97,26,.1)', color: '#E8611A', border: '1px solid rgba(232,97,26,.15)' }}>{idea.category}</span>}
                      {idea.stage && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: '#f0f0f0', color: '#777', border: '1px solid #e8e8e8' }}>{idea.stage}</span>}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 8, lineHeight: 1.3 }}>{idea.title}</h3>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, flex: 1, marginBottom: roles.length > 0 ? 14 : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {idea.description}
                    </p>
                    {roles.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', marginRight: 4 }}>⚡</span>
                        {roles.slice(0, 3).map(r => (
                          <span key={r} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: '#f5f5f5', color: '#555', border: '1px solid #ebebeb' }}>{r}</span>
                        ))}
                        {roles.length > 3 && <span style={{ fontSize: 11, color: '#999' }}>+{roles.length - 3} más</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                onClick={() => navigate('/proyectos')}
                style={{ padding: '13px 32px', fontSize: 15, fontWeight: 600, border: '1px solid #d0d0d0', borderRadius: 10, background: 'none', color: '#444', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.color = '#111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.color = '#444' }}
              >
                Ver todos los proyectos →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── TALENTOS DISPONIBLES ── */}
      {talents.length > 0 && (
        <div style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(32px,6vw,48px)', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Comunidad activa</span>
                <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10, lineHeight: 1.1 }}>
                  Talentos esperando<br />tu proyecto
                </h2>
              </div>
              <button
                onClick={() => navigate('/explorar')}
                style={{ padding: '11px 22px', fontSize: 14, fontWeight: 600, border: '1px solid #d0d0d0', borderRadius: 9, background: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#aaa'; e.currentTarget.style.color = '#111' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.color = '#555' }}
              >
                Ver todos →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {talents.map((tp, i) => {
                const u = tp.users
                const skills = (u?.user_skills || []).map(us => us.skills?.name).filter(Boolean)
                const initials = u?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                const roleStyle = ROLE_COLORS[tp.main_role] || { bg: '#f0f0f0', color: '#555' }
                return (
                  <div
                    key={u?.id || i}
                    onClick={() => navigate(`/talento/${u?.id}`)}
                    style={{ padding: '20px 22px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: roleStyle.bg, color: roleStyle.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, flexShrink: 0, border: `1px solid ${roleStyle.color}22` }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0a0a0a', letterSpacing: '-.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u?.name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tp.main_role}</div>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#22c55e', flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                        Disponible
                      </span>
                    </div>
                    {skills.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {skills.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: '#f5f5f5', color: '#555', border: '1px solid #ebebeb' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                onClick={() => navigate('/explorar')}
                className="btn-primary"
                style={{ padding: '13px 32px', fontSize: 15, borderRadius: 10 }}
              >
                Explorar todos los talentos →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── CTA FINAL ── */}
      <div style={{ padding: 'clamp(72px,14vw,120px) clamp(20px,6vw,32px)', textAlign: 'center', background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#E8611A', border: '1px solid rgba(232,97,26,.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 28, background: 'rgba(232,97,26,.08)' }}>
          ⚡ Panel IA incluido para cada equipo
        </div>
        <h2 style={{ fontSize: 'clamp(32px,8vw,60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 14, lineHeight: 1.05, color: '#fff' }}>
          Empezá hoy.<br />Es gratis.
        </h2>
        <p style={{ fontSize: 'clamp(14px,4vw,16px)', color: 'rgba(255,255,255,0.45)', maxWidth: 360, margin: '0 auto 10px', lineHeight: 1.7 }}>
          Registrate, describí tu idea y la IA arma tu equipo ideal.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 36 }}>Sin tarjeta. Sin límite de tiempo.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/registro')} style={{ padding: '16px 44px', fontSize: 16, boxShadow: '0 0 32px rgba(232,97,26,0.3)' }}>
            Crear mi cuenta →
          </button>
          <button
            onClick={() => navigate('/explorar')}
            style={{ padding: '16px 28px', fontSize: 15, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s', backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          >
            Ver talentos →
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(20px,5vw,28px) clamp(20px,6vw,32px)', background: '#0c0c0c' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <LogoEquia size={18} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Equipo argentino y EE.UU.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Términos', 'Contacto'].map(l => (
              <span key={l} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >{l}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
