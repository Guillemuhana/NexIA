import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function AIBanner({ onNavigate }) {
  return (
    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,rgba(232,97,26,.08),rgba(232,97,26,.04))', border: '1px solid rgba(232,97,26,.2)', borderRadius: 12, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#E8611A', marginBottom: 2 }}>Completar con IA — más rápido y fácil</div>
          <div style={{ fontSize: 13, color: '#666' }}>Respondé 4 preguntas en chat y la IA arma todo tu CV automáticamente.</div>
        </div>
      </div>
      <button onClick={onNavigate} style={{ padding: '10px 20px', background: '#E8611A', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Completar con IA →
      </button>
    </div>
  )
}

const LANGUAGE_LEVELS = ['Básico', 'Intermedio', 'Avanzado', 'Bilingüe', 'Nativo']
const AVAILABILITY_OPTIONS = ['Full-time', 'Part-time', 'Freelance', 'Abierto a oportunidades']
const uid = () => Math.random().toString(36).slice(2)

const emptyExp = () => ({ id: uid(), company: '', role: '', from: '', to: '', current: false, description: '' })
const emptyEdu = () => ({ id: uid(), institution: '', degree: '', field: '', from: '', to: '', current: false })
const emptyLang = () => ({ id: uid(), name: '', level: 'Intermedio' })
const emptyCert = () => ({ id: uid(), name: '', issuer: '', year: '' })
const emptyProj = () => ({ id: uid(), name: '', description: '', url: '', year: '' })

function cvCompleteness(cv, skills) {
  const checks = [
    { label: 'Título profesional', done: cv.job_title?.length > 2 },
    { label: 'Resumen profesional', done: cv.summary?.length > 20 },
    { label: 'Experiencia laboral', done: Array.isArray(cv.experience) && cv.experience.some(e => e.company?.length > 0) },
    { label: 'Educación', done: Array.isArray(cv.education) && cv.education.length > 0 },
    { label: 'Habilidades técnicas', done: skills.length > 0 },
    { label: 'Idiomas', done: Array.isArray(cv.languages) && cv.languages.length > 0 },
  ]
  const done = checks.filter(c => c.done).length
  return { pct: Math.round((done / checks.length) * 100), checks }
}

const inputStyle = {
  padding: '10px 12px', background: '#f8f9fa', border: '1px solid #d0d0d0',
  color: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: 14,
  borderRadius: 7, outline: 'none', width: '100%', transition: 'border-color .15s',
  boxSizing: 'border-box',
}
const focus = e => e.target.style.borderColor = '#E8611A'
const blur = e => e.target.style.borderColor = '#d0d0d0'

