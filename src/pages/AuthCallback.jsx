import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

export default function AuthCallback() {
  const { user, profile, loading, setUserRole } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)

  const pendingRole = localStorage.getItem('nexia_pending_role')

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    if (pendingRole) return               // AuthContext está aplicando el rol
    if (profile?.type) { navigate('/dashboard'); return }
    // Si llega aquí: usuario autenticado pero sin rol → mostrar selector
  }, [user, profile, loading, pendingRole])

  const handleSaveRole = async () => {
    if (!selectedRole || !user) return
    setSaving(true)
    await setUserRole(user.id, selectedRole)
    navigate('/onboarding')
  }

  // ── Spinner mientras carga o aplica rol pendiente ──
  const showSpinner = loading || pendingRole || (!loading && user && profile?.type)

  if (showSpinner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, background: '#080808' }}>
        <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, color: '#444' }}>Iniciando sesión...</span>
      </div>
    )
  }

  // ── Selector de rol (usuario autenticado sin rol) ──
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '80px 20px', background: '#080808', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 40, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1 }}>nex</span>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: -1, color: '#E8611A' }}>IA</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6, color: '#fff' }}>
          Un último paso
        </h1>
        <p style={{ color: '#555', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          {profile?.name ? `Hola ${profile.name.split(' ')[0]}, ¿` : '¿'}con qué rol querés usar nexIA?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {Object.values(ROLES).map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px',
                background: selectedRole === role.id ? 'rgba(232,97,26,.08)' : '#0a0a0a',
                border: `1px solid ${selectedRole === role.id ? '#E8611A' : '#1a1a1a'}`,
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'Inter, sans-serif', transition: 'all .15s',
              }}
            >
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

        <button
          onClick={handleSaveRole}
          disabled={!selectedRole || saving}
          style={{
            width: '100%', padding: '14px', background: selectedRole ? '#E8611A' : '#111',
            border: 'none', borderRadius: 10, color: selectedRole ? '#fff' : '#333',
            fontWeight: 700, fontSize: 15, cursor: selectedRole ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter, sans-serif', opacity: saving ? 0.7 : 1, transition: 'all .2s',
          }}
        >
          {saving ? 'Guardando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
