import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

const STEPS = [
  { n: '01', title: 'Describí tu idea', desc: 'Nombre, descripción y los roles que necesitás. Sin formularios largos.' },
  { n: '02', title: 'La IA arma el equipo', desc: 'Analiza perfiles disponibles y elige los más compatibles con tu proyecto.' },
  { n: '03', title: 'A construir', desc: 'Cada talento recibe una invitación. Acepta y arrancás. Así de simple.' },
]

const ROLES_DATA = [
  { label: 'Visionario', tag: 'Tenés una idea', desc: 'Describila y la IA construye tu equipo ideal en minutos. Primera idea gratis.', cta: 'Tengo una idea', path: '/registro?rol=visionario', accent: true },
  { label: 'Talento', tag: 'Sos un profesional', desc: 'Cargá tus skills y recibí invitaciones a proyectos que matchean con tu perfil.', cta: 'Postúlate', path: '/registro?rol=talento', accent: false },
  { label: 'Inversor', tag: 'Buscás proyectos', desc: 'Explorá proyectos con equipos ya formados por IA. Contactá directo con el founder.', cta: 'Invertí en una idea', path: '/registro?rol=inversor', accent: false },
]

export default function Home() {
  const navigate = useNavigate()
  const typed = useTypewriter(['el equipo ideal.', 'hace realidad tu idea.', 'encuentra tu equipo.'])

  return (
    <div className="page-wrap">

      {/* ── HERO ── */}
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: `url(/IMG03HERO.png) center/cover no-repeat`,
        position: 'relative',
      }}>
        {/* Overlay adaptivo */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0.60) 100%)',
        }} />

        {/* Contenido principal */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(84px,14vw,130px) clamp(20px,6vw,64px) clamp(32px,5vw,60px)',
        }}>
          <div style={{ maxWidth: 520, width: '100%' }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 600, color: '#666',
              border: '1px solid #1e1e1e', borderRadius: 100,
              padding: '6px 14px', marginBottom: 28,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block', flexShrink: 0 }} />
              Matching con IA para startups
            </div>

            {/* Título — minHeight en el span evita layout shift durante la animación */}
            <h1 style={{
              fontSize: 'clamp(44px, 11vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: '-2.5px',
              marginBottom: 20,
            }}>
              Tu idea,
              <span style={{
                display: 'block',
                minHeight: '2.2em',
                color: '#E8611A',
                lineHeight: 1.0,
              }}>
                {typed}<span style={{ animation: 'blink 1s infinite' }}>|</span>
              </span>
            </h1>

            {/* Descripción */}
            <p style={{
              fontSize: 'clamp(15px, 4vw, 17px)',
              color: '#888',
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 400,
            }}>
              Describí tu proyecto y la IA encuentra las personas exactas para construirlo. Sin entrevistas, sin perder tiempo.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/lanzar')}
                style={{ padding: '17px 24px', fontSize: 17, borderRadius: 12, letterSpacing: '.2px', width: '100%' }}
              >
                Tengo una idea →
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Postúlate', path: '/registro?rol=talento' },
                  { label: 'Invertí en una idea', path: '/registro?rol=inversor' },
                ].map(b => (
                  <button
                    key={b.path}
                    onClick={() => navigate(b.path)}
                    style={{
                      padding: '14px 10px', fontSize: 13, fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                      cursor: 'pointer', background: 'rgba(255,255,255,0.04)',
                      color: '#888', fontFamily: 'Inter, sans-serif',
                      transition: 'all .2s', backdropFilter: 'blur(4px)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Tira de confianza — anclada al fondo del hero */}
        <div style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
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
              <div style={{ fontSize: 'clamp(10px,2.5vw,12px)', color: '#444', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <div style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,7vw,56px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '2px', textTransform: 'uppercase' }}>Proceso</span>
            <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10, lineHeight: 1.1 }}>
              De la idea al equipo<br />en minutos
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #1a1a1a' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: 'clamp(22px,5vw,32px) clamp(20px,5vw,32px)', background: '#000', borderBottom: i < STEPS.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 2, flexShrink: 0, paddingTop: 2, minWidth: 28 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 'clamp(15px,4vw,17px)', fontWeight: 800, marginBottom: 6, letterSpacing: '-.3px' }}>{s.title}</div>
                  <div style={{ fontSize: 'clamp(13px,3.5vw,14px)', color: '#555', lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── ROLES ── */}
      <div style={{ padding: 'clamp(56px,10vw,96px) clamp(20px,6vw,32px)', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px,7vw,56px)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '2px', textTransform: 'uppercase' }}>Para todos</span>
            <h2 style={{ fontSize: 'clamp(26px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10 }}>¿Quién sos en nexIA?</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid #1a1a1a' }}>
            {ROLES_DATA.map(r => (
              <div key={r.label} style={{ padding: 'clamp(24px,5vw,36px) clamp(20px,5vw,32px)', background: r.accent ? '#050505' : '#000', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'clamp(16px,4vw,18px)', fontWeight: 900, letterSpacing: '-.5px' }}>{r.label}</span>
                    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: r.accent ? 'rgba(232,97,26,.12)' : 'rgba(255,255,255,.05)', color: r.accent ? '#E8611A' : '#555', border: `1px solid ${r.accent ? 'rgba(232,97,26,.2)' : '#1a1a1a'}`, fontWeight: 600 }}>
                      {r.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 'clamp(13px,3.5vw,14px)', color: '#555', lineHeight: 1.7 }}>{r.desc}</p>
                </div>
                <button
                  onClick={() => navigate(r.path)}
                  style={{
                    padding: '12px 22px', fontSize: 14, fontWeight: 700,
                    borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all .15s', whiteSpace: 'nowrap',
                    background: r.accent ? '#E8611A' : 'transparent',
                    color: r.accent ? '#fff' : '#555',
                    border: r.accent ? 'none' : '1px solid #222',
                  }}
                  onMouseEnter={e => { if (!r.accent) { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#ccc' } }}
                  onMouseLeave={e => { if (!r.accent) { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#555' } }}
                >
                  {r.cta} →
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ padding: 'clamp(72px,14vw,120px) clamp(20px,6vw,32px)', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
        <h2 style={{ fontSize: 'clamp(32px,8vw,60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 14, lineHeight: 1.05 }}>
          Empezá hoy.<br />Es gratis.
        </h2>
        <p style={{ fontSize: 'clamp(14px,4vw,16px)', color: '#555', maxWidth: 320, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Registrate, describí tu idea y la IA arma tu equipo ideal.
        </p>
        <button className="btn-primary" onClick={() => navigate('/registro')} style={{ padding: '16px 44px', fontSize: 16 }}>
          Crear mi cuenta →
        </button>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: 'clamp(20px,5vw,28px) clamp(20px,6vw,32px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1 }}>nex</span>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1, color: '#E8611A' }}>IA</span>
          </div>
          <span style={{ fontSize: 12, color: '#333' }}>© 2026 nexIA · Hecho en Latinoamérica</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Términos', 'Contacto'].map(l => (
              <span key={l} style={{ fontSize: 12, color: '#444', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