function SectionHeader({ title, onAdd, addLabel = '+ Agregar' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px' }}>{title}</h2>
      {onAdd && (
        <button onClick={onAdd} style={{ fontSize: 13, fontWeight: 600, color: '#E8611A', background: 'none', border: '1px solid rgba(232,97,26,.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,97,26,.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >{addLabel}</button>
      )}
    </div>
  )
}

function Card({ children, onRemove }) {
  return (
    <div style={{ padding: '18px 20px', border: '1px solid #e8e8e8', borderRadius: 10, background: '#fff', marginBottom: 12, position: 'relative' }}>
      {children}
      <button onClick={onRemove} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: '#bbb', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0, fontFamily: 'Inter,sans-serif', transition: 'color .15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
        title="Eliminar"
      >×</button>
    </div>
  )
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>{children}</div>
}

export default function CV() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  const [jobTitle, setJobTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [experience, setExperience] = useState([])
  const [education, setEducation] = useState([])
  const [languages, setLanguages] = useState([])
  const [certifications, setCertifications] = useState([])
  const [projects, setProjects] = useState([])
  const [availability, setAvailability] = useState('')
  const [desiredRole, setDesiredRole] = useState('')
  const [skills, setSkills] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const [{ data: userData }, { data: skillRows }] = await Promise.all([
        supabase.from('users').select('cv_data').eq('id', user.id).single(),
        supabase.from('user_skills').select('skills(name)').eq('user_id', user.id),
      ])
      const cv = userData?.cv_data || {}
      setJobTitle(cv.job_title || '')
      setSummary(cv.summary || '')
      setExperience(cv.experience || [])
      setEducation(cv.education || [])
      setLanguages(cv.languages || [])
      setCertifications(cv.certifications || [])
      setProjects(cv.projects || [])
      setAvailability(cv.availability || '')
      setDesiredRole(cv.desired_role || '')
      setSkills((skillRows || []).map(r => r.skills?.name).filter(Boolean))
      setDataLoading(false)
    }
    load().catch(() => setDataLoading(false))
  }, [user?.id])

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true); setSaveError('')
    const cv_data = { job_title: jobTitle, summary, experience, education, languages, certifications, projects, availability, desired_role: desiredRole }
    const { error } = await supabase.from('users').update({ cv_data }).eq('id', user.id)
    if (error) { setSaveError('Error al guardar. Intentá de nuevo.'); setSaving(false); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const updExp = (id, key, val) => setExperience(prev => prev.map(e => e.id === id ? { ...e, [key]: val } : e))
  const updEdu = (id, key, val) => setEducation(prev => prev.map(e => e.id === id ? { ...e, [key]: val } : e))
  const updLang = (id, key, val) => setLanguages(prev => prev.map(l => l.id === id ? { ...l, [key]: val } : l))
  const updCert = (id, key, val) => setCertifications(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c))
  const updProj = (id, key, val) => setProjects(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p))

  const cvSnapshot = { job_title: jobTitle, summary, experience, education, languages, certifications, projects, availability, desired_role: desiredRole }
  const { pct: completePct, checks: completeChecks } = cvCompleteness(cvSnapshot, skills)

  if (loading || dataLoading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 80px', maxWidth: 720, margin: '0 auto' }}>

        <AIBanner onNavigate={() => navigate('/cv-chat')} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>Curriculum Vitae</div>
            <h1 style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 6 }}>Curriculum</h1>
            <p style={{ fontSize: 14, color: '#666' }}>Tu perfil profesional completo, disponible para cualquier proyecto o búsqueda.</p>
          </div>
          <button onClick={() => navigate('/perfil')} style={{ padding: '8px 16px', fontSize: 13, background: 'none', border: '1px solid #d0d0d0', color: '#666', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            ← Volver al perfil
          </button>
        </div>

        <div style={{ height: 1, background: '#e8e8e8', marginBottom: 36 }} />

        {/* Completitud del CV */}
        <div style={{ padding: '20px 24px', marginBottom: 36, border: '1px solid #e8e8e8', borderRadius: 14, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>
                Completitud del perfil profesional
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                Más completo = mayor prioridad en el algoritmo de matching IA
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: completePct === 100 ? '#22c55e' : '#E8611A', letterSpacing: '-1px' }}>
              {completePct}%
            </div>
          </div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${completePct}%`, background: completePct === 100 ? '#22c55e' : 'linear-gradient(90deg,#E8611A,#f97316)', borderRadius: 99, transition: 'width .8s ease' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {completeChecks.map(c => (
              <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 12, background: c.done ? 'rgba(34,197,94,.08)' : '#f5f5f5', border: `1px solid ${c.done ? 'rgba(34,197,94,.25)' : '#e8e8e8'}`, color: c.done ? '#22c55e' : '#999', fontWeight: 600 }}>
                {c.done ? '✓' : '○'} {c.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Datos personales (solo lectura, vienen del perfil) */}
          <div style={{ padding: '20px 22px', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Datos personales</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (profile?.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{profile?.name}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{profile?.role || profile?.bio?.slice(0, 60) || 'Sin rol definido'}</div>
                {profile?.location && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {profile.location}</div>}
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
              Para editar nombre, foto o ubicación andá a{' '}
              <span onClick={() => navigate('/perfil')} style={{ color: '#E8611A', cursor: 'pointer', textDecoration: 'underline' }}>Mi perfil</span>.
            </p>
          </div>

          {/* Título profesional */}
          <div>
            <SectionHeader title="Título profesional" />
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Ej: Full-Stack Developer con 5 años en startups · Node.js, React, AWS"
              style={inputStyle}
              onFocus={focus} onBlur={blur}
            />
            <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              Tu titular profesional. Lo primero que ve la IA y los visionarios.
            </p>
          </div>

          {/* Resumen profesional */}
          <div>
            <SectionHeader title="Resumen profesional" />
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Describí tu trayectoria, lo que te apasiona y qué valor aportás. 3 a 5 oraciones es ideal."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={focus} onBlur={blur}
            />
          </div>

          {/* Experiencia laboral */}
          <div>
            <SectionHeader title="Experiencia laboral" onAdd={() => setExperience(p => [...p, emptyExp()])} />
            {experience.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #e0e0e0', borderRadius: 10, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Todavía no agregaste experiencia.
              </div>
            )}
            {experience.map(exp => (
              <Card key={exp.id} onRemove={() => setExperience(p => p.filter(e => e.id !== exp.id))}>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Empresa *</label>
                    <input value={exp.company} onChange={e => updExp(exp.id, 'company', e.target.value)} placeholder="Ej: Google" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Puesto *</label>
                    <input value={exp.role} onChange={e => updExp(exp.id, 'role', e.target.value)} placeholder="Ej: Frontend Developer" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Desde</label>
                    <input type="month" value={exp.from} onChange={e => updExp(exp.id, 'from', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Hasta</label>
                    <input type="month" value={exp.to} onChange={e => updExp(exp.id, 'to', e.target.value)} disabled={exp.current} style={{ ...inputStyle, opacity: exp.current ? 0.4 : 1 }} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', cursor: 'pointer', marginBottom: 10 }}>
                  <input type="checkbox" checked={exp.current} onChange={e => updExp(exp.id, 'current', e.target.checked)} style={{ accentColor: '#E8611A' }} />
                  Trabajo actualmente acá
                </label>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Descripción de responsabilidades</label>
                  <textarea value={exp.description} onChange={e => updExp(exp.id, 'description', e.target.value)} placeholder="¿Qué hacías? ¿Qué lograste? Usá verbos de acción." rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
                </div>
              </Card>
            ))}
          </div>

          {/* Educación */}
          <div>
            <SectionHeader title="Educación" onAdd={() => setEducation(p => [...p, emptyEdu()])} />
            {education.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #e0e0e0', borderRadius: 10, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Todavía no agregaste educación.
              </div>
            )}
            {education.map(edu => (
              <Card key={edu.id} onRemove={() => setEducation(p => p.filter(e => e.id !== edu.id))}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Institución *</label>
                  <input value={edu.institution} onChange={e => updEdu(edu.id, 'institution', e.target.value)} placeholder="Ej: Universidad de Buenos Aires" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Título / Carrera</label>
                    <input value={edu.degree} onChange={e => updEdu(edu.id, 'degree', e.target.value)} placeholder="Ej: Licenciatura" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Campo de estudio</label>
                    <input value={edu.field} onChange={e => updEdu(edu.id, 'field', e.target.value)} placeholder="Ej: Ciencias de la Computación" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Desde</label>
                    <input type="month" value={edu.from} onChange={e => updEdu(edu.id, 'from', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Hasta</label>
                    <input type="month" value={edu.to} onChange={e => updEdu(edu.id, 'to', e.target.value)} disabled={edu.current} style={{ ...inputStyle, opacity: edu.current ? 0.4 : 1 }} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555', cursor: 'pointer' }}>
                  <input type="checkbox" checked={edu.current} onChange={e => updEdu(edu.id, 'current', e.target.checked)} style={{ accentColor: '#E8611A' }} />
                  Cursando actualmente
                </label>
              </Card>
            ))}
          </div>

          {/* Habilidades (solo lectura, desde perfil) */}
          {skills.length > 0 && (
            <div>
              <SectionHeader title="Habilidades técnicas" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '16px 18px', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 10 }}>
                {skills.map(s => (
                  <span key={s} className="tag">{s}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                Editá tus habilidades desde{' '}
                <span onClick={() => navigate('/perfil')} style={{ color: '#E8611A', cursor: 'pointer', textDecoration: 'underline' }}>Mi perfil</span>.
              </p>
            </div>
          )}

          {/* Idiomas */}
          <div>
            <SectionHeader title="Idiomas" onAdd={() => setLanguages(p => [...p, emptyLang()])} />
            {languages.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #e0e0e0', borderRadius: 10, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Todavía no agregaste idiomas.
              </div>
            )}
            {languages.map(lang => (
              <Card key={lang.id} onRemove={() => setLanguages(p => p.filter(l => l.id !== lang.id))}>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Idioma *</label>
                    <input value={lang.name} onChange={e => updLang(lang.id, 'name', e.target.value)} placeholder="Ej: Inglés" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nivel</label>
                    <select value={lang.level} onChange={e => updLang(lang.id, 'level', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}>
                      {LANGUAGE_LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </Grid2>
              </Card>
            ))}
          </div>

          {/* Certificaciones */}
          <div>
            <SectionHeader title="Certificaciones y cursos" onAdd={() => setCertifications(p => [...p, emptyCert()])} />
            {certifications.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #e0e0e0', borderRadius: 10, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Todavía no agregaste certificaciones.
              </div>
            )}
            {certifications.map(cert => (
              <Card key={cert.id} onRemove={() => setCertifications(p => p.filter(c => c.id !== cert.id))}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nombre del certificado *</label>
                  <input value={cert.name} onChange={e => updCert(cert.id, 'name', e.target.value)} placeholder="Ej: AWS Cloud Practitioner" style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Institución / Plataforma</label>
                    <input value={cert.issuer} onChange={e => updCert(cert.id, 'issuer', e.target.value)} placeholder="Ej: Coursera, AWS, Google" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Año</label>
                    <input type="number" min="2000" max="2030" value={cert.year} onChange={e => updCert(cert.id, 'year', e.target.value)} placeholder="2024" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
              </Card>
            ))}
          </div>

          {/* Proyectos */}
          <div>
            <SectionHeader title="Proyectos personales / freelance" onAdd={() => setProjects(p => [...p, emptyProj()])} />
            {projects.length === 0 && (
              <div style={{ padding: '24px', border: '1px dashed #e0e0e0', borderRadius: 10, textAlign: 'center', color: '#999', fontSize: 14 }}>
                Apps, proyectos open source, trabajos freelance. Suman mucho al matching.
              </div>
            )}
            {projects.map(proj => (
              <Card key={proj.id} onRemove={() => setProjects(p => p.filter(x => x.id !== proj.id))}>
                <Grid2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nombre del proyecto *</label>
                    <input value={proj.name} onChange={e => updProj(proj.id, 'name', e.target.value)} placeholder="Ej: TaskFlow App" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Año</label>
                    <input type="number" min="2010" max="2030" value={proj.year} onChange={e => updProj(proj.id, 'year', e.target.value)} placeholder="2024" style={inputStyle} onFocus={focus} onBlur={blur} />
                  </div>
                </Grid2>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Descripción y tecnologías</label>
                  <textarea value={proj.description} onChange={e => updProj(proj.id, 'description', e.target.value)} placeholder="Qué hace el proyecto, tecnologías usadas, impacto o usuarios." rows={2} style={{ ...inputStyle, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Link (GitHub, web, demo)</label>
                  <input value={proj.url} onChange={e => updProj(proj.id, 'url', e.target.value)} placeholder="https://github.com/..." style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
              </Card>
            ))}
          </div>

          {/* Disponibilidad y búsqueda */}
          <div>
            <SectionHeader title="Disponibilidad y qué buscás" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Disponibilidad</label>
                <select value={availability} onChange={e => setAvailability(e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}>
                  <option value="">Seleccioná...</option>
                  {AVAILABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Tipo de rol deseado</label>
                <input value={desiredRole} onChange={e => setDesiredRole(e.target.value)} placeholder="Ej: Senior Backend, remoto" style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

          {saveError && (
            <div style={{ padding: '11px 14px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 14 }}>
              {saveError}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: 14, fontSize: 16, fontWeight: 700,
            background: saved ? '#22c55e' : '#E8611A',
            color: '#fff', border: 'none', borderRadius: 9,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif', transition: 'background .3s', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Guardando...' : saved ? '✓ CV guardado' : 'Guardar CV'}
          </button>

        </div>
      </div>
    </div>
  )
}
