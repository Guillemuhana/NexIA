import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Zap, Users, Lightbulb, Rocket, Shield, CreditCard, BrainCircuit, ArrowRight } from 'lucide-react'

const SECTIONS = [
  {
    label: 'La plataforma',
    Icon: Lightbulb,
    faqs: [
      {
        q: '¿Qué es Equia?',
        a: 'Equia es una plataforma de matching con IA para startups latinoamericanas. Conecta a emprendedores con ideas con los talentos exactos que necesitan para construirlas — desarrolladores, diseñadores, marketers y más — en menos de 5 minutos.',
      },
      {
        q: '¿Para quién es Equia?',
        a: 'Para tres perfiles: Visionarios (tenés una idea y necesitás un equipo), Talentos (sos un profesional que quiere sumarse a proyectos), e Inversores (buscás proyectos con equipos ya formados para financiar). Cada uno tiene su propia experiencia dentro de la plataforma.',
      },
      {
        q: '¿En qué países está disponible?',
        a: 'Equia está pensada para Latinoamérica con foco inicial en Argentina, México, Colombia y Chile. También contamos con presencia en EE.UU. para conectar con la diáspora latina. Cualquier persona del mundo puede registrarse.',
      },
      {
        q: '¿Equia es una red social o un marketplace?',
        a: 'Ni una ni la otra. Equia es una plataforma de formación de equipos. No publicás tu CV para que cualquiera te contacte: la IA te invita activamente a proyectos que matchean con tu perfil. Y como Visionario, no buscás perfiles manualmente — la IA lo hace por vos.',
      },
    ],
  },
  {
    label: 'Cómo funciona',
    Icon: BrainCircuit,
    faqs: [
      {
        q: '¿Cómo funciona el matching con IA?',
        a: 'Cuando publicás una idea, la IA (impulsada por Gemini) analiza la descripción, los roles que necesitás y los perfiles disponibles en la plataforma. Evalúa compatibilidad de skills, disponibilidad y categoría del proyecto, y selecciona a los candidatos más adecuados. Luego les envía una invitación personalizada.',
      },
      {
        q: '¿Cuánto tarda en formarse el equipo?',
        a: 'El proceso de matching tarda menos de 5 minutos. Una vez que los talentos invitados aceptan la invitación, el equipo queda formado y se activa automáticamente el Panel Privado del proyecto.',
      },
      {
        q: '¿Puedo rechazar una invitación?',
        a: 'Sí. Como Talento, recibís una invitación con el contexto del proyecto y podés aceptar o rechazar sin ninguna consecuencia. Si rechazás, la IA puede proponer otro candidato al Visionario.',
      },
      {
        q: '¿Qué pasa si no hay talentos disponibles para mi proyecto?',
        a: 'La IA te lo comunica y tu idea queda en estado activo esperando que nuevos talentos se registren. También podés editar los roles requeridos para ampliar la búsqueda.',
      },
    ],
  },
  {
    label: 'El Panel Privado IA',
    Icon: Rocket,
    faqs: [
      {
        q: '¿Qué es el Panel Privado?',
        a: 'Es un espacio exclusivo que se activa automáticamente cuando el equipo está formado. Solo los miembros del equipo tienen acceso. Incluye: Hoja de Ruta generada por IA, 6 ideas accionables clasificadas por impacto, métricas y riesgos clave, y un Consultor IA disponible 24/7.',
      },
      {
        q: '¿Qué es el Consultor IA?',
        a: 'Es un asistente de IA entrenado con el contexto completo de tu proyecto — nombre, descripción, equipo, hoja de ruta. Podés preguntarle cualquier cosa: cómo validar tu idea, qué tecnología usar, cómo armar el pitch, estrategias de go-to-market, etc.',
      },
      {
        q: '¿La Hoja de Ruta se puede modificar?',
        a: 'La IA genera una hoja de ruta inicial con fases, tareas y tiempos estimados. Podés regenerarla en cualquier momento para obtener una versión actualizada según el avance del proyecto.',
      },
      {
        q: '¿Inversores pueden ver el Panel?',
        a: 'No. El Panel Privado es exclusivo del equipo. Los inversores tienen acceso a la información pública del proyecto (idea, equipo, etapa), pero nunca al contenido interno del Panel.',
      },
    ],
  },
  {
    label: 'Roles y perfiles',
    Icon: Users,
    faqs: [
      {
        q: '¿Qué es un Visionario?',
        a: 'Es quien tiene una idea y quiere construirla con un equipo. Publicás tu idea, describís qué roles necesitás, y la IA forma el equipo por vos. Tu primera idea es gratis.',
      },
      {
        q: '¿Qué es un Talento?',
        a: 'Es un profesional (desarrollador, diseñador, marketer, PM, etc.) que quiere sumarse a proyectos interesantes. Cargás tus skills, te marcás como disponible, y recibís invitaciones a proyectos que matchean con tu perfil. Vos decidís si aceptar o no.',
      },
      {
        q: '¿Qué es un Inversor?',
        a: 'Es alguien que quiere descubrir proyectos con equipos ya formados para financiarlos o mentorearlos. Explorás las ideas activas, ves el equipo y el estado del proyecto, y contactás directo con el founder.',
      },
      {
        q: '¿Puedo tener más de un rol?',
        a: 'Por ahora cada cuenta tiene un rol principal. Si sos developer pero también tenés una idea propia, podés registrar una cuenta como Talento y otra como Visionario. Próximamente habilitaremos perfiles multi-rol.',
      },
    ],
  },
  {
    label: 'Precios y plan gratuito',
    Icon: CreditCard,
    faqs: [
      {
        q: '¿Es gratis usar Equia?',
        a: 'Sí. Registrarte, publicar tu primera idea, recibir invitaciones como Talento y explorar proyectos como Inversor es completamente gratis. No necesitás tarjeta de crédito.',
      },
      {
        q: '¿Qué incluye el plan gratuito?',
        a: '1 idea activa como Visionario, acceso completo al Panel Privado con IA, invitaciones ilimitadas como Talento, y exploración de proyectos como Inversor. Sin límite de tiempo.',
      },
      {
        q: '¿Hay planes de pago?',
        a: 'Sí, están disponibles en la página de Precios. Los planes Pro permiten publicar múltiples ideas simultáneas, acceso a analytics avanzados y soporte prioritario.',
      },
    ],
  },
  {
    label: 'Privacidad y seguridad',
    Icon: Shield,
    faqs: [
      {
        q: '¿Mis datos están seguros?',
        a: 'Sí. Usamos Supabase como base de datos con políticas de seguridad por fila (RLS). Tu información solo es visible para vos y, en el caso de proyectos, para los miembros del equipo. Nunca vendemos datos a terceros.',
      },
      {
        q: '¿Quién puede ver mi perfil?',
        a: 'Tu perfil público (nombre, rol principal, skills) es visible para Visionarios que están buscando talento. Tu información de contacto y perfil completo solo se comparte cuando aceptás unirte a un equipo.',
      },
      {
        q: '¿Puedo eliminar mi cuenta?',
        a: 'Sí. Desde tu perfil podés solicitar la eliminación completa de tu cuenta y todos tus datos. El proceso tarda hasta 48 horas.',
      },
    ],
  },
]

function FAQItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      style={{ borderBottom: '1px solid #f0f0f0', overflow: 'hidden' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.4, flex: 1 }}>{q}</span>
        <ChevronDown
          size={18}
          color="#999"
          style={{ flexShrink: 0, transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div style={{
        maxHeight: open ? 400 : 0,
        overflow: 'hidden',
        transition: 'max-height .3s cubic-bezier(.4,0,.2,1)',
      }}>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)

  return (
    <div className="page-wrap" style={{ paddingTop: 64 }}>

      {/* ── Hero ── */}
      <div style={{ background: '#0c0c0c', padding: 'clamp(48px,10vw,88px) clamp(20px,6vw,32px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(232,97,26,.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#E8611A', border: '1px solid rgba(232,97,26,.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 20, background: 'rgba(232,97,26,.08)' }}>
            <Zap size={12} /> Preguntas frecuentes
          </div>
          <h1 style={{ fontSize: 'clamp(28px,7vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', color: '#fff', marginBottom: 14, lineHeight: 1.1 }}>
            Todo lo que necesitás<br />saber sobre Equia
          </h1>
          <p style={{ fontSize: 'clamp(14px,3.5vw,16px)', color: 'rgba(255,255,255,.45)', maxWidth: 480, margin: '0 auto' }}>
            Desde cómo funciona el matching con IA hasta qué incluye el Panel Privado. Cualquier duda, contactanos.
          </p>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="faq-grid" style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(40px,8vw,72px) clamp(20px,6vw,32px)', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 48, alignItems: 'start' }}>

        {/* Sidebar nav — desktop */}
        <div className="faq-sidebar" style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map(({ label, Icon }, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeSection === i ? 'rgba(232,97,26,.08)' : 'transparent',
                color: activeSection === i ? '#E8611A' : '#777',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: activeSection === i ? 700 : 500,
                textAlign: 'left', transition: 'all .15s',
              }}
              onMouseEnter={e => { if (activeSection !== i) e.currentTarget.style.color = '#333' }}
              onMouseLeave={e => { if (activeSection !== i) e.currentTarget.style.color = '#777' }}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>

        {/* FAQ content */}
        <div>
          {/* Mobile: tabs horizontales */}
          <div className="faq-tabs" style={{ display: 'none', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {SECTIONS.map(({ label }, i) => (
              <button key={i} onClick={() => setActiveSection(i)}
                style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid', borderColor: activeSection === i ? '#E8611A' : '#e0e0e0', background: activeSection === i ? 'rgba(232,97,26,.08)' : 'transparent', color: activeSection === i ? '#E8611A' : '#666', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}>
                {label}
              </button>
            ))}
          </div>

          {SECTIONS.map(({ label, Icon, faqs }, si) => (
            <div key={si} style={{ display: activeSection === si ? 'block' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,97,26,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#E8611A" strokeWidth={1.6} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.5px' }}>{label}</h2>
              </div>

              <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '0 20px', background: '#fff' }}>
                {faqs.map((item, fi) => (
                  <FAQItem key={fi} q={item.q} a={item.a} defaultOpen={fi === 0 && si === 0} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ borderTop: '1px solid #e8e8e8', background: '#f8f9fa', padding: 'clamp(48px,10vw,72px) clamp(20px,6vw,32px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px,5vw,34px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 10 }}>¿Quedó alguna duda?</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>Escribinos y te respondemos lo antes posible.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/registro')}
            style={{ padding: '13px 32px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Crear cuenta gratis <ArrowRight size={16} />
          </button>
          <a href="mailto:hola@equia.app"
            style={{ padding: '13px 28px', fontSize: 15, fontWeight: 600, border: '1px solid #d0d0d0', borderRadius: 10, color: '#555', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#bbb'; e.currentTarget.style.color='#111' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#d0d0d0'; e.currentTarget.style.color='#555' }}>
            Contactar →
          </a>
        </div>
      </div>

    </div>
  )
}
