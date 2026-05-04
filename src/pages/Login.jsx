import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Completá todos los campos'); return }
    setLoading(true); setError('')
    const { error: err } = await signIn({ email: form.email, password: form.password })
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    setLoading(false)
    navigate('/dashboard')
  }

  const handleKey = e => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', marginBottom: 48 }}>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1 }}>nex</span>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1, color: '#E8611A' }}>IA</span>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Bienvenido</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 36 }}>Ingresá a tu cuenta de nexIA.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={upd('email')} onKeyDown={handleKey} placeholder="tu@email.com" className="input"/>
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input type="password" value={form.password} onChange={upd('password')} onKeyDown={handleKey} placeholder="Tu contraseña" className="input"/>
          </div>

          {error && <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>{error}</div>}

          <button className="btn-primary" onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 4, opacity: loading ? 0.6 : 1 }}>
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
