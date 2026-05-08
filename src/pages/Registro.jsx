import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

export default function Registro() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1) // 1: rol, 2: datos
  const [selectedRole, setSelectedRole] = useState(searchParams.get('rol') || '')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, setUserRole } = useAuth()
  const navigate = useNavigate()
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('Completá todos los campos'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    const { data, error: err } = await signUp({ email: form.email, password: form.password, name: form.name })
    if (err) { setError(err.message); setLoading(false); return }
    if (data?.user) await setUserRole(data.user.id, selectedRole)
    setLoading(false)
    navigate('/onboarding')
  }

  return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 24px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', marginBottom: 48 }}>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1 }}>nex</span>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1, color: '#E8611A' }}>IA</span>
        </div>

        {/* PASO 1 — Elegir rol */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>¿Quién sos?</h1>
            <p style={{ color: '#666', fontSize: 15, marginBottom: 36, lineHeight: 1.6 }}>Elegí tu rol para personalizar tu experiencia en nexIA.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {Object.values(ROLES).map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 20px',
                  background: selectedRole === role.id ? 'rgba(232,97,26,.08)' : '#0a0a0a',
                  border: `1px solid ${selectedRole === role.id ? '#E8611A' : '#222'}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: selectedRole === role.id ? '#E8611A' : '#fff', marginBottom: 4 }}>{role.label}</div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{role.desc}</div>
                  </div>
                  {selectedRole === role.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#fff', fontWeight: 700 }}>✓</div>
                  )}
                </button>
              ))}
            </div>

            <button className="btn-primary" onClick={() => selectedRole && setStep(2)} style={{ width: '100%', padding: 14, fontSize: 16, opacity: selectedRole ? 1 : 0.4 }}>
              Continuar →
            </button>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#555' }}>
              ¿Ya tenés cuenta?{' '}
              <span onClick={() => navigate('/login')} style={{ color: '#E8611A', cursor: 'pointer', fontWeight: 600 }}>Ingresá</span>
            </p>
          </>
        )}

        {/* PASO 2 — Datos */}
        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, marginBottom: 24, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Volver
            </button>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <span className={`role-badge role-${selectedRole}`}>{ROLES[selectedRole]?.icon} {ROLES[selectedRole]?.label}</span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Creá tu cuenta</h1>
            <p style={{ color: '#666', fontSize: 15, marginBottom: 36 }}>Solo lleva 30 segundos.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[['Nombre completo','name','text','Ej: Martina García'],
                ['Email','email','email','tu@email.com'],
                ['Contraseña','password','password','Mínimo 6 caracteres']].map(([label,key,type,ph]) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <input type={type} value={form[key]} onChange={upd(key)} placeholder={ph} className="input" />
                </div>
              ))}

              {error && <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>{error}</div>}

              <button className="btn-primary" onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: 14, fontSize: 16, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: '#444', lineHeight: 1.6 }}>
                Al registrarte aceptás nuestros <span style={{ color: '#E8611A', cursor: 'pointer' }}>términos</span> y <span style={{ color: '#E8611A', cursor: 'pointer' }}>política de privacidad</span>.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
