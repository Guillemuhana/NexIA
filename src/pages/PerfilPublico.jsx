import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function PerfilPublico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: myProfile } = useAuth()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: u }, { data: tp }] = await Promise.all([
        supabase.from('users').select('id, name, bio, location, avatar_url, portfolio_url, user_skills(skills(name))').eq('id', id).single(),
        supabase.from('talent_profiles').select('main_role, available, match_score_avg, projects_count, experience_years').eq('user_id', id).single(),
      ])
      if (u) {
        setPerson({
          ...u,
          ...(tp || {}),
          skills: (u.user_skills || []).map(us => us.skills?.name).filter(Boolean),
          initials: u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ width: 36, height: 36, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!person) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 16, color: '#666' }}>Perfil no encontrado</div>
      <button className="btn-outline" onClick={() => navigate('/explorar')} style={{ padding: '10px 20px', fontSize: 14 }}>Ver talentos →</button>
    </div>
  )

  const score = Math.round(person.match_score_avg || 0)

  return (
    <div className="page-wrap">
      <div style={{ padding: '80px 20px 60px', maxWidth: 680, margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, marginBottom: 28, padding: 0 }}>
          ← Volver
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: '#f0f0f0', border: '1px solid #d0d0d0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#E8611A', flexShrink: 0 }}>
            {person.avatar_url
              ? <img src={person.avatar_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : person.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ fontSize: 'clamp(20px,5vw,30px)', fontWeight: 900, letterSpacing: '-.5px' }}>{person.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: person.available ? '#22c55e' : '#ccc', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: person.available ? '#22c55e' : '#999' }}>
                  {person.available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
            {person.main_role && <div style={{ fontSize: 15, color: '#555', marginBottom: 3 }}>{person.main_role}</div>}
            {person.location && <div style={{ fontSize: 13, color: '#777' }}>📍 {person.location}</div>}
          </div>
          {myProfile?.type === 'visionario' && (
            <button className="btn-primary" style={{ padding: '10px 18px', fontSize: 13 }} onClick={() => navigate('/lanzar')}>
              Invitar →
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Match %', score > 0 ? score : '—'],
            ['Proyectos', person.projects_count || 0],
            ['Experiencia', person.experience_years ? `${person.experience_years} años` : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '18px 12px', background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#E8611A', letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{k}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        {person.bio && (
          <div style={{ padding: 22, border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Sobre mí</div>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, margin: 0 }}>{person.bio}</p>
          </div>
        )}

        {/* Skills */}
        {person.skills?.length > 0 && (
          <div style={{ padding: 22, border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Habilidades</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {person.skills.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {person.portfolio_url && (
          <div style={{ padding: 18, border: '1px solid #e8e8e8', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Portfolio</div>
              <div style={{ fontSize: 13, color: '#555', wordBreak: 'break-all' }}>{person.portfolio_url}</div>
            </div>
            <a
              href={person.portfolio_url.startsWith('http') ? person.portfolio_url : `https://${person.portfolio_url}`}
              target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #d0d0d0', color: '#0a0a0a', borderRadius: 7, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
            >
              Ver →
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
