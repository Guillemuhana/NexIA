export default function ProjectCard({ project, onFavorite, showContact = false }) {
  return (
    <div className="card" style={{ padding: 24, transition: 'all .2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#222'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.3px' }}>{project.title}</span>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: project.formed ? 'rgba(34,197,94,.1)' : 'rgba(232,97,26,.1)', color: project.formed ? '#22c55e' : '#E8611A', fontWeight: 600 }}>
              {project.formed ? '✓ Equipo formado' : 'Buscando equipo'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="tag">{project.category}</span>
            <span className="tag">{project.stage}</span>
          </div>
        </div>
        {project.raised && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#555' }}>Financiamiento</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: project.raised === 'Buscando' ? '#E8611A' : '#22c55e' }}>{project.raised}</div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 20 }}>{project.description}</p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#444', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Equipo</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {project.team.map(r => (
            <span key={r} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 4, background: '#111', color: '#555', border: '1px solid #1a1a1a' }}>{r}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 13, color: '#555' }}>Por {project.founder}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {onFavorite && (
            <button onClick={() => onFavorite(project)} style={{ padding: '7px 12px', fontSize: 12, background: 'none', border: '1px solid #222', color: '#666', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              ★ Guardar
            </button>
          )}
          {showContact && (
            <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
              Contactar →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
