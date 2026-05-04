export default function TalentCard({ talent, onInvite, showInvite = false }) {
  return (
    <div style={{ padding: 22, background: '#000', borderBottom: '1px solid #1a1a1a', transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#0a0a0a'}
      onMouseLeave={e => e.currentTarget.style.background = '#000'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#E8611A', flexShrink: 0 }}>
          {talent.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px' }}>{talent.name}</span>
            <span className={talent.available ? 'dot-on' : 'dot-off'} />
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 1 }}>{talent.role}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 3 }}>📍 {talent.location}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#E8611A', letterSpacing: -1 }}>{talent.score}</div>
          <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>match %</div>
        </div>
      </div>

      {talent.bio && (
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 14 }}>{talent.bio}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {talent.skills.map(s => <span key={s} className="tag">{s}</span>)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 12, color: '#555' }}>{talent.projects} proyectos completados</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {showInvite && (
            <button onClick={() => onInvite?.(talent)} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>
              Invitar →
            </button>
          )}
          <button style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: 'none', border: '1px solid #222', color: '#fff', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#E8611A'; e.target.style.color = '#E8611A' }}
            onMouseLeave={e => { e.target.style.borderColor = '#222'; e.target.style.color = '#fff' }}>
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  )
}
