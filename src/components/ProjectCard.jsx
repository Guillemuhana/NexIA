import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProjectCard({ project, onFavorite, showContact = false }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/proyectos/${project.id}`
    if (navigator.share) {
      try { await navigator.share({ title: project.title, text: project.description?.slice(0, 100), url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      onClick={() => navigate(`/proyectos/${project.id}`)}
      style={{ padding: 20, background: '#f8f9fa', border: '1px solid #e8e8e8', borderRadius: 12, cursor: 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: project.formed ? 'rgba(34,197,94,.1)' : 'rgba(232,97,26,.1)', color: project.formed ? '#22c55e' : '#E8611A', fontWeight: 700, border: `1px solid ${project.formed ? 'rgba(34,197,94,.2)' : 'rgba(232,97,26,.2)'}` }}>
          {project.formed ? '✓ Equipo formado' : '⚡ Buscando equipo'}
        </span>
        <button onClick={handleShare} title="Compartir" style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #e8e8e8', borderRadius: 6, cursor: 'pointer', color: copied ? '#22c55e' : '#777', fontSize: 14, transition: 'all .15s', flexShrink: 0 }}>
          {copied ? '✓' : '↗'}
        </button>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 8, lineHeight: 1.35 }}>{project.title}</h3>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {project.category && <span className="tag">{project.category}</span>}
        {project.stage && <span className="tag">{project.stage}</span>}
      </div>

      {/* Description clipped */}
      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {project.description}
      </p>

      {/* Team roles */}
      {project.team?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Equipo</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {project.team.slice(0, 3).map(r => (
              <span key={r} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#f0f0f0', color: '#666', border: '1px solid #e8e8e8' }}>{r}</span>
            ))}
            {project.team.length > 3 && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#f0f0f0', color: '#777', border: '1px solid #e8e8e8' }}>+{project.team.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #e8e8e8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f0f0f0', border: '1px solid #d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, color: '#E8611A', flexShrink: 0 }}>
            {project.founder?.[0]?.toUpperCase() || '?'}
          </div>
          <span style={{ fontSize: 12, color: '#666' }}>{project.founder}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          {onFavorite && (
            <button onClick={() => onFavorite(project)} style={{ padding: '5px 10px', fontSize: 12, background: 'none', border: '1px solid #d0d0d0', color: '#666', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              ★
            </button>
          )}
          {showContact && (
            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
              Contactar →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
