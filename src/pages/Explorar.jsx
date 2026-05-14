import { useState, useEffect } from 'react'
import { SKILL_ROLES } from '../lib/constants'
import TalentCard from '../components/TalentCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'


export default function Explorar() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterAvail, setFilterAvail] = useState(false)
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase
        .from('talent_profiles')
        .select('user_id, available, main_role, match_score_avg, projects_count, users(id, name, avatar_url, location, bio)')

      if (!profiles?.length) { setLoading(false); return }

      const userIds = profiles.map(p => p.user_id)
      const { data: skillRows } = await supabase
        .from('user_skills')
        .select('user_id, skills(name)')
        .in('user_id', userIds)

      const skillsByUser = {}
      ;(skillRows || []).forEach(row => {
        if (!skillsByUser[row.user_id]) skillsByUser[row.user_id] = []
        if (row.skills?.name) skillsByUser[row.user_id].push(row.skills.name)
      })

      const mapped = profiles
        .filter(p => p.users)
        .map(p => ({
          id: p.users.id || p.user_id,
          name: p.users.name || 'Usuario',
          avatar: (p.users.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          avatar_url: p.users.avatar_url || null,
          location: p.users.location || '',
          bio: p.users.bio || '',
          role: p.main_role || '',
          available: p.available,
          score: Math.round(p.match_score_avg || 0),
          projects: p.projects_count || 0,
          skills: skillsByUser[p.user_id] || [],
        }))

      setTalents(mapped)
      setLoading(false)
    }
    load().catch(() => setLoading(false))
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
      <div style={{ padding: '100px 24px 32px', borderBottom: '1px solid #e8e8e8', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Directorio</div>
        <h1 style={{ fontSize: 'clamp(32px,7vw,54px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>Talento disponible</h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 28 }}>
          {isVisionario ? 'Explorá perfiles y agregálos a tu proyecto manualmente, o dejá que la IA lo haga por vos.' : 'Profesionales listos para sumarse a proyectos que los apasionen.'}
        </p>

        <div className="filter-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', flex: 1, minWidth: 200, border: '1px solid #e8e8e8', borderRadius: 10, padding: 8, background: '#f8f9fa', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, rol o habilidad..." style={{ flex: 1, background: 'none', border: 'none', color: '#0a0a0a', fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input" style={{ width: 200, padding: '8px 12px' }}>
            <option value="all">Todos los roles</option>
            {SKILL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', border: '1px solid #e8e8e8', borderRadius: 10, background: filterAvail ? 'rgba(34,197,94,.08)' : '#f8f9fa', color: filterAvail ? '#22c55e' : '#666', fontSize: 14, fontWeight: 500, transition: 'all .15s' }}>
            <input type="checkbox" checked={filterAvail} onChange={e => setFilterAvail(e.target.checked)} style={{ accentColor: '#22c55e' }} />
            Solo disponibles
          </label>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          {loading ? 'Cargando...' : `${filtered.length} profesionales encontrados`}
        </p>
      </div>

      <div className="cards-grid" style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', borderLeft: '1px solid #e8e8e8', borderRight: '1px solid #e8e8e8' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', gridColumn: '1/-1' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', gridColumn: '1/-1' }}>
            {talents.length === 0 ? 'Todavía no hay talentos registrados.' : 'No se encontraron perfiles con esos filtros.'}
          </div>
        ) : (
          filtered.map(t => <TalentCard key={t.id} talent={t} showInvite={isVisionario} />)
        )}
      </div>
    </div>
  )
}
