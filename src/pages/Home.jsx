import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, TESTIMONIALS, MOCK_PROJECTS } from '../lib/constants'
import ProjectCard from '../components/ProjectCard'

function useTypewriter(phrases) {
  const [text, setText] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const phrase = phrases[phraseIdx]
    let t
    if (!deleting && charIdx < phrase.length) { t = setTimeout(() => { setText(phrase.slice(0, charIdx+1)); setCharIdx(c=>c+1) }, 70) }
    else if (!deleting && charIdx === phrase.length) { t = setTimeout(() => setDeleting(true), 2200) }
    else if (deleting && charIdx > 0) { t = setTimeout(() => { setText(phrase.slice(0, charIdx-1)); setCharIdx(c=>c-1) }, 35) }
    else { setDeleting(false); setPhraseIdx(i=>(i+1)%phrases.length) }
    return () => clearTimeout(t)
  }, [charIdx, deleting, phraseIdx])
  return text
}

const s = {
  sec: { padding: '80px 24px', borderTop: '1px solid #1a1a1a' },
  inner: { maxWidth: 1000, margin: '0 auto' },
  lbl: { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, display: 'block' },
  h2: { fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 },
  sub: { color: '#666', fontSize: 16, marginTop: 12, lineHeight: 1.6, maxWidth: 480 },
}

