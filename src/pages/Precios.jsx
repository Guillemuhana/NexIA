import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLevel } from '../lib/constants'
import { redirectToCheckout } from '../lib/stripe'

const PLANS_MONTHLY = [
  {
    id: 'gratis',
    name: 'Gratis',
    price: 0,
    priceLabel: '$0',
    per: '/mes',
    desc: 'Para explorar la plataforma y dar el primer paso.',
    perks: [
      '1 idea publicada con matching IA',
      'Explorar talentos disponibles',
      'Recibir invitaciones a proyectos',
      'Perfil público en el directorio',
      'Chat con todos los usuarios — gratis por tiempo limitado 🎉',
    ],
    cta: 'Empezar gratis',
    path: '/registro',
    accent: false,
    creditDiscount: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 11,
    priceLabel: '$11',
    per: '/mes',
    desc: 'Para founders que lanzan múltiples ideas y necesitan el mejor equipo.',
    perks: [
      'Todo lo del plan Gratis',
      'Ideas ilimitadas con matching IA garantizado',
      'Invitaciones automáticas al equipo',
      'Idea pública o privada',
      'Análisis completo de viabilidad',
      'Panel IA avanzado por proyecto',
      'Prioridad en el matching',
    ],
    cta: 'Empezar Pro',
    path: '/registro?plan=pro',
    accent: true,
    creditDiscount: 2,
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 16,
    priceLabel: '$16',
    per: '/mes',
    desc: 'Para equipos y talentos que quieren máxima visibilidad y conexiones.',
    perks: [
      'Todo lo del plan Pro',
      'Máxima visibilidad en matching IA',
      'Badge Expert en el perfil',
      'Acceso prioritario a nuevos proyectos',
      'Soporte directo por email',
      'Estadísticas de perfil avanzadas',
    ],
    cta: 'Empezar Expert',
    path: '/registro?plan=expert',
    accent: false,
    creditDiscount: 3,
  },
]

const CREDIT_DISCOUNTS = [
  { level: 'Starter',  range: '0–149',  monthly: '$0',   annual: '$0'   },
  { level: 'Builder',  range: '150–399', monthly: '$1/mes', annual: '$10/año' },
  { level: 'Pro',      range: '400–749', monthly: '$2/mes', annual: '$20/año' },
  { level: 'Expert',   range: '750+',    monthly: '$3/mes', annual: '$30/año' },
]

