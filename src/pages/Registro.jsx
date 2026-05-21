import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'
import LogoEquia from '../components/LogoEquia'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Registro() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(searchParams.get('rol') || '')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { if (!authLoading && user) navigate('/dashboard', { replace: true }) }, [user, authLoading])

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('Completá todos los campos'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    // Guardar rol antes del signup para que onAuthStateChange lo aplique con sesión activa
    if (selectedRole) localStorage.setItem('nexia_pending_role', selectedRole)
    try {
      const { data, error: err } = await signUp({ email: form.email, password: form.password, name: form.name })
      if (err) {
        localStorage.removeItem('nexia_pending_role')
        setError(err.message)
        return
      }
      navigate('/onboarding')
    } catch {
      localStorage.removeItem('nexia_pending_role')
      setError('Error al crear la cuenta. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!selectedRole) return
    await signInWithGoogle(selectedRole)
    // Redirects to Google → comes back to /auth/callback
  }

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '80px 20px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <LogoEquia size={28} onClick={() => navigate('/')} style={{ marginBottom: 44 }} />

        {/* ── PASO 1 — Elegir rol ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>¿Quién sos?</h1>
            <p style={{ color: '#555', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Elegí tu rol para personalizar tu experiencia.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {Object.values(ROLES).map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px',
                  background: selectedRole === role.id ? 'rgba(232,97,26,.08)' : '#0a0a0a',
                  border: `1px solid ${selectedRole === role.id ? '#E8611A' : '#222'}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: selectedRole === role.id ? '#E8611A' : '#fff', marginBottom: 3 }}>{role.label}</div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{role.desc}</div>
                  </div>
                  {selectedRole === role.id && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</div>
                  )}
                </button>
              ))}
            </div>

            {/* Google — disponible al seleccionar rol */}
            <button
              onClick={handleGoogle}
              disabled={!selectedRole}
              style={{
                width: '100%', padding: '13px', marginBottom: 12,
                background: selectedRole ? '#fff' : '#111',
                border: selectedRole ? 'none' : '1px solid #222',
                borderRadius: 10, cursor: selectedRole ? 'pointer' : 'not-allowed',
                fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600,
                color: selectedRole ? '#111' : '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all .2s', opacity: selectedRole ? 1 : 0.4,
              }}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
              <span style={{ fontSize: 12, color: '#333' }}>o con email</span>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            </div>

            <button
              className="btn-primary"
              onClick={() => selectedRole && setStep(2)}
              style={{ width: '100%', padding: 13, fontSize: 15, opacity: selectedRole ? 1 : 0.4 }}
            >
              Registrarme con email →
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#555' }}>
              ¿Ya tenés cuenta?{' '}
              <span onClick={() => navigate('/login')} style={{ color: '#E8611A', cursor: 'pointer', fontWeight: 600 }}>Ingresá</span>
            </p>
          </>
        )}

        {/* ── PASO 2 — Datos con email ── */}
        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, marginBottom: 24, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
              ← Volver
            </button>

            <span className={`role-badge role-${selectedRole}`} style={{ marginBottom: 20, display: 'inline-flex' }}>
              {ROLES[selectedRole]?.icon} {ROLES[selectedRole]?.label}
            </span>

            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Creá tu cuenta</h1>
            <p style={{ color: '#555', fontSize: 15, marginBottom: 28 }}>Solo lleva 30 segundos.</p>

            {/* Google también en step 2 */}
            <button
              onClick={handleGoogle}
              style={{
                width: '100%', padding: '13px', marginBottom: 18,
                background: '#fff', border: 'none', borderRadius: 10,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                fontSize: 15, fontWeight: 600, color: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
              <span style={{ fontSize: 12, color: '#333' }}>o con email</span>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Nombre completo', 'name', 'text', 'Ej: Martina García'],
                ['Email', 'email', 'email', 'tu@email.com'],
                ['Contraseña', 'password', 'password', 'Mínimo 6 caracteres']].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input type={type} value={form[key]} onChange={upd(key)} placeholder={ph} className="input" />
                </div>
              ))}

              {error && (
                <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: 14, fontSize: 15, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#333', lineHeight: 1.6 }}>
                Al registrarte aceptás nuestros <span style={{ color: '#E8611A', cursor: 'pointer' }}>términos</span> y <span style={{ color: '#E8611A', cursor: 'pointer' }}>política de privacidad</span>.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
