import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

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

export default function Home() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const typed = useTypewriter(['el equipo ideal.', 'hace realidad tu idea.', 'encuentra tu equipo.'])

  return (
    <div className="page-wrap">

      {/* HERO */}
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        background: isMobile
          ? `linear-gradient(rgba(0,0,0,0.82),rgba(0,0,0,0.9)), url(/IMG03HERO.png) center/cover no-repeat`
          : `linear-gradient(to right, rgba(0,0,0,0.88) 38%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.05) 100%), url(/IMG03HERO.png) center/cover no-repeat`,
      }}>
        <div style={{ padding: isMobile ? '100px 24px 60px' : '120px 60px 100px', width: '100%' }}>
          <div style={{ maxWidth: 500 }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#666', border: '1px solid #222', borderRadius: 100, padding: '5px 14px', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              Plataforma de matching con IA para startups
            </div>

            <h1 style={{ fontSize: 'clamp(40px,5.5vw,70px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 20 }}>
              Tu idea,<br />
              <span style={{ color: '#E8611A' }}>{typed}</span>
              <span style={{ color: '#E8611A', animation: 'blink 1s infinite' }}>|</span>
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.8vw,18px)', color: '#888', lineHeight: 1.7, marginBottom: 40, maxWidth: 420 }}>
              Describí tu proyecto y la IA encuentra las personas exactas para construirlo. Sin entrevistas, sin perder tiempo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 300 }}>
              <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '16px 36px', fontSize: 17, borderRadius: 10, letterSpacing: '.5px' }}>
                Tengo una idea →
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => navigate('/registro?rol=talento')}
                  style={{ flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600, border: '1px solid #252525', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: '#888', fontFamily: 'Inter, sans-serif', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#252525'}>
                  Postúlate
                </button>
                <button onClick={() => navigate('/registro?rol=inversor')}
                  style={{ flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600, border: '1px solid #252525', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: '#888', fontFamily: 'Inter, sans-serif', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#252525'}>
                  Invertí en una idea
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{ padding: '80px 24px', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Proceso</span>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10 }}>De la idea al equipo<br />en minutos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {[
              ['01', '📝', 'Describí tu idea', 'Nombre, descripción y los roles que necesitás. Sin formularios largos.'],
              ['02', '🤖', 'La IA arma el equipo', 'Analiza perfiles disponibles y elige los más compatibles con tu proyecto.'],
              ['03', '🚀', 'A construir', 'Cada talento recibe una invitación. Acepta y arrancás. Así de simple.'],
            ].map(([n, icon, title, desc]) => (
              <div key={n} style={{ padding: '36px 28px', background: '#000' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 2, marginBottom: 20 }}>{n}</div>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-.3px' }}>{title}</div>
                <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROLES */}
      <div style={{ padding: '80px 24px', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Para todos</span>
            <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginTop: 10 }}>¿Quién sos en nexIA?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {[
              { icon: '💡', title: 'Visionario', desc: 'Tenés una idea. Describila y la IA construye tu equipo en minutos.', cta: 'Lanzar mi idea', path: '/registro?rol=visionario', accent: true },
              { icon: '⚡', title: 'Talento', desc: 'Cargá tus skills y recibí invitaciones a proyectos que matchean con tu perfil.', cta: 'Ofrecer mi talento', path: '/registro?rol=talento', accent: false },
              { icon: '💼', title: 'Inversor', desc: 'Explorá proyectos con equipos ya formados por IA. Contactá directo.', cta: 'Explorar proyectos', path: '/registro?rol=inversor', accent: false },
            ].map(r => (
              <div key={r.title} style={{ padding: '36px 28px', background: '#000', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{r.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.5px', marginBottom: 10 }}>{r.title}</div>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, flex: 1, marginBottom: 24 }}>{r.desc}</p>
                <button onClick={() => navigate(r.path)} style={{ padding: '11px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', background: r.accent ? '#E8611A' : 'transparent', color: r.accent ? '#fff' : '#666', border: r.accent ? 'none' : '1px solid #222', alignSelf: 'flex-start' }}>
                  {r.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '100px 24px', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
        <h2 style={{ fontSize: 'clamp(32px,7vw,60px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.05 }}>
          Empezá hoy.<br />Es gratis.
        </h2>
        <p style={{ fontSize: 16, color: '#666', maxWidth: 360, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Registrate, describí tu idea y la IA arma tu equipo.
        </p>
        <button className="btn-primary" onClick={() => navigate('/registro')} style={{ padding: '16px 44px', fontSize: 17 }}>
          Crear mi cuenta →
        </button>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1 }}>nex</span>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -1, color: '#E8611A' }}>IA</span>
          </div>
          <span style={{ fontSize: 13, color: '#444' }}>© 2026 nexIA · Hecho en Latinoamérica</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacidad', 'Términos', 'Contacto'].map(l => (
              <span key={l} style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