export default function Home() {
  const navigate = useNavigate()
  const typed = useTypewriter(['tu equipo perfecto.', 'tu startup.', 'algo grande.', 'el futuro.'])

  return (
    <div className="page-wrap">
      {/* HERO */}
      <div style={{ padding: '140px 24px 100px', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#666', border: '1px solid #222', borderRadius: 100, padding: '5px 14px', marginBottom: 36 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
          847 proyectos activos — sin entrevistas, sin procesos largos
        </div>

        <h1 style={{ fontSize: 'clamp(44px,11vw,90px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 28 }}>
          La IA construye<br />
          <span style={{ color: '#E8611A' }}>{typed}</span>
          <span style={{ animation: 'blink 1s infinite', color: '#E8611A' }}>|</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', color: '#666', lineHeight: 1.65, maxWidth: 540, marginBottom: 20 }}>
          Describí tu idea. La IA analiza miles de perfiles y construye el equipo perfecto para ejecutarla. <strong style={{ color: '#fff' }}>Sin entrevistas. Sin búsqueda manual.</strong>
        </p>
        <p style={{ fontSize: 15, color: '#444', lineHeight: 1.6, maxWidth: 480, marginBottom: 44 }}>
          Como LinkedIn, pero en lugar de buscar trabajo — formás un equipo para cambiar el mundo.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 80 }}>
          <button className="btn-primary" onClick={() => navigate('/registro')} style={{ padding: '15px 32px', fontSize: 16 }}>
            Lanzar mi idea →
          </button>
          <button className="btn-outline" onClick={() => navigate('/explorar')} style={{ padding: '15px 28px', fontSize: 16 }}>
            Ofrecer mi talento
          </button>
          <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '15px 28px', fontSize: 16 }}>
            Ver proyectos 💼
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1a1a', paddingTop: 40, flexWrap: 'wrap' }}>
          {[['1,240+','Talentos activos'],['350+','Equipos formados'],['92%','Match exitoso'],['48hs','Tiempo promedio']].map(([n,l],i) => (
            <div key={l} style={{ flex: 1, minWidth: 120, paddingRight: 32, marginRight: 32, borderRight: i<3 ? '1px solid #1a1a1a':'none', marginBottom: 16 }}>
              <div style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ROLES */}
      <div style={s.sec}>
        <div style={s.inner}>
          <div style={{ marginBottom: 52 }}>
            <span style={s.lbl}>Para todos</span>
            <h2 style={s.h2}>¿Quién sos en nexIA?</h2>
            <p style={s.sub}>Tres roles, un objetivo: formar el equipo perfecto y lograr algo grande.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {[
              { icon: '💡', title: 'Visionario', desc: 'Tenés una idea. Describila y la IA construye tu equipo ideal en minutos. Sin entrevistas, sin búsqueda manual.', cta: 'Lanzar mi idea', path: '/registro?rol=visionario', accent: true },
              { icon: '⚡', title: 'Talento', desc: 'Cargá tus habilidades y recibí invitaciones a proyectos que matchean con tu perfil. Vos elegís en qué trabajar.', cta: 'Ofrecer mi talento', path: '/registro?rol=talento', accent: false },
              { icon: '💼', title: 'Inversor', desc: 'Explorá proyectos con equipos ya formados por IA. Filtrá por categoría, etapa y tecnología. Contactá directo.', cta: 'Explorar proyectos', path: '/registro?rol=inversor', accent: false },
            ].map(r => (
              <div key={r.title} style={{ padding: '36px 28px', background: '#000', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{r.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.5px', marginBottom: 12 }}>{r.title}</div>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, flex: 1, marginBottom: 24 }}>{r.desc}</p>
                <button onClick={() => navigate(r.path)} style={{ padding: '11px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', background: r.accent ? '#E8611A' : 'transparent', color: r.accent ? '#fff' : '#666', border: r.accent ? 'none' : '1px solid #222', alignSelf: 'flex-start' }}>
                  {r.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={s.sec}>
        <div style={s.inner}>
          <div style={{ marginBottom: 52 }}>
            <span style={s.lbl}>Proceso</span>
            <h2 style={s.h2}>De la idea al equipo<br />en minutos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {[
              ['01','📝','Describí tu idea','Nombre, descripción, categoría y qué roles necesitás. Sin formularios largos.'],
              ['02','🤖','La IA analiza','Evalúa miles de perfiles y calcula compatibilidad técnica, de disponibilidad y de estilo de trabajo.'],
              ['03','👥','Te sugiere el equipo','Ves los perfiles elegidos con el porcentaje de match y por qué fueron seleccionados.'],
              ['04','📨','Invitaciones automáticas','Cada talento recibe una invitación personalizada. Acepta o rechaza con un click.'],
              ['05','🚀','A construir','El equipo está formado. Arranca el proyecto. Los inversores pueden verlo.'],
            ].map(([n,icon,title,desc]) => (
              <div key={n} style={{ padding: '32px 24px', background: '#000' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 2, marginBottom: 20 }}>{n}</div>
                <div style={{ fontSize: 24, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, letterSpacing: '-.3px' }}>{title}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROYECTOS DESTACADOS */}
      <div style={s.sec}>
        <div style={s.inner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={s.lbl}>Showcase</span>
              <h2 style={s.h2}>Proyectos activos</h2>
            </div>
            <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '10px 20px', fontSize: 14 }}>Ver todos →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {MOCK_PROJECTS.map(p => <ProjectCard key={p.id} project={p} showContact />)}
          </div>
        </div>
      </div>

      {/* CATEGORÍAS */}
      <div style={s.sec}>
        <div style={s.inner}>
          <div style={{ marginBottom: 48 }}>
            <span style={s.lbl}>Categorías</span>
            <h2 style={s.h2}>¿En qué industria<br />es tu idea?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {CATEGORIES.map(c => (
              <div key={c.label} onClick={() => navigate('/proyectos')} style={{ padding: '22px 18px', cursor: 'pointer', background: '#000', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0a0a0a'}
                onMouseLeave={e => e.currentTarget.style.background = '#000'}>
                <div style={{ fontSize: 20, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div style={s.sec}>
        <div style={s.inner}>
          <div style={{ marginBottom: 48 }}>
            <span style={s.lbl}>Comunidad</span>
            <h2 style={s.h2}>Lo que dicen</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 1, border: '1px solid #1a1a1a' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ padding: '26px 22px', background: '#000' }}>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: '#bbb', marginBottom: 18 }}>"{t.text}"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#666' }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '100px 24px', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
        <h2 style={{ fontSize: 'clamp(32px,8vw,68px)', fontWeight: 900, letterSpacing: '-2.5px', marginBottom: 18, lineHeight: 1.0 }}>
          Tu equipo perfecto<br />está en <span style={{ color: '#E8611A' }}>nexIA</span>
        </h2>
        <p style={{ fontSize: 18, color: '#666', maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Sin entrevistas. Sin meses de búsqueda. La IA lo resuelve en minutos.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/registro')} style={{ padding: '16px 40px', fontSize: 17 }}>Empezá gratis →</button>
          <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '16px 28px', fontSize: 17 }}>Ver proyectos</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '56px 24px 36px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -1 }}>nex</span>
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -1, color: '#E8611A' }}>IA</span>
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, maxWidth: 200 }}>Formá el equipo perfecto para tu idea con inteligencia artificial.</p>
            </div>
            {[
              ['Plataforma', ['Lanzar idea','Explorar talento','Ver proyectos','Cómo funciona']],
              ['Roles', ['Visionario','Talento','Inversor']],
              ['Empresa', ['Sobre nosotros','Contacto','Privacidad','Términos']],
            ].map(([title, links]) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
                {links.map(l => <div key={l} style={{ fontSize: 14, color: '#555', marginBottom: 9, cursor: 'pointer' }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 22, borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#444' }}>© 2026 nexIA. Todos los derechos reservados.</span>
            <span style={{ fontSize: 13, color: '#444' }}>Hecho con IA 🤖 & ❤️ en Latinoamérica</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
