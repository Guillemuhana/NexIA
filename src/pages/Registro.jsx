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
  const [selectedRole, setSelectedRole] = useState(searchParams.get('rol') || '')
  const [refCode, setRefCode] = useState(searchParams.get('ref') || '')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRefField, setShowRefField] = useState(!!searchParams.get('ref'))
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const hasRef = !!searchParams.get('ref')
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { if (!authLoading && user) navigate('/dashboard', { replace: true }) }, [user, authLoading])

  const handleRegister = async () => {
    if (!hasRef && !selectedRole) { setError('Elegí tu rol para continuar'); return }
    if (!form.name || !form.email || !form.password) { setError('Completá nombre, email y contraseña'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    if (selectedRole) localStorage.setItem('nexia_pending_role', selectedRole)
    if (refCode.trim()) localStorage.setItem('nexia_pending_ref', refCode.trim().toUpperCase())
    try {
      const { data, error: err } = await signUp({ email: form.email, password: form.password, name: form.name, pendingRef: refCode.trim().toUpperCase() || undefined })
      if (err) {
        localStorage.removeItem('nexia_pending_role')
        localStorage.removeItem('nexia_pending_ref')
        const msg = err.message?.toLowerCase()
        if (msg?.includes('already registered') || msg?.includes('already exists')) {
          setError('Ya existe una cuenta con ese email. ¿Querés ingresar?')
        } else {
          setError(err.message)
        }
        return
      }
      navigate('/onboarding')
    } catch {
      localStorage.removeItem('nexia_pending_role')
      localStorage.removeItem('nexia_pending_ref')
      setError('Error al crear la cuenta. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    if (!hasRef && !selectedRole) { setError('Elegí tu rol primero'); return }
    setError('')
    if (refCode.trim()) localStorage.setItem('nexia_pending_ref', refCode.trim().toUpperCase())
    await signInWithGoogle(selectedRole || null)
  }

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '80px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <LogoEquia size={26} onClick={() => navigate('/')} style={{ marginBottom: 36 }} />

        {hasRef && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(232,97,26,.07)', border: '1px solid rgba(232,97,26,.2)', borderRadius: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>👋</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E8611A' }}>Te invitaron a Equia</div>
              <div style={{ fontSize: 12, color: '#888' }}>Creá tu cuenta y sumás <strong style={{ color: '#E8611A' }}>+50 créditos</strong> gratis al entrar.</div>
            </div>
          </div>
        )}

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1.2px', marginBottom: 4 }}>Creá tu cuenta</h1>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Gratis. Solo lleva 30 segundos.{' '}
          <span onClick={() => navigate('/login')} style={{ color: '#E8611A', cursor: 'pointer', fontWeight: 600 }}>¿Ya tenés cuenta?</span>
        </p>

        {/* Rol — solo cuando no viene por link de referido */}
        {!hasRef && (
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>¿Quién sos?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.values(ROLES).map(role => (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role.id); setError('') }}
                  style={{
                    padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                    background: selectedRole === role.id ? 'rgba(232,97,26,.08)' : '#0a0a0a',
                    border: `1.5px solid ${selectedRole === role.id ? '#E8611A' : '#222'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    transition: 'all .15s', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{role.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: selectedRole === role.id ? '#E8611A' : '#fff' }}>{role.label}</span>
                  <span style={{ fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 1.3 }}>{role.shortDesc || role.desc?.split('.')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%', padding: '13px', marginBottom: 16,
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontSize: 12, color: '#333' }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ['Nombre', 'name', 'text', 'Ej: Martina García'],
            ['Email', 'email', 'email', 'tu@email.com'],
            ['Contraseña', 'password', 'password', 'Mínimo 6 caracteres'],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={upd(key)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder={ph}
                className="input"
              />
            </div>
          ))}

          {/* Código invitación */}
          {showRefField ? (
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Código de invitación
                <span style={{ fontSize: 11, color: '#555', fontWeight: 400 }}>(+50 créditos)</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value.toUpperCase())}
                placeholder="Ej: GUILLE8X"
                className="input"
                style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRefField(true)}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}
            >
              ¿Tenés código de invitación? (+50 créditos)
            </button>
          )}

          {error && (
            <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>{error}</span>
              {error.includes('¿Querés ingresar?') && (
                <span onClick={() => navigate('/login')} style={{ color: '#E8611A', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', fontSize: 13 }}>Ingresar →</span>
              )}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={handleRegister}
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 15, opacity: loading ? 0.6 : 1, marginTop: 4 }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#444', lineHeight: 1.6 }}>
            Al registrarte aceptás nuestros{' '}
            <span style={{ color: '#E8611A', cursor: 'pointer' }}>términos</span>{' '}y{' '}
            <span style={{ color: '#E8611A', cursor: 'pointer' }}>privacidad</span>.
          </p>
        </div>

      </div>
    </div>
  )
}
