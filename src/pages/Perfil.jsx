import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SKILL_ROLES, ROLES } from '../lib/constants'

export default function Perfil() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', role: '', bio: '', location: '', portfolio: '', skills: '', available: true })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (profile) setForm({ name: profile.name || '', role: profile.role || '', bio: profile.bio || '', location: profile.location || '', portfolio: profile.portfolio_url || '', skills: '', available: profile.available ?? true })
  }, [user, profile, loading])

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const updates = { name: form.name, bio: form.bio, location: form.location, portfolio: form.portfolio }
      // solo pasar role/available para talento
      if (isTalent) { updates.role = form.role; updates.available = form.available }
      const { error } = await updateProfile(updates)
      if (error) { setSaveError('No se pudo guardar. Intentá de nuevo.'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Error inesperado. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const isTalent = profile?.type === 'talento'
  const roleInfo = profile?.type ? ROLES[profile.type] : null
  const inputStyle = { padding: '12px 14px', background: '#f8f9fa', border: '1px solid #d0d0d0', color: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: 15, borderRadius: 8, outline: 'none', width: '100%', transition: 'border-color .15s' }

  if (loading) return <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 60px', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Mi cuenta</div>
            <h1 style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>{profile?.name || 'Mi perfil'}</h1>
            {roleInfo && <span className={`role-badge role-${profile.type}`}>{roleInfo.icon} {roleInfo.label}</span>}
          </div>
          <button onClick={() => { signOut(); navigate('/') }} style={{ padding: '8px 16px', fontSize: 13, background: 'none', border: '1px solid #d0d0d0', color: '#666', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cerrar sesión
          </button>
        </div>

        <div style={{ height: 1, background: '#e8e8e8', marginBottom: 36 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            ['Nombre completo', 'name', 'input', 'Ej: Martina García'],
            [isTalent ? 'Rol / Especialidad' : profile?.type === 'visionario' ? 'Tu rol en el proyecto' : 'Tu cargo', 'role', 'input', isTalent ? 'Ej: Full-Stack Developer' : 'Ej: Founder / CEO'],
            ['Ubicación', 'location', 'input', 'Ej: Buenos Aires, Argentina'],
            ['Portfolio / Web', 'portfolio', 'input', 'https://miportafolio.com'],
          ].map(([label, key, , ph]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input value={form[key]} onChange={upd(key)} placeholder={ph} style={inputStyle} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#d0d0d0'}/>
            </div>
          ))}

          <div>
            <label className="form-label">{isTalent ? 'Bio profesional' : 'Sobre vos'}</label>
            <textarea value={form.bio} onChange={upd('bio')} placeholder={isTalent ? 'Contanos tu experiencia y qué proyectos te apasionan...' : 'Contanos sobre vos y tu visión...'} rows={4} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#d0d0d0'}/>
          </div>

          {isTalent && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={upd('available')} style={{ width: 16, height: 16, accentColor: '#E8611A' }} />
              <span style={{ fontSize: 15, fontWeight: 500 }}>Disponible para nuevos proyectos</span>
            </label>
          )}

          {saveError && (
            <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
              {saveError}
            </div>
          )}
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700, background: saved ? '#22c55e' : '#E8611A', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .3s', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>

          {/* Quick actions */}
          <div style={{ height: 1, background: '#e8e8e8', margin: '8px 0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Acciones rápidas</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {profile?.type === 'visionario' && <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '10px 18px', fontSize: 14 }}>💡 Lanzar una idea</button>}
              {profile?.type === 'talento' && <button className="btn-primary" onClick={() => navigate('/explorar')} style={{ padding: '10px 18px', fontSize: 14 }}>⚡ Ver mis invitaciones</button>}
              {profile?.type === 'inversor' && <button className="btn-primary" onClick={() => navigate('/proyectos')} style={{ padding: '10px 18px', fontSize: 14 }}>💼 Explorar proyectos</button>}
              <button className="btn-outline" onClick={() => navigate('/dashboard')} style={{ padding: '10px 18px', fontSize: 14 }}>Mi dashboard →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
