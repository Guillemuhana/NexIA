import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SKILL_ROLES, ROLES } from '../lib/constants'
import { supabase } from '../lib/supabase'

export default function Perfil() {
  const { user, profile, updateProfile, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', role: '', bio: '', location: '', portfolio: '', linkedin: '', available: true })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [userSkills, setUserSkills] = useState([])
  const [allSkills, setAllSkills] = useState([])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    if (!loading && !user) navigate('/login')
    if (profile) {
      setForm({
        name: profile.name || '',
        role: profile.role || '',
        bio: profile.bio || '',
        location: profile.location || '',
        portfolio: profile.portfolio_url || '',
        linkedin: profile.linkedin_url || '',
        available: profile.available ?? true,
      })
      if (profile.avatar_url) setAvatarPreview(profile.avatar_url)
    }
  }, [user, profile, loading])

  useEffect(() => {
    supabase.from('skills').select('id, name').order('name').then(({ data }) => {
      if (data) setAllSkills(data)
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('user_skills').select('skills(name)').eq('user_id', user.id).then(({ data }) => {
      if (data) setUserSkills(data.map(us => us.skills?.name).filter(Boolean))
    })
  }, [user?.id])

  const handleAvatarChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('La imagen debe pesar menos de 2MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const toggleSkill = name => {
    setUserSkills(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      let avatarUrl = profile?.avatar_url

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop().toLowerCase()
        const path = `${user.id}/avatar.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, {
          upsert: true,
          contentType: avatarFile.type,
        })
        if (upErr) {
          setSaveError(`Error al subir la foto: ${upErr.message}`)
          setSaving(false)
          return
        }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl + '?t=' + Date.now()
      }

      const updates = { name: form.name, bio: form.bio, location: form.location, portfolio: form.portfolio, linkedin_url: form.linkedin, avatar_url: avatarUrl }
      if (isTalent) { updates.role = form.role; updates.available = form.available }

      const { error } = await updateProfile(updates)
      if (error) { setSaveError(`Error al guardar: ${error.message}`); setSaving(false); return }

      if (isTalent) {
        await supabase.from('user_skills').delete().eq('user_id', user.id)
        if (userSkills.length > 0) {
          const inserts = allSkills
            .filter(s => userSkills.includes(s.name))
            .map(s => ({ user_id: user.id, skill_id: s.id }))
          if (inserts.length) await supabase.from('user_skills').insert(inserts)
        }
      }

      setAvatarFile(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(`Error inesperado: ${err?.message || String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  const isTalent = profile?.type === 'talento'
  const roleInfo = profile?.type ? ROLES[profile.type] : null
  const avatarInitials = (profile?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const inputStyle = { padding: '12px 14px', background: '#f8f9fa', border: '1px solid #d0d0d0', color: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: 15, borderRadius: 8, outline: 'none', width: '100%', transition: 'border-color .15s' }

  if (loading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Foto de perfil */}
          <div>
            <label className="form-label">Foto de perfil</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 76, height: 76, borderRadius: 16, background: '#f0f0f0', border: '1px solid #d0d0d0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#E8611A', flexShrink: 0 }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarInitials}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'none', border: '1px solid #d0d0d0', color: '#0a0a0a', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 6 }}
                >
                  Cambiar foto
                </button>
                <div style={{ fontSize: 12, color: '#888' }}>JPG, PNG o WebP · Máx 2MB</div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="form-label">Nombre completo</label>
            <input value={form.name} onChange={upd('name')} placeholder="Ej: Martina García" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E8611A'} onBlur={e => e.target.style.borderColor = '#d0d0d0'} />
          </div>

          {/* Rol (solo talento) */}
          {isTalent && (
            <div>
              <label className="form-label">Rol principal</label>
              <select value={form.role} onChange={upd('role')} style={inputStyle}>
                <option value="">Seleccioná tu rol...</option>
                {SKILL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Ubicación */}
          <div>
            <label className="form-label">Ubicación</label>
            <input value={form.location} onChange={upd('location')} placeholder="Ej: Buenos Aires, Argentina" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E8611A'} onBlur={e => e.target.style.borderColor = '#d0d0d0'} />
          </div>

          {/* Portfolio */}
          <div>
            <label className="form-label">Portfolio / Web</label>
            <input value={form.portfolio} onChange={upd('portfolio')} placeholder="https://miportafolio.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E8611A'} onBlur={e => e.target.style.borderColor = '#d0d0d0'} />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="form-label">LinkedIn</label>
            <input value={form.linkedin} onChange={upd('linkedin')} placeholder="https://linkedin.com/in/tu-perfil" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E8611A'} onBlur={e => e.target.style.borderColor = '#d0d0d0'} />
          </div>

          {/* Bio */}
          <div>
            <label className="form-label">{isTalent ? 'Bio profesional' : 'Sobre vos'}</label>
            <textarea value={form.bio} onChange={upd('bio')}
              placeholder={isTalent ? 'Contanos tu experiencia y qué proyectos te apasionan...' : 'Contanos sobre vos y tu visión...'}
              rows={4} style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#E8611A'} onBlur={e => e.target.style.borderColor = '#d0d0d0'} />
          </div>

          {/* Habilidades (solo talento) */}
          {isTalent && allSkills.length > 0 && (
            <div>
              <label className="form-label">Habilidades</label>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Seleccioná las tecnologías y herramientas que dominás.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {allSkills.map(s => {
                  const sel = userSkills.includes(s.name)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.name)}
                      style={{
                        padding: '7px 13px', borderRadius: 7,
                        border: `1px solid ${sel ? '#E8611A' : '#d0d0d0'}`,
                        background: sel ? 'rgba(232,97,26,.08)' : 'none',
                        color: sel ? '#E8611A' : '#555',
                        fontSize: 13, fontWeight: sel ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s',
                      }}
                    >
                      {sel ? '✓ ' : ''}{s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Disponibilidad (solo talento) */}
          {isTalent && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              padding: '14px 16px',
              border: `1px solid ${form.available ? 'rgba(34,197,94,.3)' : '#d0d0d0'}`,
              borderRadius: 10,
              background: form.available ? 'rgba(34,197,94,.05)' : '#f8f9fa',
              transition: 'all .15s',
            }}>
              <input type="checkbox" checked={form.available} onChange={upd('available')} style={{ width: 18, height: 18, accentColor: '#22c55e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: form.available ? '#22c55e' : '#0a0a0a' }}>
                  {form.available ? 'Disponible para proyectos' : 'No disponible'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {form.available ? 'Aparecés como disponible en el directorio' : 'Tu perfil no aparece en búsquedas activas'}
                </div>
              </div>
            </label>
          )}

          {saveError && (
            <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
              {saveError}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: 14, fontSize: 16, fontWeight: 700,
            background: saved ? '#22c55e' : '#E8611A',
            color: '#fff', border: 'none', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'background .3s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Guardando...' : saved ? '✓ Cambios guardados' : 'Guardar cambios'}
          </button>

          <div style={{ height: 1, background: '#e8e8e8' }} />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Acciones rápidas</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {profile?.type === 'visionario' && <button className="btn-primary" onClick={() => navigate('/lanzar')} style={{ padding: '10px 18px', fontSize: 14 }}>💡 Lanzar una idea</button>}
              {profile?.type === 'talento' && <button className="btn-primary" onClick={() => navigate('/explorar')} style={{ padding: '10px 18px', fontSize: 14 }}>⚡ Ver mis invitaciones</button>}
              {profile?.type === 'inversor' && <button className="btn-primary" onClick={() => navigate('/proyectos')} style={{ padding: '10px 18px', fontSize: 14 }}>💼 Explorar proyectos</button>}
              <button className="btn-outline" onClick={() => navigate('/cv')} style={{ padding: '10px 18px', fontSize: 14 }}>📄 Mi CV digital</button>
              <button className="btn-outline" onClick={() => navigate('/dashboard')} style={{ padding: '10px 18px', fontSize: 14 }}>Mi dashboard →</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
