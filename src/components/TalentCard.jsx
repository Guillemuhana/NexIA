import { useNavigate } from 'react-router-dom'

export default function TalentCard({ talent, onInvite, showInvite = false }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/talento/${talent.id}`)}
      style={{ padding: 20, background: '#ffffff', borderBottom: '1px solid #e8e8e8', transition: 'background .15s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0f0f0', border: '1px solid #d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#E8611A', flexShrink: 0 }}>
          {talent.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px' }}>{talent.name}</span>
            <span className={talent.available ? 'dot-on' : 'dot-off'} />
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 1 }}>{talent.role}</div>
          {talent.location && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>📍 {talent.location}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#E8611A', letterSpacing: -1 }}>{talent.score}</div>
          <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>match %</div>
        </div>
      </div>

      {talent.bio && (
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{talent.bio}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {talent.skills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
        {talent.skills.length > 4 && <span className="tag">+{talent.skills.length - 4}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
        <span style={{ fontSize: 12, color: '#666' }}>{talent.projects} proyectos</span>
        <div style={{ display: 'flex', gap: 7 }} onClick={e => e.stopPropagation()}>
          {showInvite && (
            <button onClick={() => onInvite?.(talent)} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
              Invitar →
            </button>
          )}
          <button
            onClick={() => navigate(`/talento/${talent.id}`)}
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'none', border: '1px solid #d0d0d0', color: '#0a0a0a', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#E8611A'; e.target.style.color = '#E8611A' }}
            onMouseLeave={e => { e.target.style.borderColor = '#d0d0d0'; e.target.style.color = '#0a0a0a' }}
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  )
}
