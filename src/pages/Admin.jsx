import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'guillemuhana@gmail.com'
const TABS = ['Resumen', 'Usuarios', 'Ideas', 'Mensajes', 'Promociones', 'Actividad']

function Spinner({ size = 28 }) {
  return <div style={{ width: size, height: size, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
}

function StatCard({ label, value, sub, accent, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '20px 22px', background: accent ? 'linear-gradient(135deg,rgba(232,97,26,.06),#fff)' : '#fff', border: `1px solid ${accent ? 'rgba(232,97,26,.3)' : '#e8e8e8'}`, borderRadius: 12, cursor: onClick ? 'pointer' : 'default', transition: 'transform .15s', userSelect: 'none' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform = 'none')}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: accent ? '#E8611A' : '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', color: '#0a0a0a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#aaa', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14, fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' }
const ROLE_COLOR = { visionario: '#E8611A', talento: '#555', inversor: '#b45309', '—': '#bbb' }
const ROLE_BG = { visionario: 'rgba(232,97,26,.1)', talento: 'rgba(0,0,0,.05)', inversor: 'rgba(245,158,11,.1)', '—': '#f5f5f5' }
const fmt = d => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })
const fmtFull = d => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Resumen')
  const [loading, setLoading] = useState(true)

  // Data
  const [users, setUsers] = useState([])
  const [ideas, setIdeas] = useState([])
  const [messages, setMessages] = useState([])
  const [activity, setActivity] = useState([])
  const [stats, setStats] = useState(null)

  // UI state
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modal, setModal] = useState(null) // 'credits' | 'role' | 'promo' | 'deleteUser' | 'deleteIdea' | 'userDetail'
  const [creditInput, setCreditInput] = useState('')
  const [creditMode, setCreditMode] = useState('add') // 'add' | 'set' | 'subtract'
  const [roleInput, setRoleInput] = useState('')
  const [promoAmount, setPromoAmount] = useState('')
  const [promoTarget, setPromoTarget] = useState('all') // 'all' | 'talento' | 'visionario' | 'inversor'
  const [promoMsg, setPromoMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedIdea, setSelectedIdea] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login'); return }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    loadAll()
  }, [user, authLoading])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = async () => {
    setLoading(true)
    const [
      { data: usersData },
      { data: ideasData },
      { data: matchesData },
      { data: msgsData },
      { data: rolesData },
      { data: tpData },
    ] = await Promise.all([
      supabase.from('users').select('id, name, email, credits, is_admin, created_at, avatar_url, location, bio').order('created_at', { ascending: false }),
      supabase.from('ideas').select('id, title, category, stage, status, is_public, created_at, founder_id').order('created_at', { ascending: false }),
      supabase.from('matches').select('id, status, created_at, idea_id, talent_id'),
      supabase.from('direct_messages').select('id, content, read, created_at, sender_id, receiver_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('user_roles').select('user_id, role_type, is_primary'),
      supabase.from('talent_profiles').select('user_id, main_role, available'),
    ])

    const u = usersData || []
    const i = ideasData || []
    const m = matchesData || []
    const dm = msgsData || []
    const r = rolesData || []
    const tp = tpData || []

    const roleMap = {}; r.forEach(x => { if (x.is_primary) roleMap[x.user_id] = x.role_type })
    const tpMap = {}; tp.forEach(x => { tpMap[x.user_id] = x })

    const enriched = u.map(x => ({ ...x, role: roleMap[x.id] || '—', tp: tpMap[x.id] || null }))
    setUsers(enriched)
    setIdeas(i)
    setMessages(dm)

    const byRole = { visionario: 0, talento: 0, inversor: 0, sin_rol: 0 }
    enriched.forEach(x => { byRole[x.role] !== undefined ? byRole[x.role]++ : byRole.sin_rol++ })
    const totalCredits = enriched.reduce((a, x) => a + (x.credits || 0), 0)

    setStats({
      totalUsers: u.length, totalIdeas: i.length,
      activeIdeas: i.filter(x => x.status === 'active').length,
      totalMatches: m.length, acceptedMatches: m.filter(x => x.status === 'accepted').length,
      totalMessages: dm.length, unreadMessages: dm.filter(x => !x.read).length,
      totalCredits, avgCredits: u.length ? Math.round(totalCredits / u.length) : 0, byRole,
    })

    const acts = [
      ...u.slice(0, 15).map(x => ({ type: 'signup', label: `${x.name || x.email}`, role: roleMap[x.id], ts: x.created_at })),
      ...i.slice(0, 15).map(x => ({ type: 'idea', label: x.title, ts: x.created_at })),
      ...m.slice(0, 15).map(x => ({ type: 'match', label: `Match ${x.status}`, ts: x.created_at })),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 40)
    setActivity(acts)
    setLoading(false)
  }

  // ── Acciones ──
  const applyCredits = async () => {
    if (!selectedUser || !creditInput) return
    setSaving(true)
    const current = selectedUser.credits || 0
    const amount = parseInt(creditInput)
    const newVal = creditMode === 'add' ? current + amount : creditMode === 'subtract' ? Math.max(0, current - amount) : amount
    const { error } = await supabase.from('users').update({ credits: newVal }).eq('id', selectedUser.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, credits: newVal } : u))
      setSelectedUser(prev => ({ ...prev, credits: newVal }))
      showToast(`Créditos actualizados: ${newVal} pts`)
      setModal(null); setCreditInput('')
    }
    setSaving(false)
  }

  const applyRole = async () => {
    if (!selectedUser || !roleInput) return
    setSaving(true)
    await supabase.from('user_roles').upsert({ user_id: selectedUser.id, role_type: roleInput, is_primary: true })
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: roleInput } : u))
    setSelectedUser(prev => ({ ...prev, role: roleInput }))
    showToast(`Rol cambiado a ${roleInput}`)
    setModal(null)
    setSaving(false)
  }

  const deleteUser = async () => {
    if (!selectedUser) return
    setSaving(true)
    await supabase.from('users').delete().eq('id', selectedUser.id)
    await supabase.auth.admin?.deleteUser(selectedUser.id)
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    showToast(`Usuario eliminado`)
    setModal(null); setSelectedUser(null)
    setSaving(false)
  }

  const deleteIdea = async () => {
    if (!selectedIdea) return
    setSaving(true)
    await supabase.from('ideas').delete().eq('id', selectedIdea.id)
    setIdeas(prev => prev.filter(i => i.id !== selectedIdea.id))
    showToast(`Idea eliminada`)
    setModal(null); setSelectedIdea(null)
    setSaving(false)
  }

  const toggleIdeaStatus = async (idea) => {
    const newStatus = idea.status === 'active' ? 'inactive' : 'active'
    await supabase.from('ideas').update({ status: newStatus }).eq('id', idea.id)
    setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, status: newStatus } : i))
    showToast(`Idea ${newStatus === 'active' ? 'activada' : 'desactivada'}`)
  }

  const sendPromo = async () => {
    if (!promoAmount || parseInt(promoAmount) <= 0) return
    setSaving(true)
    const targets = promoTarget === 'all' ? users : users.filter(u => u.role === promoTarget)
    const amount = parseInt(promoAmount)
    await Promise.all(targets.map(u =>
      supabase.from('users').update({ credits: (u.credits || 0) + amount }).eq('id', u.id)
    ))
    setUsers(prev => prev.map(u => {
      if (promoTarget === 'all' || u.role === promoTarget) return { ...u, credits: (u.credits || 0) + amount }
      return u
    }))
    showToast(`✓ +${amount} créditos enviados a ${targets.length} usuarios`)
    setPromoAmount(''); setPromoMsg(''); setModal(null)
    setSaving(false)
  }

  if (authLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner /></div>
  if (!user || user.email !== ADMIN_EMAIL) return null

  const filteredUsers = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  const ACT_ICON = { signup: '👤', idea: '💡', match: '🤝' }

  return (
    <div style={{ background: '#f4f4f5', minHeight: '100vh', paddingTop: 64 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, padding: '12px 20px', background: toast.type === 'error' ? '#ef4444' : '#22c55e', color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 14, fontFamily: 'Inter,sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,.18)', animation: 'fadeUp .3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#0a0a0a', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#E8611A', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 4 }}>Panel Exclusivo · Admin</div>
            <h1 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Equia Business</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadAll} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#ccc', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>↻ Actualizar</button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', background: '#E8611A', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>← App</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e8e8', padding: '0 32px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '13px 20px', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#E8611A' : '#888', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #E8611A' : '2px solid transparent', cursor: 'pointer', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>
        ) : <>

          {/* ══ RESUMEN ══ */}
          {tab === 'Resumen' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>
                <StatCard label="Usuarios reales" value={stats.totalUsers} sub={`${stats.byRole.sin_rol} sin rol aún`} accent />
                <StatCard label="Ideas activas" value={stats.activeIdeas} sub={`${stats.totalIdeas} totales`} />
                <StatCard label="Matches aceptados" value={stats.acceptedMatches} sub={`${stats.totalMatches} totales`} />
                <StatCard label="Mensajes directos" value={stats.totalMessages} sub={`${stats.unreadMessages} sin leer`} />
                <StatCard label="Créditos totales" value={stats.totalCredits.toLocaleString('es-AR')} sub={`Promedio: ${stats.avgCredits} pts`} />
              </div>

              {/* Roles */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Distribución de roles</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                  {[{ label: 'Visionarios', val: stats.byRole.visionario, color: '#E8611A' }, { label: 'Talentos', val: stats.byRole.talento, color: '#555' }, { label: 'Inversores', val: stats.byRole.inversor, color: '#b45309' }, { label: 'Sin rol', val: stats.byRole.sin_rol, color: '#ccc' }].map(r => (
                    <div key={r.label} style={{ padding: '14px 16px', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: r.color }}>{r.val}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{r.label}</div>
                      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: '#f0f0f0' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: r.color, width: `${stats.totalUsers ? Math.round(r.val / stats.totalUsers * 100) : 0}%`, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Acciones rápidas</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => { setTab('Promociones') }} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 9, border: 'none', background: '#E8611A', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>🎁 Regalar créditos masivos</button>
                  <button onClick={() => setTab('Usuarios')} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, borderRadius: 9, border: '1px solid #d0d0d0', background: '#fff', color: '#444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>👥 Gestionar usuarios</button>
                  <button onClick={() => setTab('Ideas')} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, borderRadius: 9, border: '1px solid #d0d0d0', background: '#fff', color: '#444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>💡 Ver ideas</button>
                </div>
              </div>

              {/* Últimos registros */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>Últimos registros</div>
                {users.slice(0, 6).map(u => (
                  <div key={u.id} onClick={() => { setSelectedUser(u); setModal('userDetail') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background .15s', marginBottom: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                      {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: ROLE_BG[u.role], color: ROLE_COLOR[u.role] }}>{u.role}</span>
                    <span style={{ fontSize: 11, color: '#E8611A', fontWeight: 700 }}>⚡{u.credits ?? 0}</span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>{fmt(u.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ USUARIOS ══ */}
          {tab === 'Usuarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{filteredUsers.length} usuarios</div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre o email..." style={{ ...inputStyle, width: 260 }} />
              </div>

              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                {filteredUsers.map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f5f5f5' : 'none', flexWrap: 'wrap' }}>
                    {/* Avatar + nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.name?.[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || '—'}{u.is_admin && <span style={{ fontSize: 10, color: '#E8611A', marginLeft: 5 }}>★</span>}</div>
                        <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: ROLE_BG[u.role], color: ROLE_COLOR[u.role], flexShrink: 0 }}>{u.role}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#E8611A', flexShrink: 0 }}>⚡ {u.credits ?? 0}</span>
                    <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{fmt(u.created_at)}</span>
                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button onClick={() => { setSelectedUser(u); setModal('userDetail') }} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #e8e8e8', background: '#f8f8f8', color: '#555', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Ver</button>
                      <button onClick={() => { setSelectedUser(u); setCreditInput(''); setCreditMode('add'); setModal('credits') }} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(232,97,26,.3)', background: 'rgba(232,97,26,.06)', color: '#E8611A', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>⚡ Créditos</button>
                      <button onClick={() => { setSelectedUser(u); setRoleInput(u.role === '—' ? 'talento' : u.role); setModal('role') }} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #e8e8e8', background: '#f8f8f8', color: '#555', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Rol</button>
                      {!u.is_admin && <button onClick={() => { setSelectedUser(u); setModal('deleteUser') }} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.05)', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Eliminar</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ IDEAS ══ */}
          {tab === 'Ideas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{ideas.length} ideas en total · {ideas.filter(i => i.status === 'active').length} activas</div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                {ideas.map((idea, i) => (
                  <div key={idea.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < ideas.length - 1 ? '1px solid #f5f5f5' : 'none', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{idea.title}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {idea.category && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(232,97,26,.1)', color: '#E8611A' }}>{idea.category}</span>}
                        {idea.stage && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f0f0', color: '#777' }}>{idea.stage}</span>}
                        {idea.is_public && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f0f0', color: '#555' }}>pública</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{fmt(idea.created_at)}</span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleIdeaStatus(idea)} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: 'none', background: idea.status === 'active' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.08)', color: idea.status === 'active' ? '#22c55e' : '#ef4444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                        {idea.status === 'active' ? '● Activa' : '○ Inactiva'}
                      </button>
                      <button onClick={() => { setSelectedIdea(idea); setModal('deleteIdea') }} style={{ padding: '5px 11px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.05)', color: '#ef4444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MENSAJES ══ */}
          {tab === 'Mensajes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 12 }}>
                <StatCard label="Total mensajes" value={messages.length} />
                <StatCard label="Sin leer" value={messages.filter(m => !m.read).length} accent />
                <StatCard label="Leídos" value={messages.filter(m => m.read).length} />
              </div>
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 700 }}>Últimos 100 mensajes directos</div>
                {messages.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', borderBottom: i < messages.length - 1 ? '1px solid #f5f5f5' : 'none', background: m.read ? '#fff' : 'rgba(232,97,26,.02)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{m.content}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>De: {m.sender_id?.slice(0, 8)}… → A: {m.receiver_id?.slice(0, 8)}…</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: m.read ? '#f0f0f0' : 'rgba(232,97,26,.1)', color: m.read ? '#999' : '#E8611A', fontWeight: 600 }}>{m.read ? 'leído' : 'sin leer'}</span>
                      <span style={{ fontSize: 11, color: '#bbb' }}>{fmtFull(m.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ PROMOCIONES ══ */}
          {tab === 'Promociones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Regalo masivo */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '28px 28px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🎁 Regalo de créditos masivo</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Enviá créditos a un grupo de usuarios de golpe.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Destinatarios</label>
                    <select value={promoTarget} onChange={e => setPromoTarget(e.target.value)} style={inputStyle}>
                      <option value="all">Todos los usuarios ({users.length})</option>
                      <option value="visionario">Solo Visionarios ({stats?.byRole.visionario})</option>
                      <option value="talento">Solo Talentos ({stats?.byRole.talento})</option>
                      <option value="inversor">Solo Inversores ({stats?.byRole.inversor})</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Créditos a regalar</label>
                    <input type="number" value={promoAmount} onChange={e => setPromoAmount(e.target.value)} placeholder="Ej: 100" style={inputStyle} min="1" />
                  </div>
                  <div style={{ padding: '14px 16px', background: '#f8f9fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
                    Se van a sumar <strong style={{ color: '#E8611A' }}>+{promoAmount || 0} créditos</strong> a{' '}
                    <strong>{promoTarget === 'all' ? users.length : stats?.byRole[promoTarget] || 0} usuarios</strong>
                  </div>
                  <button onClick={sendPromo} disabled={!promoAmount || saving} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 10, border: 'none', background: promoAmount ? '#E8611A' : '#f0f0f0', color: promoAmount ? '#fff' : '#bbb', cursor: promoAmount ? 'pointer' : 'default', fontFamily: 'Inter,sans-serif', transition: 'all .2s' }}>
                    {saving ? 'Enviando...' : `🎁 Enviar +${promoAmount || 0} créditos`}
                  </button>
                </div>
              </div>

              {/* Regalo individual rápido */}
              <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '28px 28px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>⚡ Regalo individual</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Seleccioná un usuario y editá sus créditos.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {users.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{u.name || u.email}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{u.role}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#E8611A', flexShrink: 0 }}>⚡ {u.credits ?? 0}</span>
                      <button onClick={() => { setSelectedUser(u); setCreditInput(''); setCreditMode('add'); setModal('credits') }} style={{ padding: '6px 13px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: '1px solid rgba(232,97,26,.3)', background: 'rgba(232,97,26,.06)', color: '#E8611A', cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>Editar</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ACTIVIDAD ══ */}
          {tab === 'Actividad' && (
            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', background: '#f8f9fa', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 700 }}>Feed de actividad reciente</div>
              {activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < activity.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ACT_ICON[a.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</div>
                    {a.role && <div style={{ fontSize: 11, color: ROLE_COLOR[a.role] }}>{a.role}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtFull(a.ts)}</span>
                </div>
              ))}
            </div>
          )}

        </>}
      </div>

      {/* ══ MODALES ══ */}

      {/* Ver detalle usuario */}
      {modal === 'userDetail' && selectedUser && (
        <Modal title={selectedUser.name || selectedUser.email} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: '#f8f9fa', borderRadius: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#E8611A', overflow: 'hidden', flexShrink: 0 }}>
                {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedUser.name?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{selectedUser.email}</div>
                {selectedUser.location && <div style={{ fontSize: 12, color: '#888' }}>📍 {selectedUser.location}</div>}
              </div>
            </div>
            {[['Rol', selectedUser.role], ['Créditos', `⚡ ${selectedUser.credits ?? 0}`], ['Registro', fmtFull(selectedUser.created_at)]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fa', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#888' }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            {selectedUser.bio && <div style={{ padding: '12px 14px', background: '#f8f9fa', borderRadius: 8, fontSize: 13, color: '#555', lineHeight: 1.6 }}>{selectedUser.bio}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => { setModal('credits'); setCreditInput(''); setCreditMode('add') }} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', background: '#E8611A', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>⚡ Editar créditos</button>
              <button onClick={() => setModal('role')} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1px solid #d0d0d0', background: '#fff', color: '#444', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cambiar rol</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Editar créditos */}
      {modal === 'credits' && selectedUser && (
        <Modal title={`Créditos — ${selectedUser.name?.split(' ')[0]}`} onClose={() => setModal(null)}>
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#888' }}>Créditos actuales</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#E8611A' }}>⚡ {selectedUser.credits ?? 0}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['add', '+ Sumar'], ['subtract', '− Restar'], ['set', '= Fijar']].map(([val, label]) => (
              <button key={val} onClick={() => setCreditMode(val)} style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 700, borderRadius: 7, border: `1px solid ${creditMode === val ? '#E8611A' : '#e0e0e0'}`, background: creditMode === val ? 'rgba(232,97,26,.08)' : '#fff', color: creditMode === val ? '#E8611A' : '#888', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>{label}</button>
            ))}
          </div>
          <input type="number" value={creditInput} onChange={e => setCreditInput(e.target.value)} placeholder="Cantidad de créditos" style={{ ...inputStyle, marginBottom: 14 }} min="0" autoFocus />
          <div style={{ fontSize: 12, color: '#888', marginBottom: 16, padding: '10px 14px', background: '#f8f9fa', borderRadius: 8 }}>
            Resultado: <strong style={{ color: '#E8611A' }}>
              {creditMode === 'add' ? (selectedUser.credits || 0) + (parseInt(creditInput) || 0)
                : creditMode === 'subtract' ? Math.max(0, (selectedUser.credits || 0) - (parseInt(creditInput) || 0))
                : (parseInt(creditInput) || 0)} créditos
            </strong>
          </div>
          <button onClick={applyCredits} disabled={!creditInput || saving} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
            {saving ? 'Guardando...' : 'Aplicar cambio'}
          </button>
        </Modal>
      )}

      {/* Cambiar rol */}
      {modal === 'role' && selectedUser && (
        <Modal title={`Rol — ${selectedUser.name?.split(' ')[0]}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {['visionario', 'talento', 'inversor'].map(r => (
              <button key={r} onClick={() => setRoleInput(r)} style={{ padding: '12px 16px', fontSize: 14, fontWeight: roleInput === r ? 700 : 500, borderRadius: 9, border: `1px solid ${roleInput === r ? '#E8611A' : '#e0e0e0'}`, background: roleInput === r ? 'rgba(232,97,26,.06)' : '#fff', color: roleInput === r ? '#E8611A' : '#555', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', textTransform: 'capitalize' }}>
                {r === 'visionario' ? '🔥' : r === 'talento' ? '⚡' : '💼'} {r}
              </button>
            ))}
          </div>
          <button onClick={applyRole} disabled={saving} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14 }}>
            {saving ? 'Guardando...' : 'Cambiar rol'}
          </button>
        </Modal>
      )}

      {/* Eliminar usuario */}
      {modal === 'deleteUser' && selectedUser && (
        <Modal title="Eliminar usuario" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>¿Eliminar a <strong>{selectedUser.name || selectedUser.email}</strong>?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Se borra todo su contenido. Esta acción no se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 600, borderRadius: 9, border: '1px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancelar</button>
              <button onClick={deleteUser} disabled={saving} style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 700, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {saving ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Eliminar idea */}
      {modal === 'deleteIdea' && selectedIdea && (
        <Modal title="Eliminar idea" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>¿Eliminar <strong>"{selectedIdea.title}"</strong>?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Se eliminan también sus matches y roles. No se puede deshacer.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 600, borderRadius: 9, border: '1px solid #d0d0d0', background: '#fff', color: '#555', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancelar</button>
              <button onClick={deleteIdea} disabled={saving} style={{ flex: 1, padding: '11px', fontSize: 14, fontWeight: 700, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {saving ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
