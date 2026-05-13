import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Spinner() {
  return <div style={{ width: 36, height: 36, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
}

export default function ProyectoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase
      .from('ideas')
      .select('*, users(id, name, avatar_url, bio, location), idea_roles(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setProject(data); setLoading(false) })
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: project.title, text: project.description?.slice(0, 120), url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spinner />
    </div>
  )

  if (!project) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 16, color: '#666' }}>Proyecto no encontrado</div>
      <button className="btn-outline" onClick={() => navigate('/proyectos')} style={{ padding: '10px 20px', fontSize: 14 }}>Ver proyectos →</button>
    </div>
  )

  const ai = project.ai_analysis
  const isFormed = project.status === 'team_formed'

  return (
    <div className="page-wrap">
      <div style={{ padding: '80px 20px 60px', maxWidth: 780, margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14, marginBottom: 28, padding: 0 }}>
          ← Volver
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <h1 style={{ fontSize: 'clamp(22px,5vw,38px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>{project.title}</h1>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: isFormed ? 'rgba(34,197,94,.1)' : 'rgba(232,97,26,.1)', color: isFormed ? '#22c55e' : '#E8611A', fontWeight: 700, border: `1px solid ${isFormed ? 'rgba(34,197,94,.2)' : 'rgba(232,97,26,.2)'}`, whiteSpace: 'nowrap' }}>
                {isFormed ? '✓ Equipo formado' : '⚡ Buscando equipo'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {project.category && <span className="tag">{project.category}</span>}
              {project.stage && <span className="tag">{project.stage}</span>}
              {project.budget && <span className="tag">💰 {project.budget}</span>}
            </div>
          </div>
          <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'transparent', border: `1px solid ${copied ? 'rgba(34,197,94,.3)' : '#222'}`, color: copied ? '#22c55e' : '#666', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all .2s', whiteSpace: 'nowrap' }}>
            {copied ? '✓ Link copiado' : '↗ Compartir'}
          </button>
        </div>

        {/* Founder */}
        <div style={{ padding: 18, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, background: '#0a0a0a', flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#E8611A', flexShrink: 0 }}>
            {project.users?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Founder</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{project.users?.name}</div>
            {project.users?.location && <div style={{ fontSize: 13, color: '#555' }}>📍 {project.users.location}</div>}
          </div>
          {profile?.type === 'inversor' && (
            <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }}>Contactar →</button>
          )}
        </div>

        {/* Description */}
        <div style={{ padding: 22, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 20, background: '#0a0a0a' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Descripción</div>
          <p style={{ fontSize: 15, color: '#ccc', lineHeight: 1.8 }}>{project.description}</p>
        </div>

        {/* Roles */}
        {project.idea_roles?.length > 0 && (
          <div style={{ padding: 22, border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Equipo buscado</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {project.idea_roles.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: `1px solid ${r.filled ? 'rgba(34,197,94,.3)' : '#222'}`, borderRadius: 8, background: r.filled ? 'rgba(34,197,94,.05)' : '#0a0a0a' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.filled ? '#22c55e' : '#333', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: r.filled ? '#22c55e' : '#ccc' }}>{r.role_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        {ai && (
          <div style={{ padding: 22, border: '1px solid #222', borderRadius: 12, marginBottom: 20, background: '#0a0a0a' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>🤖 Análisis Equia</div>
            {ai.pitch && <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.75, marginBottom: 16 }}>{ai.pitch}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 8, marginBottom: 14 }}>
              {[['Equipo', `${ai.teamSize} personas`], ['Complejidad', ai.complexity], ['Tiempo', ai.timeEstimate]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ padding: '12px 14px', background: '#000', border: '1px solid #1a1a1a', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E8611A' }}>{v}</div>
                </div>
              ))}
            </div>
            {ai.successTip && <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 8, fontSize: 13, color: '#22c55e', lineHeight: 1.6 }}>💡 {ai.successTip}</div>}
          </div>
        )}

        {/* CTA for talent */}
        {!isFormed && !profile && (
          <div style={{ padding: 24, border: '1px solid #E8611A', borderRadius: 12, background: 'rgba(232,97,26,.04)', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Este proyecto busca talento</div>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 18, lineHeight: 1.6 }}>Registrate como talento y la IA evaluará si sos un buen match.</p>
            <button className="btn-primary" onClick={() => navigate('/registro?rol=talento')} style={{ padding: '12px 28px', fontSize: 14 }}>Unirme →</button>
          </div>
        )}

      </div>
    </div>
  )
}
