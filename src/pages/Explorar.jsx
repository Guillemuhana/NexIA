import { useState, useEffect } from 'react'
import { SKILL_ROLES } from '../lib/constants'
import TalentCard from '../components/TalentCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function InviteModal({ talent, ideaId, onClose, onSuccess }) {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleInvite = async () => {
    if (!ideaId) { setError('No tenés una idea activa para invitar talentos.'); return }
    setSending(true); setError('')
    try {
      // Evitar duplicados
      const { data: existing } = await supabase
        .from('matches')
        .select('id, status')
        .eq('idea_id', ideaId)
        .eq('talent_id', talent.id)
        .maybeSingle()

      if (existing) {
        setError(`Ya invitaste a ${talent.name} (estado: ${existing.status}).`)
        return
      }

      const { error: matchErr } = await supabase.from('matches').insert({
        idea_id: ideaId,
        talent_id: talent.id,
        status: 'invited',
        role_suggested: talent.role || '',
        score: talent.score || 0,
      })

      if (matchErr) { setError('Error al enviar la invitación. Intentá de nuevo.'); return }
      setDone(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1800)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>¡Invitación enviada!</div>
            <div style={{ fontSize: 13, color: '#666' }}>{talent.name} puede aceptar o rechazar desde su dashboard.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Invitar talento</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{talent.name}</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>{talent.role}{talent.location ? ` · ${talent.location}` : ''}</div>

            <div style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: 10, fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
              Se le enviará una invitación a su panel. Podrá aceptar o rechazar la propuesta de unirse a tu proyecto.
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', fontSize: 14, background: 'none', border: '1px solid #d0d0d0', borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif', color: '#444' }}>
                Cancelar
              </button>
              <button onClick={handleInvite} disabled={sending} className="btn-primary" style={{ flex: 1, padding: '11px', fontSize: 14, opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Enviando...' : 'Confirmar invitación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Explorar() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterAvail, setFilterAvail] = useState(false)
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteTarget, setInviteTarget] = useState(null)
  const { profile } = useAuth()

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => { if (!cancelled) setLoading(false) }, 10000)

    const load = async () => {
      // Query 1: talent profiles (no nested joins)
      const { data: profiles } = await supabase
        .from('talent_profiles')
        .select('user_id, available, main_role, match_score_avg, projects_count')
        .order('user_id')

      if (!profiles?.length) { if (!cancelled) setLoading(false); return }

      // Query 2: users separately
      const userIds = profiles.map(p => p.user_id)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, avatar_url, location, bio')
        .in('id', userIds)

      const usersById = {}
      ;(usersData || []).forEach(u => { usersById[u.id] = u })

      // Query 3: skills separately
      const { data: skillRows } = await supabase
        .from('user_skills')
        .select('user_id, skills(name)')

      const skillsByUser = {}
      ;(skillRows || []).forEach(row => {
        if (!skillsByUser[row.user_id]) skillsByUser[row.user_id] = []
        if (row.skills?.name) skillsByUser[row.user_id].push(row.skills.name)
      })

      const mapped = profiles
        .filter(p => usersById[p.user_id])
        .map(p => {
          const u = usersById[p.user_id]
          return {
            id: u.id,
            name: u.name || 'Usuario',
            avatar: (u.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            avatar_url: u.avatar_url || null,
            location: u.location || '',
            bio: u.bio || '',
            role: p.main_role || '',
            available: p.available,
            score: Math.round(p.match_score_avg || 0),
            projects: p.projects_count || 0,
            skills: skillsByUser[p.user_id] || [],
          }
        })

      if (!cancelled) { setTalents(mapped); setLoading(false) }
    }

    load().catch(() => { if (!cancelled) setLoading(false) }).finally(() => clearTimeout(timer))
    return () => { cancelled = true; clearTimeout(timer) }
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
          filtered.map(t => (
            <TalentCard
              key={t.id}
              talent={t}
              showInvite={isVisionario}
              onInvite={t => setInviteTarget(t)}
            />
          ))
        )}
      </div>

      {inviteTarget && (
        <InviteModal
          talent={inviteTarget}
          ideaId={profile?.idea_id}
          onClose={() => setInviteTarget(null)}
          onSuccess={() => setInviteTarget(null)}
        />
      )}
    </div>
  )
}
