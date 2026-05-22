import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb, BrainCircuit, Users, Rocket,
  Map, Sparkles, BarChart2, MessageSquare,
  ArrowRight, CheckCircle2, Zap,
} from 'lucide-react'
import LogoEquia from '../components/LogoEquia'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────
   Particle canvas — mouse-reactive, nodos glow
───────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let neurons = []
    let signals = []
    let t = 0

    const CONNECT_DIST = 140
    const MAX_SIGNALS = 20

    // Dispara UN solo pulso hacia 1-2 vecinos cercanos — no explosión radial
    const fireNeuron = (idx) => {
      const n = neurons[idx]
      if (!n || n.activation > 0.3) return
      n.activation = 1
      if (signals.length >= MAX_SIGNALS) return

      const neighbors = []
      neurons.forEach((other, j) => {
        if (j === idx) return
        const dx = other.x - n.x, dy = other.y - n.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < CONNECT_DIST) neighbors.push({ j, d })
      })
      if (neighbors.length === 0) return

      // Propaga solo a 1 o 2 vecinos (no a todos) — crea cadena, no explosión
      neighbors.sort((a, b) => a.d - b.d)
      const count = Math.min(neighbors.length, 1 + (Math.random() < 0.35 ? 1 : 0))
      for (let k = 0; k < count; k++) {
        signals.push({
          from: idx, to: neighbors[k].j, progress: 0,
          speed: 0.004 + Math.random() * 0.003, fired: false,
        })
      }
    }

    const init = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const n = window.innerWidth < 640 ? 28 : 55
      neurons = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.5 + 1.0,
        hub: i % 10 === 0,
        phase: Math.random() * Math.PI * 2,
        activation: 0,
        fireTimer: Math.floor(Math.random() * 400) + 100,
      }))
      signals = []
    }
    init()
    window.addEventListener('resize', init)

    const onMove = e => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 } }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const draw = () => {
      t++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      /* ── conexiones / axones — siempre visibles como red de fondo ── */
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const a = neurons[i], b = neurons[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d > CONNECT_DIST) continue
          const prox = 1 - d / CONNECT_DIST
          const act = Math.max(a.activation, b.activation)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          // conexión siempre visible tenue + se ilumina cuando viaja un pulso
          ctx.strokeStyle = `rgba(200,85,20,${prox * 0.07 + act * 0.14})`
          ctx.lineWidth = 0.35 + act * 0.55
          ctx.stroke()
        }
      }

      /* ── pulsos viajando por las conexiones ── */
      const pendingFires = []
      signals = signals.filter(s => s.progress <= 1)
      signals.forEach(s => {
        s.progress += s.speed
        if (s.progress > 1) return
        if (s.progress > 0.9 && !s.fired) { s.fired = true; pendingFires.push(s.to) }
        const a = neurons[s.from], b = neurons[s.to]
        const sx = a.x + (b.x - a.x) * s.progress
        const sy = a.y + (b.y - a.y) * s.progress
        // pequeño punto de luz viajando por el axón
        ctx.beginPath()
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,200,100,${0.55 * (1 - s.progress * 0.3)})`
        ctx.fill()
      })
      pendingFires.forEach(idx => fireNeuron(idx))

      /* ── dibujar nodos neuronales ── */
      neurons.forEach((p, idx) => {
        p.activation = Math.max(0, p.activation - 0.008) // decae lento

        // disparo espontáneo poco frecuente
        p.fireTimer--
        if (p.fireTimer <= 0) {
          p.fireTimer = (p.hub ? 300 : 500) + Math.floor(Math.random() * 300)
          if (Math.random() < 0.30) fireNeuron(idx)
        }

        const act = p.activation
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.025 + p.phase)

        if (p.hub) {
          // soma hub: glow suave, sin explosión
          if (act > 0.05) {
            const gr = p.r * 2.5 + act * 8
            const go = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr)
            go.addColorStop(0, `rgba(232,97,26,${(0.10 + act * 0.18) * pulse})`)
            go.addColorStop(1, 'rgba(232,97,26,0)')
            ctx.beginPath(); ctx.arc(p.x, p.y, gr, 0, Math.PI * 2)
            ctx.fillStyle = go; ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 2 + act * 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(232,97,26,${0.22 + act * 0.20})`
          ctx.fill()
        } else {
          // neurona regular: punto pequeño, se ilumina al recibir señal
          if (act > 0.1) {
            const gr2 = p.r + act * 5
            const gn = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr2)
            gn.addColorStop(0, `rgba(255,160,60,${act * 0.20})`)
            gn.addColorStop(1, 'rgba(232,97,26,0)')
            ctx.beginPath(); ctx.arc(p.x, p.y, gr2, 0, Math.PI * 2)
            ctx.fillStyle = gn; ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r + act * 1.0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(220,220,220,${0.12 + act * 0.16})`
          ctx.fill()
        }

        /* mouse activa neuronas cercanas */
        const mdx = mouse.current.x - p.x, mdy = mouse.current.y - p.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < 90 && t % 25 === 0) fireNeuron(idx)

        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd > 0.5) { p.vx = (p.vx / spd) * 0.5; p.vy = (p.vy / spd) * 0.5 }
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    />
  )
}

/* ── Scroll-in hook ── */
function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return [ref, v]
}

/* ── Typewriter ── */
function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [pi, setPi] = useState(0)
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const p = phrases[pi]
    let t
    if (!del && ci < p.length)        { t = setTimeout(() => { setText(p.slice(0, ci + 1)); setCi(c => c + 1) }, 65) }
    else if (!del && ci === p.length) { t = setTimeout(() => setDel(true), 2400) }
    else if (del && ci > 0)           { t = setTimeout(() => { setText(p.slice(0, ci - 1)); setCi(c => c - 1) }, 32) }
    else                              { setDel(false); setPi(i => (i + 1) % phrases.length) }
    return () => clearTimeout(t)
  }, [ci, del, pi])
  return text
}

/* ── Data ── */
const STEPS = [
  { n: '01', Icon: Lightbulb,    title: 'Describí tu idea',        desc: 'Nombre, descripción y los roles que necesitás. Sin formularios largos.' },
  { n: '02', Icon: BrainCircuit, title: 'La IA arma el equipo',    desc: 'Analiza perfiles disponibles y elige los más compatibles.' },
  { n: '03', Icon: Users,        title: 'El equipo acepta',         desc: 'Cada talento recibe una invitación personalizada. Acepta y listo.' },
  { n: '04', Icon: Rocket,       title: 'Panel privado activo',     desc: 'Roadmap, ideas y asesor IA exclusivo para ejecutar en equipo.', highlight: true },
]

const PANEL_FEATURES = [
  { Icon: Map,            title: 'Hoja de Ruta IA',       desc: 'Fases, tareas y tiempos generados por Gemini específicos para tu proyecto.' },
  { Icon: Sparkles,       title: 'Ideas personalizadas',  desc: '6 ideas accionables clasificadas por impacto y esfuerzo.' },
  { Icon: BarChart2,      title: 'Métricas y riesgos',    desc: 'KPIs clave y riesgos identificados con estrategias incluidas.' },
  { Icon: MessageSquare,  title: 'Consultor IA 24/7',     desc: 'Responde con contexto total de tu proyecto en cualquier momento.' },
]

const ROLES_DATA = [
  { label: 'Visionario', tag: 'Tenés una idea',    desc: 'Describila y la IA construye tu equipo ideal en minutos. Primera idea gratis.', cta: 'Tengo una idea', path: '/registro?rol=visionario', accent: true },
  { label: 'Talento',    tag: 'Sos un profesional', desc: 'Cargá tus skills y recibí invitaciones a proyectos que matchean con tu perfil.', cta: 'Postúlate',       path: '/registro?rol=talento',    accent: false },
  { label: 'Inversor',   tag: 'Buscás proyectos',  desc: 'Explorá proyectos con equipos ya formados por IA. Contactá directo con el founder.', cta: 'Invertí en una idea', path: '/registro?rol=inversor', accent: false },
]

const ROLE_COLORS = {
  'Desarrollador Full Stack': { bg: 'rgba(232,97,26,.08)',  color: '#E8611A' },
  'Desarrollador Frontend':   { bg: 'rgba(59,130,246,.08)', color: '#2563eb' },
  'Desarrollador Backend':    { bg: 'rgba(139,92,246,.08)', color: '#7c3aed' },
  'UX/UI Designer':           { bg: 'rgba(236,72,153,.08)', color: '#be185d' },
  'Marketing Digital':        { bg: 'rgba(16,185,129,.08)', color: '#059669' },
  'Product Manager':          { bg: 'rgba(245,158,11,.08)', color: '#b45309' },
  'Data Scientist / IA':      { bg: 'rgba(99,102,241,.08)', color: '#4338ca' },
}

/* ═══════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const typed = useTypewriter(['el equipo ideal.', 'hace realidad tu idea.', 'tu próximo proyecto.'])
  const [talents, setTalents] = useState([])
  const [ideas,   setIdeas]   = useState([])
  const [stepsRef,  stepsVis]  = useInView(0.08)
  const [rolesRef,  rolesVis]  = useInView(0.08)
  const [panelRef,  panelVis]  = useInView(0.08)

  useEffect(() => {
    supabase.from('talent_profiles')
      .select('available, main_role, users(id, name, location, user_skills(skills(name)))')
      .eq('available', true).limit(18)
      .then(({ data }) => setTalents([...(data || [])].sort(() => Math.random() - 0.5).slice(0, 6)))
      .catch(() => {})

    supabase.from('ideas')
      .select('id, title, description, category, stage, idea_roles(role_name)')
      .eq('is_public', true).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setIdeas(data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="page-wrap">

      {/* ══ HERO ══ */}
      <div className="hero-section" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        {/* dark overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(135deg,rgba(0,0,0,.95) 0%,rgba(0,0,0,.82) 55%,rgba(0,0,0,.6) 100%)' }} />

        {/* ambient orange glow bottom-right */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,97,26,.18) 0%,transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        <ParticleCanvas />

        {/* content */}
        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', padding: 'clamp(84px,14vw,130px) clamp(20px,6vw,64px) clamp(32px,5vw,60px)' }}>
          <div style={{ maxWidth: 560, width: '100%' }}>

            {/* badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '6px 16px', marginBottom: 32, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', animation: 'fadeUp .6s ease both' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0 }} />
              Matching con IA para startups
            </div>

            {/* headline */}
            <h1 style={{ fontSize: 'clamp(50px,13vw,86px)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, lineHeight: 1.0, letterSpacing: '-1px', marginBottom: 20, color: '#fff', animation: 'fadeUp .6s ease .1s both' }}>
              Tu idea,
              <span style={{ display: 'block', minHeight: '2.2em', color: '#E8611A', lineHeight: 1.0, textShadow: '0 0 48px rgba(232,97,26,.4)' }}>
                {typed}<span style={{ animation: 'blink 1s infinite' }}>|</span>
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(15px,4vw,17px)', color: 'rgba(255,255,255,.48)', lineHeight: 1.75, marginBottom: 36, maxWidth: 400, animation: 'fadeUp .6s ease .2s both' }}>
              Describí tu proyecto y la IA encuentra las personas exactas para construirlo. Sin entrevistas, sin perder tiempo.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400, animation: 'fadeUp .6s ease .3s both' }}>
              <button className="btn-primary" onClick={() => navigate('/lanzar')}
                style={{ padding: '17px 24px', fontSize: 17, borderRadius: 12, width: '100%', boxShadow: '0 0 40px rgba(232,97,26,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Tengo una idea <ArrowRight size={18} />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ label: 'Postúlate', path: '/registro?rol=talento' }, { label: `${ideas.length || '–'} ideas activas`, path: '/proyectos' }].map(b => (
                  <button key={b.path} onClick={() => navigate(b.path)}
                    style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,.05)', color: '#888', fontFamily: 'Inter,sans-serif', transition: 'all .2s', backdropFilter: 'blur(6px)' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.09)'; e.currentTarget.style.color='#ccc'; e.currentTarget.style.borderColor='rgba(255,255,255,.22)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#888'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)' }}>
                    {b.label}
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/registro?rol=inversor')}
                style={{ padding: '14px 10px', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,.05)', color: '#888', fontFamily: 'Inter,sans-serif', transition: 'all .2s', backdropFilter: 'blur(6px)', width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.09)'; e.currentTarget.style.color='#ccc'; e.currentTarget.style.borderColor='rgba(255,255,255,.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#888'; e.currentTarget.style.borderColor='rgba(255,255,255,.1)' }}>
                Invertí en una idea
              </button>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(16px)', padding: 'clamp(16px,4vw,24px) clamp(20px,6vw,64px)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[{ value: 'Gratis', sub: 'para empezar' }, { value: '< 5 min', sub: 'matching con IA' }, { value: 'Latam', sub: 'comunidad activa' }].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ fontSize: 'clamp(13px,3.5vw,16px)', fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>{s.value}</div>
              <div style={{ fontSize: 'clamp(10px,2.5vw,12px)', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ CÓMO FUNCIONA ══ dark */}
      <div ref={stepsRef} style={{ padding: 'clamp(72px,12vw,108px) clamp(20px,6vw,40px)', background: '#0c0c0c', position: 'relative', overflow: 'hidden' }}>
        {/* bg glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(232,97,26,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(48px,8vw,72px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '3px', textTransform: 'uppercase' }}>Proceso</span>
            <h2 style={{ fontSize: 'clamp(28px,6vw,50px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 12, lineHeight: 1.1, color: '#fff' }}>
              De la idea al equipo<br />en minutos
            </h2>
          </div>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, position: 'relative' }}>
            {/* connector line */}
            <div style={{ position: 'absolute', top: 44, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,97,26,.35) 20%,rgba(232,97,26,.35) 80%,transparent)', zIndex: 0 }} />

            {STEPS.map(({ n, Icon, title, desc, highlight }, i) => (
              <div key={n} style={{
                padding: '0 14px', textAlign: 'center', position: 'relative', zIndex: 1,
                opacity: stepsVis ? 1 : 0,
                transform: stepsVis ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity .6s ease ${i * 0.14}s, transform .6s ease ${i * 0.14}s`,
              }}>
                {/* icon circle */}
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', margin: '0 auto 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: highlight
                    ? 'radial-gradient(circle,rgba(232,97,26,.3) 0%,rgba(232,97,26,.1) 100%)'
                    : 'rgba(255,255,255,.04)',
                  border: highlight ? '1px solid rgba(232,97,26,.5)' : '1px solid rgba(255,255,255,.09)',
                  boxShadow: highlight ? '0 0 40px rgba(232,97,26,.3), inset 0 0 20px rgba(232,97,26,.08)' : 'none',
                }}>
                  <Icon size={30} color={highlight ? '#E8611A' : 'rgba(255,255,255,0.7)'} strokeWidth={1.5} />
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 2, marginBottom: 10 }}>{n}</div>
                <div style={{ fontSize: 'clamp(13px,3vw,15px)', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{title}</div>
                {highlight && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: 'rgba(232,97,26,.18)', color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', display: 'inline-block', marginBottom: 8 }}>Exclusivo</span>}
                <div style={{ fontSize: 'clamp(11px,2.5vw,13px)', color: 'rgba(255,255,255,.38)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PANEL FEATURES ══ */}
      <div ref={panelRef} style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', background: '#f8f9fa', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginBottom: 'clamp(36px,7vw,52px)', opacity: panelVis ? 1 : 0, transform: panelVis ? 'none' : 'translateY(20px)', transition: 'all .6s ease' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase' }}>Solo para el equipo</span>
              <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10, lineHeight: 1.1 }}>Tu propio espacio<br />privado con IA</h2>
            </div>
            <p style={{ fontSize: 'clamp(13px,3.5vw,15px)', color: '#666', lineHeight: 1.75, maxWidth: 320, paddingTop: 8 }}>
              Cuando el equipo está formado, Equia les otorga automáticamente un panel exclusivo. Nadie de afuera puede verlo.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 1, border: '1px solid #e8e8e8', marginBottom: 40 }}>
            {PANEL_FEATURES.map(({ Icon, title, desc }, i) => (
              <div key={i} style={{ padding: 'clamp(22px,4vw,28px)', background: '#fff', borderRight: i % 2 === 0 ? '1px solid #e8e8e8' : 'none', opacity: panelVis ? 1 : 0, transform: panelVis ? 'none' : 'translateY(16px)', transition: `all .5s ease ${i * 0.1}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(232,97,26,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={20} color="#E8611A" strokeWidth={1.6} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-.3px', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* mockup */}
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '10px 16px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: .5 }} />)}
              </div>
              <div style={{ flex: 1, height: 22, background: '#f0f0f0', borderRadius: 4, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                <span style={{ fontSize: 11, color: '#888' }}>equia.app/panel/mi-proyecto</span>
              </div>
            </div>
            <div className="home-panel-mockup-grid" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 220 }}>
              <div className="home-panel-sidebar" style={{ borderRight: '1px solid #f0f0f0', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['Visión General','Hoja de Ruta','Ideas IA','Build Log','Equipo','Consultor IA'].map((item, i) => (
                  <div key={item} style={{ padding: '8px 10px', borderRadius: 6, background: i===0 ? 'rgba(232,97,26,.1)' : 'transparent', fontSize: 12, color: i===0 ? '#E8611A' : '#888', fontWeight: i===0 ? 700 : 400 }}>{item}</div>
                ))}
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Resumen estratégico</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[90,75,60,80].map((w, i) => <div key={i} style={{ height: 9, borderRadius: 99, background: '#f0f0f0', width: `${w}%` }} />)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                  {['Roadmap generado','6 ideas IA','Asesor activo'].map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A', border: '1px solid rgba(232,97,26,.15)', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ══ ROLES ══ */}
      <div ref={rolesRef} style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,7vw,56px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Para todos</span>
            <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10 }}>¿Quién sos en Equia?</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #e8e8e8' }}>
            {ROLES_DATA.map((r, i) => (
              <div key={r.label} style={{ padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,32px)', background: r.accent ? '#f5f5f5' : '#fff', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #e8e8e8', flexWrap: 'wrap', opacity: rolesVis ? 1 : 0, transform: rolesVis ? 'none' : 'translateX(-16px)', transition: `all .5s ease ${i * 0.12}s` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(15px,4vw,18px)', fontWeight: 900, letterSpacing: '-.5px' }}>{r.label}</span>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: r.accent ? 'rgba(232,97,26,.12)' : 'rgba(0,0,0,.05)', color: r.accent ? '#E8611A' : '#666', border: `1px solid ${r.accent ? 'rgba(232,97,26,.2)' : '#e8e8e8'}`, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.tag}</span>
                  </div>
                  <p style={{ fontSize: 'clamp(13px,3.5vw,14px)', color: '#666', lineHeight: 1.7 }}>{r.desc}</p>
                </div>
                <button onClick={() => navigate(r.path)}
                  style={{ padding: '12px 22px', fontSize: 14, fontWeight: 700, borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s', whiteSpace: 'nowrap', background: r.accent ? '#E8611A' : 'transparent', color: r.accent ? '#fff' : '#666', border: r.accent ? 'none' : '1px solid #d0d0d0', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => { if (!r.accent) { e.currentTarget.style.borderColor='#bbb'; e.currentTarget.style.color='#333' } }}
                  onMouseLeave={e => { if (!r.accent) { e.currentTarget.style.borderColor='#d0d0d0'; e.currentTarget.style.color='#666' } }}>
                  {r.cta} <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ IDEAS ACTIVAS — lista compacta ══ */}
      {ideas.length > 0 && (
        <div style={{ padding: 'clamp(40px,8vw,72px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8', background: '#f8f9fa' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={16} color="#E8611A" />
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.3px' }}>Ideas activas</span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A' }}>{ideas.length}</span>
              </div>
              <button onClick={() => navigate('/proyectos')}
                style={{ fontSize: 13, fontWeight: 600, color: '#E8611A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                Ver todas <ArrowRight size={13} />
              </button>
            </div>

            {/* filas */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              {ideas.map((idea, i) => {
                const roles = (idea.idea_roles || []).map(r => r.role_name).filter(Boolean)
                return (
                  <div key={idea.id} onClick={() => navigate(`/proyectos/${idea.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < ideas.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', transition: 'background .15s', minWidth: 0 }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                    {/* categoría dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8611A', flexShrink: 0, opacity: .7 }} />

                    {/* título + roles */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idea.title}</div>
                      {roles.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
                          {roles.slice(0, 2).map(r => (
                            <span key={r} style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: '#f0f0f0', color: '#666', whiteSpace: 'nowrap', flexShrink: 0 }}>{r}</span>
                          ))}
                          {roles.length > 2 && <span style={{ fontSize: 10, color: '#999', flexShrink: 0 }}>+{roles.length - 2}</span>}
                        </div>
                      )}
                    </div>

                    {/* etiquetas derecha */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {idea.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A', whiteSpace: 'nowrap' }}>{idea.category}</span>}
                      <ArrowRight size={14} color="#ccc" />
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

      {/* ══ TALENTOS — lista compacta ══ */}
      {talents.length > 0 && (
        <div style={{ padding: 'clamp(40px,8vw,72px) clamp(20px,6vw,32px)', borderTop: '1px solid #e8e8e8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={16} color="#666" />
                <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.3px' }}>Talentos disponibles</span>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#f0f0f0', color: '#666' }}>{talents.length}</span>
              </div>
              <button onClick={() => navigate('/explorar')}
                style={{ fontSize: 13, fontWeight: 600, color: '#E8611A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                Ver todos <ArrowRight size={13} />
              </button>
            </div>

            {/* filas */}
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              {talents.map((tp, i) => {
                const u = tp.users
                const skills = (u?.user_skills || []).map(us => us.skills?.name).filter(Boolean)
                const initials = u?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                const rc = ROLE_COLORS[tp.main_role] || { bg: '#f0f0f0', color: '#555' }
                return (
                  <div key={u?.id || i} onClick={() => navigate(`/talento/${u?.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < talents.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', transition: 'background .15s', minWidth: 0 }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                    {/* avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0, border: `1px solid ${rc.color}22` }}>{initials}</div>

                    {/* nombre + rol */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u?.name}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tp.main_role}</div>
                    </div>

                    {/* skills + disponible */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {skills.slice(0, 1).map(s => (
                        <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#f5f5f5', color: '#666', whiteSpace: 'nowrap' }}>{s}</span>
                      ))}
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                      <ArrowRight size={14} color="#ccc" />
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

      {/* ══ CTA FINAL ══ dark */}
      <div style={{ padding: 'clamp(72px,14vw,120px) clamp(20px,6vw,32px)', textAlign: 'center', background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(232,97,26,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#E8611A', border: '1px solid rgba(232,97,26,.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 28, background: 'rgba(232,97,26,.08)' }}>
            <Zap size={13} /> Panel IA incluido para cada equipo
          </div>
          <h2 style={{ fontSize: 'clamp(32px,8vw,60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 14, lineHeight: 1.05, color: '#fff' }}>
            Empezá hoy.<br />Es gratis.
          </h2>
          <p style={{ fontSize: 'clamp(14px,4vw,16px)', color: 'rgba(255,255,255,.42)', maxWidth: 360, margin: '0 auto 10px', lineHeight: 1.7 }}>
            Registrate, describí tu idea y la IA arma tu equipo ideal.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.22)', marginBottom: 36 }}>Sin tarjeta. Sin límite de tiempo.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/registro')}
              style={{ padding: '16px 44px', fontSize: 16, boxShadow: '0 0 40px rgba(232,97,26,.35)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Crear mi cuenta <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/explorar')}
              style={{ padding: '16px 28px', fontSize: 15, fontWeight: 600, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .2s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.24)'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; e.currentTarget.style.color='rgba(255,255,255,.6)' }}>
              Ver talentos →
            </button>
          </div>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: 'clamp(20px,5vw,28px) clamp(20px,6vw,32px)', background: '#0c0c0c' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <LogoEquia size={18} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.22)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Equipo argentino y EE.UU.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad','Términos','Contacto'].map(l => (
              <span key={l} style={{ fontSize: 12, color: 'rgba(255,255,255,.32)', cursor: 'pointer', transition: 'color .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color='rgba(255,255,255,.7)' }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,.32)' }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
