import { useState, useEffect } from 'react'
import { SKILL_ROLES } from '../lib/constants'
import TalentCard from '../components/TalentCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function mapTalent(tp) {
  const u = tp.users || {}
  return {
    id: u.id || tp.user_id,
    name: u.name || 'Usuario',
    avatar: u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?',
    location: u.location || '',
    bio: u.bio || '',
    role: tp.main_role || '',
    available: tp.available,
    score: Math.round(tp.match_score_avg || 0),
    projects: tp.projects_count || 0,
    skills: (u.user_skills || []).map(us => us.skills?.name).filter(Boolean),
  }
}

export default function Explorar() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterAvail, setFilterAvail] = useState(false)
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    supabase
      .from('talent_profiles')
      .select('user_id, available, main_role, match_score_avg, projects_count, users!inner(id, name, avatar_url, location, bio, user_skills(skills(name)))')
      .then(({ data, error }) => {
        if (!error && data) setTalents(data.map(mapTalent))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = talents.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q) || t.skills.some(s => s.toLowerCase().includes(q))
    const matchRole = filterRole === 'all' || t.role === filterRole
    const matchAvail = !filterAvail || t.available
    return matchSearch && matchRole && matchAvail
  })

  const isVisionario = profile?.type === 'visionario'

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 32px', borderBottom: '1px solid #1a1a1a', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Directorio</div>
        <h1 style={{ fontSize: 'clamp(32px,7vw,54px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Talento disponible</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 28 }}>
          {isVisionario ? 'Explorá perfiles y agregálos a tu proyecto manualmente, o dejá que la IA lo haga por vos.' : 'Profesionales listos para sumarse a proyectos que los apasionen.'}
        </p>

        <div className="filter-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', flex: 1, minWidth: 200, border: '1px solid #1a1a1a', borderRadius: 10, padding: 8, background: '#0a0a0a', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, rol o habilidad..." style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input" style={{ width: 200, padding: '8px 12px' }}>
            <option value="all">Todos los roles</option>
            {SKILL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', border: '1px solid #1a1a1a', borderRadius: 10, background: filterAvail ? 'rgba(34,197,94,.08)' : '#0a0a0a', color: filterAvail ? '#22c55e' : '#666', fontSize: 14, fontWeight: 500, transition: 'all .15s' }}>
            <input type="checkbox" checked={filterAvail} onChange={e => setFilterAvail(e.target.checked)} style={{ accentColor: '#22c55e' }} />
            Solo disponibles
          </label>
        </div>
        <p style={{ fontSize: 13, color: '#555' }}>
          {loading ? 'Cargando...' : `${filtered.length} profesionales encontrados`}
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', borderLeft: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#555', gridColumn: '1/-1' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #222', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#555', gridColumn: '1/-1' }}>
            {talents.length === 0 ? 'Todavía no hay talentos registrados.' : 'No se encontraron perfiles con esos filtros.'}
          </div>
        ) : (
          filtered.map(t => <TalentCard key={t.id} talent={t} showInvite={isVisionario} />)
        )}
      </div>
    </div>
  )
}
