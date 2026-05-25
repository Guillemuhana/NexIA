import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'guillemuhana@gmail.com'

function Spinner() {
  return <div style={{ width: 28, height: 28, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ padding: '20px 22px', background: '#fff', border: `1px solid ${accent ? 'rgba(232,97,26,.25)' : '#e8e8e8'}`, borderRadius: 12, background: accent ? 'linear-gradient(135deg,rgba(232,97,26,.04),#fff)' : '#fff' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: accent ? '#E8611A' : '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', color: '#0a0a0a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

const TABS = ['Resumen', 'Usuarios', 'Ideas', 'Mensajes', 'Actividad']

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Resumen')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [ideas, setIdeas] = useState([])
  const [messages, setMessages] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [editCredit, setEditCredit] = useState(null) // { id, credits }
  const [savingCredit, setSavingCredit] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    const [
      { data: usersData },
      { data: ideasData },
      { data: matchesData },
      { data: msgsData },
      { data: rolesData },
    ] = await Promise.all([
      supabase.from('users').select('id, name, email, credits, is_admin, created_at, avatar_url, location').order('created_at', { ascending: false }),
      supabase.from('ideas').select('id, title, category, stage, status, is_public, created_at, founder_id').order('created_at', { ascending: false }),
      supabase.from('matches').select('id, status, created_at'),
      supabase.from('direct_messages').select('id, content, read, created_at, sender_id, receiver_id').order('created_at', { ascending: false }).limit(50),
      supabase.from('user_roles').select('user_id, role_type, is_primary'),
    ])

    const u = usersData || []
    const i = ideasData || []
    const m = matchesData || []
    const dm = msgsData || []
    const r = rolesData || []

    // enrich users with role
    const roleMap = {}
    r.forEach(role => { if (role.is_primary) roleMap[role.user_id] = role.role_type })
    const enrichedUsers = u.map(user => ({ ...user, role: roleMap[user.id] || '—' }))

    setUsers(enrichedUsers)
    setIdeas(i)
    setMessages(dm)

    // stats
    const byRole = { visionario: 0, talento: 0, inversor: 0, sin_rol: 0 }
    enrichedUsers.forEach(u => {
      if (u.role === 'visionario') byRole.visionario++
      else if (u.role === 'talento') byRole.talento++
      else if (u.role === 'inversor') byRole.inversor++
      else byRole.sin_rol++
    })
    const totalCredits = enrichedUsers.reduce((acc, u) => acc + (u.credits || 0), 0)
    const accepted = m.filter(x => x.status === 'accepted').length

    setStats({
      totalUsers: u.length,
      totalIdeas: i.length,
      activeIdeas: i.filter(x => x.status === 'active').length,
      totalMatches: m.length,
      acceptedMatches: accepted,
      totalMessages: dm.length,
      unreadMessages: dm.filter(x => !x.read).length,
      totalCredits,
      avgCredits: u.length ? Math.round(totalCredits / u.length) : 0,
      byRole,
    })

    // actividad reciente: mezcla de signups + ideas + matches
    const acts = [
      ...u.slice(0, 10).map(x => ({ type: 'signup', label: `Nuevo usuario: ${x.name || x.email}`, role: roleMap[x.id], ts: x.created_at })),
      ...i.slice(0, 10).map(x => ({ type: 'idea', label: `Nueva idea: ${x.title}`, ts: x.created_at })),
      ...m.slice(0, 10).map(x => ({ type: 'match', label: `Match ${x.status}`, ts: x.created_at })),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 30)
    setActivity(acts)

    setLoading(false)
  }

  const saveCredits = async () => {
    if (!editCredit) return
    setSavingCredit(true)
    await supabase.from('users').update({ credits: editCredit.credits }).eq('id', editCredit.id)
    setUsers(prev => prev.map(u => u.id === editCredit.id ? { ...u, credits: editCredit.credits } : u))
    setEditCredit(null)
    setSavingCredit(false)
  }

  if (!user || user.email !== ADMIN_EMAIL) return null

  const fmt = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  const fmtShort = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })

  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const ROLE_COLOR = { visionario: '#E8611A', talento: '#555', inversor: '#b45309', '—': '#ccc' }
  const ROLE_BG = { visionario: 'rgba(232,97,26,.1)', talento: 'rgba(0,0,0,.05)', inversor: 'rgba(245,158,11,.1)', '—': '#f5f5f5' }
  const ACT_ICON = { signup: '👤', idea: '💡', match: '🤝' }

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingTop: 64 }}>

      {/* Header */}
      <div style={{ background: '#0a0a0a', padding: '28px 32px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Panel Exclusivo</div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Admin · Equia</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={loadAll} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              ↻ Actualizar
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: '#E8611A', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#E8611A' : '#888', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #E8611A' : '2px solid transparent', cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 60px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner /></div>
        ) : (

          <>
            {/* ── RESUMEN ── */}
            {tab === 'Resumen' && stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Fila 1 — KPIs principales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                  <StatCard label="Usuarios totales" value={stats.totalUsers} sub={`+${stats.byRole.sin_rol} sin rol`} accent />
                  <StatCard label="Ideas lanzadas" value={stats.totalIdeas} sub={`${stats.activeIdeas} activas`} />
                  <StatCard label="Matches totales" value={stats.totalMatches} sub={`${stats.acceptedMatches} aceptados`} />
                  <StatCard label="Mensajes directos" value={stats.totalMessages} sub={`${stats.unreadMessages} sin leer`} />
                  <StatCard label="Créditos en circulación" value={stats.totalCredits.toLocaleString('es-AR')} sub={`Promedio: ${stats.avgCredits} pts`} />
                </div>

                {/* Fila 2 — Por rol */}
                <div style={{ padding: '22px 24px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 18 }}>Distribución por rol</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                    {[
                      { label: 'Visionarios', val: stats.byRole.visionario, color: '#E8611A' },
                      { label: 'Talentos', val: stats.byRole.talento, color: '#555' },
                      { label: 'Inversores', val: stats.byRole.inversor, color: '#b45309' },
                      { label: 'Sin rol', val: stats.byRole.sin_rol, color: '#ccc' },
                    ].map(r => (
                      <div key={r.label} style={{ padding: '14px 16px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: r.color }}>{r.val}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{r.label}</div>
                        <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: '#f0f0f0', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: r.color, width: `${stats.totalUsers ? Math.round(r.val / stats.totalUsers * 100) : 0}%` }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{stats.totalUsers ? Math.round(r.val / stats.totalUsers * 100) : 0}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fila 3 — Últimos registros */}
                <div style={{ padding: '22px 24px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Últimos 5 registros</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8611A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
                          {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: ROLE_BG[u.role], color: ROLE_COLOR[u.role] }}>{u.role}</span>
                        <span style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{fmtShort(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ── USUARIOS ── */}
            {tab === 'Usuarios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{filteredUsers.length} usuarios</div>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    style={{ padding: '9px 14px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14, fontFamily: 'Inter,sans-serif', outline: 'none', width: 260 }}
                  />
                </div>

                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px 80px', gap: 0, padding: '10px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8' }}>
                    {['Usuario', 'Email', 'Rol', 'Créditos', 'Registro', ''].map(h => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {filteredUsers.map((u, i) => (
                    <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 120px 80px', gap: 0, padding: '13px 18px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#E8611A', flexShrink: 0, overflow: 'hidden' }}>
                          {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name?.[0] || '?').toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || '—'}{u.is_admin && <span style={{ fontSize: 10, marginLeft: 5, color: '#E8611A' }}>★ admin</span>}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      <div><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: ROLE_BG[u.role], color: ROLE_COLOR[u.role] }}>{u.role}</span></div>
                      <div>
                        {editCredit?.id === u.id ? (
                          <input
                            type="number"
                            value={editCredit.credits}
                            onChange={e => setEditCredit(prev => ({ ...prev, credits: Number(e.target.value) }))}
                            style={{ width: 70, padding: '4px 8px', border: '1px solid #E8611A', borderRadius: 6, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none' }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#E8611A' }}>⚡ {u.credits ?? 0}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#bbb' }}>{fmtShort(u.created_at)}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {editCredit?.id === u.id ? (
                          <>
                            <button onClick={saveCredits} disabled={savingCredit} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>✓</button>
                            <button onClick={() => setEditCredit(null)} style={{ padding: '4px 8px', fontSize: 11, background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setEditCredit({ id: u.id, credits: u.credits ?? 0 })} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: '#f5f5f5', color: '#555', border: '1px solid #e8e8e8', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Editar</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── IDEAS ── */}
            {tab === 'Ideas' && (
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', fontSize: 14, fontWeight: 700 }}>{ideas.length} ideas en total</div>
                {ideas.map((idea, i) => (
                  <div key={idea.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < ideas.length - 1 ? '1px solid #f5f5f5' : 'none', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{idea.title}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {idea.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A' }}>{idea.category}</span>}
                        {idea.stage && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f0f0', color: '#777' }}>{idea.stage}</span>}
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: idea.status === 'active' ? 'rgba(34,197,94,.1)' : '#f5f5f5', color: idea.status === 'active' ? '#22c55e' : '#999' }}>{idea.status}</span>
                        {idea.is_public && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f0f0', color: '#555' }}>pública</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{fmtShort(idea.created_at)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── MENSAJES ── */}
            {tab === 'Mensajes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                  <StatCard label="Total mensajes" value={messages.length} />
                  <StatCard label="Sin leer" value={messages.filter(m => !m.read).length} accent />
                  <StatCard label="Leídos" value={messages.filter(m => m.read).length} />
                </div>
                <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', fontSize: 14, fontWeight: 700 }}>Últimos 50 mensajes directos</div>
                  {messages.map((m, i) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 18px', borderBottom: i < messages.length - 1 ? '1px solid #f5f5f5' : 'none', background: m.read ? '#fff' : 'rgba(232,97,26,.02)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</div>
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>De: {m.sender_id?.slice(0, 8)}… → A: {m.receiver_id?.slice(0, 8)}…</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: m.read ? '#f0f0f0' : 'rgba(232,97,26,.1)', color: m.read ? '#999' : '#E8611A', fontWeight: 600 }}>{m.read ? 'leído' : 'sin leer'}</span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>{fmt(m.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ACTIVIDAD ── */}
            {tab === 'Actividad' && (
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', fontSize: 14, fontWeight: 700 }}>Feed de actividad reciente</div>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < activity.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{ACT_ICON[a.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
                      {a.role && <div style={{ fontSize: 11, color: ROLE_COLOR[a.role] }}>{a.role}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(a.ts)}</span>
                  </div>
                ))}
              </div>
            )}

          </>
        )}
      </div>

    </div>
  )
}
