import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { redirectToCheckout } from '../lib/stripe'

export default function PaywallModal({ onClose, onConfirm, title, description, perks = [], loading = false, plan = 'pro' }) {
  const { user, profile } = useAuth()
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState('')

  const planLabel = plan === 'expert' ? 'Expert' : 'Pro'
  const planPrice = plan === 'expert' ? '$16' : '$11'

  const handleStripe = async () => {
    if (!user) return
    setStripeLoading(true)
    setStripeError('')
    try {
      await redirectToCheckout(plan, user.id, profile?.email || user.email)
    } catch (err) {
      setStripeError(err.message || 'Error al iniciar el pago. Intentá de nuevo.')
      setStripeLoading(false)
    }
  }

  const isLoading = loading || stripeLoading

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: '100%',
        background: '#0a0a0a', border: '1px solid #E8611A',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 0 80px rgba(232,97,26,0.12)',
        animation: 'zapIn .4s cubic-bezier(.22,1,.36,1) both',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
          ⚡ Plan {planLabel}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', marginBottom: 10, color: '#fff' }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>

        {perks.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: '#ccc' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '16px 20px', background: '#000', border: '1px solid #1a1a1a', borderRadius: 10, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>Plan {planLabel}</div>
            <div style={{ fontSize: 11, color: '#444' }}>Suscripción mensual · Cancelable cuando quieras</div>
          </div>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#E8611A', letterSpacing: '-1px' }}>{planPrice}<span style={{ fontSize: 13, color: '#555', fontWeight: 400 }}>/mes</span></span>
        </div>

        {stripeError && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {stripeError}
          </div>
        )}

        <button
          onClick={handleStripe}
          disabled={isLoading}
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: isLoading ? '#333' : '#E8611A', color: isLoading ? '#666' : '#fff', border: 'none', borderRadius: 9, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 10, transition: 'all .2s' }}
        >
          {isLoading ? 'Redirigiendo a Stripe...' : `Suscribirse al plan ${planLabel} →`}
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#333', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span>🔒</span> Pago seguro con Stripe · TLS 256-bit
        </div>

        <button
          onClick={onClose}
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', fontSize: 14, background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
