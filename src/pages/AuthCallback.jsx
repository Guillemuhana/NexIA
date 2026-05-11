import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/login'); return }
    // Si hay un pendingRole todavía en localStorage, esperar al próximo render
    if (localStorage.getItem('nexia_pending_role')) return
    // Nuevo usuario sin rol: elegir rol
    if (!profile?.type) { navigate('/registro'); return }
    navigate('/dashboard')
  }, [user, profile, loading])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14, color: '#444' }}>Iniciando sesión...</span>
    </div>
  )
}