export default function Precios() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [annual, setAnnual] = useState(false)

  const getDisplayPrice = (plan) => {
    if (plan.price === 0) return { label: '$0', per: '/mes' }
    if (annual) {
      const yearlyTotal = plan.price * 10
      const monthly = (yearlyTotal / 12).toFixed(0)
      return { label: `$${monthly}`, per: '/mes', badge: '2 meses gratis', yearly: `$${yearlyTotal}/año` }
    }
    return { label: plan.priceLabel, per: '/mes' }
  }

  const userLevel = profile ? getLevel(profile.credits ?? 0) : null
  const userDiscount = userLevel ? CREDIT_DISCOUNTS.find(d => d.level === userLevel.name) : null
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')

  const handlePlanCTA = async (plan) => {
    if (plan.id === 'gratis') { navigate(plan.path); return }
    if (!user) { navigate(`/registro?plan=${plan.id}`); return }
    setCheckoutLoading(plan.id)
    setCheckoutError('')
    try {
      await redirectToCheckout(plan.id, user.id, profile?.email || user.email)
    } catch (err) {
      setCheckoutError(err.message || 'Error al iniciar el pago.')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Precios</span>
          <h1 style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, letterSpacing: '-2px', marginTop: 12, marginBottom: 14 }}>
            Simple y transparente
          </h1>
          <p style={{ fontSize: 16, color: '#666', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Empezá gratis. Escalá cuando lo necesites. Usá tus créditos para pagar menos.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 36 }}>
          <span style={{ fontSize: 14, fontWeight: annual ? 400 : 700, color: annual ? '#666' : '#0a0a0a' }}>Mensual</span>
          <button
            onClick={() => setAnnual(a => !a)}
            style={{
              width: 46, height: 26, borderRadius: 99,
              background: annual ? '#E8611A' : '#d0d0d0',
              border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: annual ? 23 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: annual ? 700 : 400, color: annual ? '#0a0a0a' : '#666' }}>
            Anual
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,.1)', padding: '2px 8px', borderRadius: 99 }}>
              2 meses gratis
            </span>
          </span>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, border: '1px solid #e8e8e8' }}>
          {PLANS_MONTHLY.map(plan => {
            const display = getDisplayPrice(plan)
            return (
              <div key={plan.id} style={{
                padding: '36px 28px', background: plan.accent ? '#f5f5f5' : '#ffffff',
                display: 'flex', flexDirection: 'column',
                borderLeft: plan.accent ? '1px solid #E8611A' : 'none',
                borderRight: plan.accent ? '1px solid #E8611A' : 'none',
                position: 'relative',
              }}>
                {plan.accent && (
                  <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#E8611A', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '4px 12px', borderRadius: '0 0 6px 6px', textTransform: 'uppercase' }}>
                    Más popular
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>{plan.name}</div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: plan.accent ? '#E8611A' : '#0a0a0a' }}>{display.label}</span>
                  <span style={{ fontSize: 13, color: '#666', marginBottom: 9 }}>{display.per}</span>
                  {display.badge && (
                    <span style={{ marginBottom: 9, fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,.1)', padding: '2px 7px', borderRadius: 99 }}>{display.badge}</span>
                  )}
                </div>

                {display.yearly && (
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Facturado como {display.yearly}</div>
                )}

                {/* Credit discount badge */}
                {plan.creditDiscount && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#E8611A', background: 'rgba(232,97,26,.07)', border: '1px solid rgba(232,97,26,.18)', borderRadius: 99, padding: '3px 10px', marginBottom: 10, width: 'fit-content' }}>
                    <span>⚡</span>
                    <span>Hasta ${plan.creditDiscount}/mes con créditos</span>
                  </div>
                )}

                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 28 }}>{plan.desc}</p>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  {plan.perks.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <span style={{ color: '#22c55e', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanCTA(plan)}
                  disabled={checkoutLoading === plan.id}
                  style={{
                    padding: '13px 20px', fontSize: 14, fontWeight: 700,
                    borderRadius: 8, cursor: checkoutLoading === plan.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    background: plan.accent ? '#E8611A' : 'transparent',
                    color: plan.accent ? '#fff' : '#666',
                    border: plan.accent ? 'none' : '1px solid #d0d0d0',
                    transition: 'all .15s',
                    opacity: checkoutLoading === plan.id ? 0.7 : 1,
                  }}
                >
                  {checkoutLoading === plan.id ? 'Redirigiendo...' : `${plan.cta} →`}
                </button>
              </div>
            )
          })}
        </div>

        {checkoutError && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, color: '#ef4444', fontSize: 13, textAlign: 'center' }}>
            {checkoutError}
          </div>
        )}

        {/* Credits discount section */}
        <div style={{ marginTop: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 10 }}>
              ⚡ Tus créditos valen plata
            </h2>
            <p style={{ fontSize: 15, color: '#666', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
              Cuanto más usás Equia y más completo es tu perfil, más créditos acumulás — y podés usarlos para pagar tu suscripción.
            </p>
          </div>

          {/* User's current discount highlight */}
          {userDiscount && profile && (
            <div style={{ padding: '16px 22px', background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>
                  Tu nivel actual: <span style={{ color: '#E8611A' }}>{userLevel.name}</span> ({profile.credits ?? 0} créditos)
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {userLevel.name === 'Starter'
                    ? 'Completá tu perfil para desbloquear descuentos en suscripciones.'
                    : `Tenés un descuento de ${userDiscount.monthly} en planes Pro y Expert.`}
                </div>
              </div>
              {userLevel.name !== 'Starter' && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 99, padding: '4px 12px', whiteSpace: 'nowrap' }}>
                  DESCUENTO ACTIVO
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 1, border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
            {CREDIT_DISCOUNTS.map(({ level, range, monthly, annual: annualDiscount }) => {
              const isUser = userLevel?.name === level
              return (
                <div key={level} style={{ padding: '22px 20px', background: isUser ? 'rgba(232,97,26,.04)' : '#fff', borderLeft: isUser ? '2px solid #E8611A' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: isUser ? '#E8611A' : '#0a0a0a', textTransform: 'uppercase' }}>{level}</span>
                    {isUser && <span style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', background: 'rgba(232,97,26,.1)', padding: '2px 7px', borderRadius: 99 }}>VOS</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{range} créditos</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: monthly === '$0' ? '#888' : '#22c55e', marginBottom: 4 }}>
                    {monthly === '$0' ? 'Sin descuento' : `${monthly} de descuento`}
                  </div>
                  {annualDiscount !== '$0' && (
                    <div style={{ fontSize: 12, color: '#666' }}>{annualDiscount} en plan anual</div>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 12, textAlign: 'center' }}>
            Los descuentos se aplican automáticamente al momento de suscribirte según tu nivel de créditos.
          </p>
        </div>

        {/* Banner chat gratis por tiempo limitado */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px',
          background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.2)',
          borderRadius: 12, marginTop: 48, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>
              Chat disponible para todos — por tiempo limitado
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
              Durante el lanzamiento de Equia, todos los usuarios pueden mensajearse libremente.
              Próximamente estará disponible solo para suscriptores o usuarios con equipo formado.
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', background: 'rgba(232,97,26,.1)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 99, padding: '4px 12px', whiteSpace: 'nowrap' }}>
            BETA GRATIS
          </span>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 80 }}>
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 36, textAlign: 'center' }}>Preguntas frecuentes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 1, border: '1px solid #e8e8e8' }}>
            {[
              ['¿Qué incluye la primera idea gratis?', 'El matching completo con IA, sugerencia de equipo ideal y envío de invitaciones automáticas. Todo. Sin costo.'],
              ['¿Cómo uso mis créditos para pagar?', 'Al suscribirte, el sistema detecta tu nivel de créditos y aplica el descuento automáticamente. No necesitás hacer nada.'],
              ['¿Puedo hacer mi idea privada?', 'Sí. Al publicar una idea podés elegir si es pública (visible a inversores) o privada (solo vos y tu equipo la ven).'],
              ['¿Los créditos vencen?', 'No. Los créditos son acumulativos y no tienen fecha de vencimiento. Seguirán sumando descuento indefinidamente.'],
              ['¿Qué pasa si el equipo no acepta?', 'Si ningún talento acepta tu invitación en 30 días, te devolvemos el pago. Equipo garantizado.'],
              ['¿Puedo cancelar en cualquier momento?', 'Sí. Sin cargos por cancelación. Tu plan baja a Gratis al vencimiento del periodo ya pago.'],
            ].map(([q, a]) => (
              <div key={q} style={{ padding: '28px 24px', background: '#ffffff' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#0a0a0a' }}>{q}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
