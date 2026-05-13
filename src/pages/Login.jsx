import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Completá todos los campos'); return }
    setLoading(true); setError('')
    try {
      const { error: err } = await signIn({ email: form.email, password: form.password })
      if (err) { setError('Email o contraseña incorrectos'); return }
      navigate('/dashboard')
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    await signInWithGoogle()
  }

  const handleKey = e => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '80px 20px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', marginBottom: 44 }}>
          <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: -1.5 }}>Equ</span>
          <span style={{ fontWeight: 900, fontSize: 26, letterSpacing: -1.5, color: '#E8611A' }}>ia</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Bienvenido</h1>
        <p style={{ color: '#555', fontSize: 15, marginBottom: 32 }}>Ingresá a tu cuenta de Equia.</p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%', padding: '13px', marginBottom: 20,
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

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
          <span style={{ fontSize: 12, color: '#333' }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={upd('email')} onKeyDown={handleKey} placeholder="tu@email.com" className="input" />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input type="password" value={form.password} onChange={upd('password')} onKeyDown={handleKey} placeholder="Tu contraseña" className="input" />
          </div>

          {error && (
            <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 14, fontSize: 15, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#555' }}>
            ¿No tenés cuenta?{' '}
            <span onClick={() => navigate('/registro')} style={{ color: '#E8611A', cursor: 'pointer', fontWeight: 600 }}>Registrate gratis</span>
          </p>
        </div>

      </div>
    </div>
  )
}
