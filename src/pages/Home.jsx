import { useNavigate } from 'react-router-dom'
import { CATEGORIES, TESTIMONIALS, MOCK_PROJECTS } from '../lib/constants'
import ProjectCard from '../components/ProjectCard'

const DW = 480, DH = 480, CX = 240, CY = 240

const NODES = [
  { icon: '</>', label: 'Desarrollador', sub: 'Frontend / Backend', x: CX,       y: 58        },
  { icon: '✦',   label: 'Diseñador',     sub: 'UI / UX',             x: 58,       y: CY        },
  { icon: '◈',   label: 'Marketing',     sub: 'Estrategia y crecimiento', x: DW-58, y: CY      },
  { icon: '◉',   label: 'IA Assistant',  sub: 'Match inteligente',   x: CX,       y: DH-58     },
]

function TeamDiagram() {
  return (
    <div style={{ position: 'relative', width: DW, height: DH, maxWidth: '100%' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${DW} ${DH}`}>
        <circle cx={CX} cy={CY} r={148} fill="none" stroke="#222" strokeWidth="1" strokeDasharray="5,12" />
        {NODES.map((n, i) => {
          const mx = (CX + n.x) / 2, my = (CY + n.y) / 2
          return (
            <g key={i}>
              <line x1={CX} y1={CY} x2={n.x} y2={n.y} stroke="#E8611A" strokeWidth="1.5" strokeDasharray="6,5" opacity="0.6" />
              <circle cx={mx} cy={my} r={3.5} fill="#E8611A" opacity="0.9" />
            </g>
          )
        })}
        {[[28,48],[452,32],[22,432],[456,445],[16,218],[464,262],[192,16],[242,464],[392,82],[82,372],[418,305],[58,148]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="#E8611A" opacity={0.25 + (i % 4) * 0.12} />
        ))}
      </svg>

      {/* Centro — Idea */}
      <div style={{
        position: 'absolute', left: CX, top: CY, transform: 'translate(-50%,-50%)',
        width: 112, height: 112, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 32%, #3d1800, #150800)',
        border: '2px solid #E8611A',
        boxShadow: '0 0 32px rgba(232,97,26,0.55), 0 0 64px rgba(232,97,26,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        zIndex: 2,
      }}>
        <span style={{ fontSize: 32 }}>💡</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Idea</span>
      </div>

      {/* Nodos */}
      {NODES.map((n, i) => (
        <div key={i} style={{
          position: 'absolute', left: n.x, top: n.y, transform: 'translate(-50%,-50%)',
          background: '#0d0d0d', border: '1px solid #282828', borderRadius: 14,
          padding: '11px 13px', textAlign: 'center', minWidth: 108, zIndex: 2,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: '#181818',
            border: '1px solid #333', margin: '0 auto 7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#E8611A',
          }}>{n.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#eee', marginBottom: 2 }}>{n.label}</div>
          <div style={{ fontSize: 10, color: '#555', lineHeight: 1.35 }}>{n.sub}</div>
        </div>
      ))}
    </div>
  )
}

const s = {
  sec: { padding: '80px 24px', borderTop: '1px solid #1a1a1a' },
  inner: { maxWidth: 1100, margin: '0 auto' },
  lbl: { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, display: 'block' },
  h2: { fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 },
  sub: { color: '#666', fontSize: 16, marginTop: 12, lineHeight: 1.6, maxWidth: 480 },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page-wrap">
      {/* HERO */}
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#000 url(/IMG03HERO.png) right center / 60% auto no-repeat',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ padding: '120px 60px 100px', width: '100%' }}>
          <div style={{ maxWidth: 480 }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: '#666', border: '1px solid #222', borderRadius: 100, padding: '5px 14px', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', display: 'inline-block' }} />
              847 proyectos activos — creando equipos ahora mismo
            </div>

            <h1 style={{ fontSize: 'clamp(40px,5.5vw,70px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 20 }}>
              Tu idea,<br />
              <span style={{ color: '#E8611A' }}>el equipo ideal.</span>
            </h1>

            <p style={{ fontSize: 'clamp(16px,1.8vw,20px)', fontWeight: 700, color: '#fff', lineHeight: 1.45, marginBottom: 14 }}>
              Decí qué querés crear.<br />Nosotros armamos tu equipo.
            </p>

            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 36 }}>
              Escribí tu idea y la IA encuentra las personas exactas para construirla.
              Sin entrevistas. Sin perder tiempo.
            </p>

            <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '16px 36px', fontSize: 17, borderRadius: 10, marginBottom: 12, display: 'block', width: '100%', maxWidth: 300 }}>
              Crear mi equipo →
            </button>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
              🛡 Sin registro • Gratis
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['👤 Tengo talento', '/explorar'], ['💼 Explorar proyectos', '/proyectos']].map(([label, path]) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ padding: '11px 18px', fontSize: 14, fontWeight: 600, border: '1px solid #252525', borderRadius: 8, cursor: 'pointer', background: '#0d0d0d', color: '#ccc', fontFamily: 'Inter, sans-serif', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#444'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#252525'}>
                  {label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* FEATURES STRIP */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '22px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {[
            { icon: '⚡', title: 'Rápido',      desc: 'Equipos en segundos' },
            { icon: '🧠', title: 'Inteligente', desc: 'Match con IA basada en habilidades' },
            { icon: '🛡', title: 'Confiable',   desc: 'Perfiles verificados y calificados' },
          ].map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(232,97,26,0.08)', border: '1px solid rgba(232,97,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{f.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[['SR','#1a3a5c'],['CM','#2d1a4a'],['VT','#1a4a2d'],['DF','#4a2d1a']].map(([init, bg], i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: bg, border: '2px solid #000', marginLeft: i === 0 ? 0 : -9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 4 - i }}>
                  {init}
                </div>
              ))}
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8611A', border: '2px solid #000', marginLeft: -9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>+843</div>
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.4 }}>personas creando<br />equipos ahora mismo</div>
          </div>
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
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
