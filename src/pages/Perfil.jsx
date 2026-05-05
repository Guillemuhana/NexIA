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
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (profile) setForm({ name: profile.name || '', role: profile.role || '', bio: profile.bio || '', location: profile.location || '', portfolio: profile.portfolio || '', skills: '', available: profile.available ?? true })
  }, [user, profile, loading])

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({ name: form.name, role: form.role, bio: form.bio, location: form.location, portfolio: form.portfolio, available: form.available })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isTalent = profile?.type === 'talento'
  const roleInfo = profile?.type ? ROLES[profile.type] : null
  const inputStyle = { padding: '12px 14px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, borderRadius: 8, outline: 'none', width: '100%', transition: 'border-color .15s' }

  if (loading) return <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>

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
          <button onClick={() => { signOut(); navigate('/') }} style={{ padding: '8px 16px', fontSize: 13, background: 'none', border: '1px solid #222', color: '#666', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cerrar sesión
          </button>
        </div>

        <div style={{ height: 1, background: '#1a1a1a', marginBottom: 36 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            ['Nombre completo', 'name', 'input', 'Ej: Martina García'],
            [isTalent ? 'Rol / Especialidad' : profile?.type === 'visionario' ? 'Tu rol en el proyecto' : 'Tu cargo', 'role', 'input', isTalent ? 'Ej: Full-Stack Developer' : 'Ej: Founder / CEO'],
            ['Ubicación', 'location', 'input', 'Ej: Buenos Aires, Argentina'],
            ['Portfolio / Web', 'portfolio', 'input', 'https://miportafolio.com'],
          ].map(([label, key, , ph]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input value={form[key]} onChange={upd(key)} placeholder={ph} style={inputStyle} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#222'}/>
            </div>
          ))}

          <div>
            <label className="form-label">{isTalent ? 'Bio profesional' : 'Sobre vos'}</label>
            <textarea value={form.bio} onChange={upd('bio')} placeholder={isTalent ? 'Contanos tu experiencia y qué proyectos te apasionan...' : 'Contanos sobre vos y tu visión...'} rows={4} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#222'}/>
          </div>

          {isTalent && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.available} onChange={upd('available')} style={{ width: 16, height: 16, accentColor: '#E8611A' }} />
              <span style={{ fontSize: 15, fontWeight: 500 }}>Disponible para nuevos proyectos</span>
            </label>
          )}

          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, fontSize: 16, fontWeight: 700, background: saved ? '#22c55e' : '#E8611A', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background .3s', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>

          {/* Quick actions */}
          <div style={{ height: 1, background: '#1a1a1a', margin: '8px 0' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Acciones rápidas</div>
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
