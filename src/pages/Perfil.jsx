import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SKILL_ROLES, ROLES, CREDIT_ACTIONS, getLevel } from '../lib/constants'
import { supabase } from '../lib/supabase'

function calcCompleteness(profile) {
  if (!profile) return 0
  const checks = [
    !!profile.name,
    !!profile.location,
    !!profile.bio && profile.bio.length > 20,
    !!profile.linkedin_url,
    !!profile.portfolio_url,
  ]
  if (profile.type === 'talento') checks.push(!!profile.role)
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

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
  const formInitialized = useRef(false)
  const upd = k => e => setForm(f => ({ ...f, [k]: e.type === 'change' ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))
  const updv = k => v => setForm(f => ({ ...f, [k]: v }))

  // Auth redirect only — separate from profile init
  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  // Initialize form once when profile first loads — background updates (credits, refetch)
  // no deben resetear los campos que el usuario está editando
  useEffect(() => {
    if (!profile || formInitialized.current) return
    formInitialized.current = true
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
  }, [profile])

  useEffect(() => {
    supabase.from('skills').select('id, name').order('name').then(({ data }) => { if (data) setAllSkills(data) })
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
    const safetyTimer = setTimeout(() => setSaving(false), 18000)
    try {
      let avatarUrl = profile?.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop().toLowerCase()
        const path = `${user.id}/avatar.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (upErr) { setSaveError(`Error al subir la foto: ${upErr.message}`); return }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = urlData.publicUrl + '?t=' + Date.now()
      }

      const updates = { name: form.name, bio: form.bio, location: form.location, portfolio: form.portfolio, linkedin_url: form.linkedin, avatar_url: avatarUrl }
      if (isTalent) { updates.role = form.role; updates.available = form.available }

      const { error } = await updateProfile(updates)
      if (error) { setSaveError(`Error: ${error.message}`); return }

      if (isTalent) {
        await supabase.from('user_skills').delete().eq('user_id', user.id)
        if (userSkills.length > 0) {
          const inserts = allSkills.filter(s => userSkills.includes(s.name)).map(s => ({ user_id: user.id, skill_id: s.id }))
          if (inserts.length) await supabase.from('user_skills').insert(inserts)
        }
      }

      setAvatarFile(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(`Error inesperado: ${err?.message || String(err)}`)
    } finally {
      clearTimeout(safetyTimer)
      setSaving(false)
    }
  }

  const isTalent = profile?.type === 'talento'
  const roleInfo = profile?.type ? ROLES[profile.type] : null
  const avatarInitials = (profile?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const completeness = calcCompleteness(profile)
  const credits = profile?.credits ?? 50
  const level = getLevel(credits)

  // Pending credit actions based on current profile + form values
  const tempProfile = {
    ...profile,
    bio: form.bio, location: form.location, portfolio_url: form.portfolio,
    linkedin_url: form.linkedin, name: form.name,
  }
  const pendingActions = CREDIT_ACTIONS.filter(a => a.key !== 'idea' && !a.check(tempProfile, {}))
  const earnableCredits = pendingActions.reduce((s, a) => s + a.credits, 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f8f9fa' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const inputStyle = {
    padding: '12px 14px', background: '#fff', border: '1px solid #e0e0e0', color: '#0a0a0a',
    fontFamily: 'Inter, sans-serif', fontSize: 15, borderRadius: 10, outline: 'none',
    width: '100%', boxSizing: 'border-box', transition: 'border-color .15s',
  }

  return (
    <div style={{ background: '#f4f4f5', minHeight: '100dvh', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pfield:focus { border-color: #E8611A !important; }
        .skill-chip { padding: 7px 13px; border-radius: 8px; cursor: pointer; font-family: Inter,sans-serif; font-size: 13px; transition: all .15s; border: 1px solid #e0e0e0; background: #fff; color: #555; }
        .skill-chip.active { border-color: #E8611A; background: rgba(232,97,26,.08); color: #E8611A; font-weight: 600; }
        .action-chip { display:flex;align-items:center;gap:8px;padding:9px 14px;background:#fff;border:1px solid #e8e8e8;border-radius:10px;font-size:13px;color:#555;transition:all .15s;cursor:default; }
        .action-chip.done { border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.05);color:#22c55e; }
        @media(max-width:640px) { .perfil-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', paddingTop: 64 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 24px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{ width: 84, height: 84, borderRadius: 18, background: 'linear-gradient(135deg,#f0f0f0,#e8e8e8)', border: '2px solid #e8e8e8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#E8611A', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarInitials}
              </div>
              <button
                type="button" onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', bottom: -6, right: -6, width: 26, height: 26, borderRadius: '50%', background: '#E8611A', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.8px', margin: 0, marginBottom: 6, color: '#0a0a0a' }}>
                    {profile?.name || 'Tu perfil'}
                  </h1>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                    {roleInfo && <span className={`role-badge role-${profile.type}`}>{roleInfo.icon} {roleInfo.label}</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${level.color}18`, color: level.color, border: `1px solid ${level.color}30` }}>
                      ⚡ {level.name} · {credits} pts
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { signOut(); navigate('/') }}
                  style={{ padding: '7px 14px', fontSize: 12, background: 'none', border: '1px solid #e0e0e0', color: '#888', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
                >
                  Cerrar sesión
                </button>
              </div>

              {/* Completeness bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Completitud del perfil</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: completeness === 100 ? '#22c55e' : '#E8611A' }}>{completeness}%</span>
                </div>
                <div style={{ height: 5, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completeness}%`, background: completeness === 100 ? '#22c55e' : 'linear-gradient(90deg,#E8611A,#f59340)', borderRadius: 99, transition: 'width .6s ease' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* ── AI Guide Banner ───────────────────────────────── */}
        <div style={{ marginBottom: 16, padding: '18px 20px', background: 'linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', animation: 'fadeUp .3s ease' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>✦ Equia IA</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
              {completeness === 100 ? 'Perfil completo — máximo posicionamiento' : 'Completá tu perfil con IA en 2 minutos'}
            </div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
              {completeness === 100
                ? 'Aparecés primero en las búsquedas de founders con tu perfil.'
                : earnableCredits > 0
                  ? `Podés ganar +${earnableCredits} créditos más → mejor posición en el matching`
                  : 'Más créditos = más visibilidad ante founders que buscan tu perfil'}
            </div>
          </div>
          <button
            onClick={() => navigate('/perfil-chat')}
            style={{ padding: '11px 20px', background: '#E8611A', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap', transition: 'opacity .15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Completar con IA →
          </button>
        </div>

        {/* ── Credit actions ───────────────────────────────── */}
        {pendingActions.length > 0 && (
          <div style={{ marginBottom: 16, padding: '16px 18px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, animation: 'fadeUp .3s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Créditos disponibles para ganar</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CREDIT_ACTIONS.filter(a => a.key !== 'idea').map(a => {
                const done = a.check(tempProfile, {})
                return (
                  <div key={a.key} className={`action-chip${done ? ' done' : ''}`}>
                    {done
                      ? <><span style={{ fontSize: 13 }}>✓</span> {a.label}</>
                      : <><span style={{ fontWeight: 700, color: '#E8611A' }}>+{a.credits}</span> {a.label}</>
                    }
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#999', lineHeight: 1.5 }}>
              Los créditos determinan tu posicionamiento en el algoritmo de matching — más créditos = primera posición en búsquedas de founders.
            </div>
          </div>
        )}

        {/* ── Foto de perfil (mobile hint) ─────────────────── */}
        {avatarFile && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(232,97,26,.06)', border: '1px solid rgba(232,97,26,.15)', borderRadius: 10, fontSize: 13, color: '#E8611A', fontWeight: 600 }}>
            📷 Nueva foto lista — guardá para aplicarla
          </div>
        )}

        {/* ── Información básica ───────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 20px', marginBottom: 12, animation: 'fadeUp .35s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Información básica</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="perfil-grid">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Nombre completo</label>
              <input className="pfield" value={form.name} onChange={upd('name')} placeholder="Ej: Martina García" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                Ubicación
                {!form.location && <span style={{ marginLeft: 6, fontSize: 11, color: '#E8611A', fontWeight: 400 }}>+10 créditos</span>}
              </label>
              <input className="pfield" value={form.location} onChange={upd('location')} placeholder="Ej: Buenos Aires, Argentina" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Presentación ────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 20px', marginBottom: 12, animation: 'fadeUp .4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' }}>Presentación</div>
            {(!form.bio || form.bio.length <= 20) && (
              <span style={{ fontSize: 11, color: '#E8611A', fontWeight: 600 }}>+20 créditos si superás 20 caracteres</span>
            )}
          </div>
          {isTalent && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Rol principal</label>
              <select className="pfield" value={form.role} onChange={upd('role')} style={inputStyle}>
                <option value="">Seleccioná tu rol...</option>
                {SKILL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              {isTalent ? 'Bio profesional' : 'Sobre vos'}
            </label>
            <textarea
              className="pfield"
              value={form.bio} onChange={upd('bio')}
              placeholder={isTalent ? 'Contanos tu experiencia y qué proyectos te apasionan...' : 'Contanos sobre vos y tu visión emprendedora...'}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: form.bio.length > 20 ? '#22c55e' : '#bbb', marginTop: 4, textAlign: 'right' }}>
              {form.bio.length} caracteres {form.bio.length > 20 ? '✓ +20 créditos desbloqueados' : '(mínimo 21 para créditos)'}
            </div>
          </div>
        </div>

        {/* ── Links ────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 20px', marginBottom: 12, animation: 'fadeUp .45s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Links profesionales</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                LinkedIn
                {!form.linkedin && <span style={{ marginLeft: 6, fontSize: 11, color: '#E8611A', fontWeight: 400 }}>+20 créditos</span>}
              </label>
              <input className="pfield" value={form.linkedin} onChange={upd('linkedin')} placeholder="https://linkedin.com/in/tu-perfil" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                Portfolio / Web / GitHub
                {!form.portfolio && <span style={{ marginLeft: 6, fontSize: 11, color: '#E8611A', fontWeight: 400 }}>+20 créditos</span>}
              </label>
              <input className="pfield" value={form.portfolio} onChange={upd('portfolio')} placeholder="https://miportafolio.com" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Skills (talento) ─────────────────────────────── */}
        {isTalent && allSkills.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 20px', marginBottom: 12, animation: 'fadeUp .5s ease' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Habilidades</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>Seleccioná las tecnologías y herramientas que dominás.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {allSkills.map(s => (
                <button
                  key={s.id} type="button"
                  className={`skill-chip${userSkills.includes(s.name) ? ' active' : ''}`}
                  onClick={() => toggleSkill(s.name)}
                >
                  {userSkills.includes(s.name) ? '✓ ' : ''}{s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Disponibilidad (talento) ─────────────────────── */}
        {isTalent && (
          <div style={{ marginBottom: 12, animation: 'fadeUp .55s ease' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
              padding: '16px 18px', background: '#fff',
              border: `1px solid ${form.available ? 'rgba(34,197,94,.3)' : '#e8e8e8'}`,
              borderRadius: 14,
              background: form.available ? 'rgba(34,197,94,.04)' : '#fff',
              transition: 'all .15s',
            }}>
              <input type="checkbox" checked={form.available} onChange={upd('available')} style={{ width: 18, height: 18, accentColor: '#22c55e', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: form.available ? '#22c55e' : '#0a0a0a' }}>
                  {form.available ? 'Disponible para proyectos' : 'No disponible actualmente'}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {form.available ? 'Aparecés en el directorio activo de talentos' : 'Tu perfil no aparece en búsquedas activas'}
                </div>
              </div>
            </label>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────── */}
        {saveError && (
          <div style={{ marginBottom: 12, padding: '12px 16px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 10, color: '#ef4444', fontSize: 13 }}>
            {saveError}
          </div>
        )}

        {/* ── Guardar ──────────────────────────────────────── */}
        <button
          onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '15px', fontSize: 15, fontWeight: 800,
            background: saved ? '#22c55e' : saving ? '#ccc' : '#E8611A',
            color: '#fff', border: 'none', borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'background .25s', letterSpacing: '-.2px',
            marginBottom: 16, animation: 'fadeUp .6s ease',
          }}
        >
          {saving ? 'Guardando...' : saved ? '✓ Cambios guardados' : 'Guardar cambios'}
        </button>

        {/* ── Acciones rápidas ─────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '18px 20px', animation: 'fadeUp .65s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Acciones rápidas</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => navigate('/perfil-chat')} style={quickBtn('#0a0a0a', '#fff')}>🤖 Completar con IA</button>
            <button onClick={() => navigate('/cv')} style={quickBtn('#fff', '#0a0a0a', '#e0e0e0')}>📄 Curriculum</button>
            {profile?.type === 'visionario' && <button onClick={() => navigate('/lanzar')} style={quickBtn('#fff', '#0a0a0a', '#e0e0e0')}>💡 Lanzar idea</button>}
            {profile?.type === 'talento' && <button onClick={() => navigate('/explorar')} style={quickBtn('#fff', '#0a0a0a', '#e0e0e0')}>⚡ Invitaciones</button>}
            {profile?.type === 'inversor' && <button onClick={() => navigate('/proyectos')} style={quickBtn('#fff', '#0a0a0a', '#e0e0e0')}>💼 Proyectos</button>}
            <button onClick={() => navigate('/dashboard')} style={quickBtn('#fff', '#0a0a0a', '#e0e0e0')}>Dashboard →</button>
          </div>
        </div>

      </div>
    </div>
  )
}

function quickBtn(bg, color, border) {
  return {
    padding: '10px 16px', fontSize: 13, fontWeight: 600,
    background: bg, color, border: `1px solid ${border || bg}`,
    borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'opacity .15s',
  }
}
