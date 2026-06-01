import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PlanSuccess() {
  const navigate = useNavigate()
  const { user, fetchProfile, profile } = useAuth()
  const [refreshed, setRefreshed] = useState(false)
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    // Esperar 3s para que el webhook procese el pago y actualizar perfil
    const refreshTimer = setTimeout(async () => {
      try { await fetchProfile(user.id) } catch (_) {}
      setRefreshed(true)
    }, 3000)

    return () => clearTimeout(refreshTimer)
  }, [user])

  // Countdown para redirigir al dashboard
  useEffect(() => {
    if (!refreshed) return
    if (seconds <= 0) { navigate('/dashboard'); return }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [refreshed, seconds])

  const planName = profile?.plan === 'expert' ? 'Expert' : 'Pro'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 24 }}>
      <style>{`
        @keyframes successPop { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        {/* Ícono animado */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.08))', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', animation: 'successPop .5s cubic-bezier(.22,1,.36,1) both', fontSize: 36 }}>
          ✓
        </div>

        <div style={{ animation: 'fadeUp .4s .1s ease both' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
            Pago confirmado
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 10, color: '#0a0a0a' }}>
            Bienvenido al plan {planName} ⚡
          </h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Tu suscripción está activa. Ahora tenés acceso a todas las features del plan {planName} — ideas ilimitadas, matching IA prioritario y el Panel IA avanzado.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button
              onClick={() => navigate('/lanzar')}
              style={{ padding: '13px 28px', background: '#E8611A', border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#d4561a'}
              onMouseLeave={e => e.currentTarget.style.background = '#E8611A'}
            >
              Lanzar mi idea →
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '13px 22px', background: 'transparent', border: '1px solid #d0d0d0', borderRadius: 9, color: '#555', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}
            >
              Ir al Dashboard
            </button>
          </div>

          {refreshed && seconds > 0 && (
            <p style={{ fontSize: 12, color: '#bbb' }}>
              Redirigiendo al dashboard en {seconds}s...
            </p>
          )}
          {!refreshed && (
            <p style={{ fontSize: 12, color: '#bbb' }}>
              Actualizando tu plan...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
