import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SKILL_ROLES, CATEGORIES, PROJECT_STAGES } from '../lib/constants'
import { matchTeam } from '../lib/claude'
import { supabase } from '../lib/supabase'
import TalentCard from '../components/TalentCard'
import PaywallModal from '../components/PaywallModal'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  'Analizando descripción del proyecto...',
  'Identificando stack técnico requerido...',
  'Evaluando perfiles disponibles...',
  'Calculando compatibilidad de habilidades...',
  'Verificando disponibilidad y estilo de trabajo...',
  'Optimizando composición del equipo...',
  '¡Equipo ideal encontrado!',
]

function mapTalent(tp) {
  const u = tp.users
  return {
    id: u.id,
    name: u.name,
    avatar: u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?',
    location: u.location || '',
    bio: u.bio || '',
    role: tp.main_role || '',
    available: tp.available,
    score: Math.round(tp.match_score_avg || 75),
    projects: tp.projects_count || 0,
    skills: (u.user_skills || []).map(us => us.skills?.name).filter(Boolean),
  }
}

export default function LanzarIdea() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState('form')
  const [currentStep, setCurrentStep] = useState(0)
  const [aiData, setAiData] = useState(null)
  const [flash, setFlash] = useState(false)
  const [matched, setMatched] = useState([])
  const [selRoles, setSelRoles] = useState([])
  const [form, setForm] = useState({ title: '', description: '', category: '', projectStage: '', budget: '', equity: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [savedIdeaId, setSavedIdeaId] = useState(null)
  const [isPublic, setIsPublic] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleRole = r => setSelRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])

  const handleSubmit = async () => {
    if (!user) { navigate('/registro?rol=visionario'); return }
    if (!form.title || !form.description) { alert('Completá el nombre y la descripción.'); return }
    setStage('matching')
    setCurrentStep(0)

    let step = 0
    const iv = setInterval(() => {
      step++
      setCurrentStep(step)
      if (step >= STEPS.length - 1) clearInterval(iv)
    }, 600)

    let analysis
    try {
      analysis = await matchTeam({ title: form.title, description: form.description, category: form.category, roles: selRoles })
      setAiData(analysis)
    } catch {
      analysis = { pitch: `${form.description.slice(0, 120)}...`, whyThisTeam: 'Equipo seleccionado por compatibilidad de habilidades y disponibilidad.', teamSize: 4, complexity: 'Media', timeEstimate: '4 meses', successTip: 'Empezá con un MVP simple y validá con usuarios reales antes de escalar.', risks: 'No validar el mercado antes de construir.', rolesNeeded: selRoles }
      setAiData(analysis)
    }

    // Buscar talentos reales en la DB según los roles que sugirió la IA
    const rolesNeeded = analysis.rolesNeeded?.length ? analysis.rolesNeeded : selRoles
    const { data: talentData } = await supabase
      .from('talent_profiles')
      .select('available, main_role, match_score_avg, projects_count, users!inner(id, name, avatar_url, location, bio, user_skills(skills(name)))')
      .eq('available', true)
      .in('main_role', rolesNeeded)
      .limit(6)

    setMatched((talentData || []).map(mapTalent))
    setTimeout(() => { setStage('results'); setFlash(true); setTimeout(() => setFlash(false), 700) }, STEPS.length * 600 + 800)
  }

  const handleSaveIdea = async () => {
    if (!user || !aiData) return

    const { count } = await supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', user.id)

    if ((count || 0) >= 1) {
      setShowPaywall(true)
      return
    }

    await doSaveIdea()
  }

  const handlePayAndSave = async () => {
    setPaymentLoading(true)
    // TODO: integrar Stripe Checkout aquí
    // Por ahora simula pago exitoso para beta
    await new Promise(r => setTimeout(r, 1200))
    setPaymentLoading(false)
    setShowPaywall(false)
    await doSaveIdea()
  }

  const doSaveIdea = async () => {
    setSending(true)

    // 1. Guardar idea en DB
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        founder_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category || null,
        stage: form.projectStage || 'Idea (solo concepto)',
        budget: form.budget || null,
        status: 'active',
        ai_analysis: aiData,
        is_public: isPublic,
      })
      .select()
      .single()

    if (ideaError) { setSending(false); alert('Error al guardar el proyecto. Intentá de nuevo.'); return }

    // 2. Guardar roles necesarios
    const rolesNeeded = aiData.rolesNeeded?.length ? aiData.rolesNeeded : selRoles
    if (rolesNeeded.length) {
      await supabase.from('idea_roles').insert(
        rolesNeeded.map(role => ({ idea_id: idea.id, role_name: role, filled: false }))
      )
    }

    // 3. Crear matches / invitaciones para cada talento
    if (matched.length) {
      await supabase.from('matches').insert(
        matched.map(t => ({
          idea_id: idea.id,
          talent_id: t.id,
          role_suggested: t.role,
          score: t.score,
          ai_reasoning: aiData.whyThisTeam,
          status: 'invited',
          equity_pct: form.equity ? parseFloat(form.equity) : null,
        }))
      )

      // 4. Notificaciones para cada talento
      await supabase.from('notifications').insert(
        matched.map(t => ({
          user_id: t.id,
          type: 'match_received',
          title: `Fuiste elegido para "${form.title}"`,
          body: `La IA te seleccionó como ${t.role} para este proyecto.`,
          link: '/dashboard',
          data: { idea_id: idea.id },
        }))
      )
    }

    setSending(false)
    setSavedIdeaId(idea.id)
    setSent(true)
  }

  const inputStyle = { padding: '12px 14px', background: '#f8f9fa', border: '1px solid #d0d0d0', color: '#0a0a0a', fontFamily: 'Inter, sans-serif', fontSize: 15, borderRadius: 8, outline: 'none', width: '100%', transition: 'border-color .15s' }

  return (
    <div className="page-wrap">

      {showPaywall && (
        <PaywallModal
          title="Publicar una idea adicional"
          description="Ya usaste tu idea gratis. Cada idea adicional incluye matching IA garantizado e invitaciones automáticas al equipo."
          perks={['Matching IA con los mejores perfiles', 'Invitaciones automáticas personalizadas', 'Equipo garantizado o te devolvemos el dinero', isPublic ? 'Idea visible para inversores' : 'Idea privada — solo vos y tu equipo']}
          loading={paymentLoading}
          onClose={() => setShowPaywall(false)}
          onConfirm={handlePayAndSave}
        />
      )}

      {/* FORM */}
      {stage === 'form' && (
        <div style={{ padding: '100px 24px 60px', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Lanzador de ideas</div>
          <h1 style={{ fontSize: 'clamp(32px,7vw,56px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: 8 }}>Tu idea,<br /><span style={{ color: '#E8611A' }}>el equipo perfecto.</span></h1>
          <p style={{ color: '#666', fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>Describí tu proyecto y la IA construirá el equipo ideal. Sin entrevistas, sin búsqueda manual.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="form-label">Nombre del proyecto *</label>
              <input value={form.title} onChange={upd('title')} placeholder="Ej: App de salud mental para universitarios" style={inputStyle} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#d0d0d0'}/>
            </div>
            <div>
              <label className="form-label">Descripción *</label>
              <textarea value={form.description} onChange={upd('description')} placeholder="¿Qué problema resuelve? ¿Quién es tu usuario? ¿Cómo funciona? Cuanto más detalle, mejor el matching." rows={6} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor='#E8611A'} onBlur={e => e.target.style.borderColor='#d0d0d0'}/>
            </div>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Categoría</label>
                <select value={form.category} onChange={upd('category')} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Etapa del proyecto</label>
                <select value={form.projectStage} onChange={upd('projectStage')} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {PROJECT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Roles que necesitás</label>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Seleccioná los perfiles que tu proyecto necesita. La IA también puede sugerir otros.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SKILL_ROLES.map(r => (
                  <button key={r} onClick={() => toggleRole(r)} style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${selRoles.includes(r) ? '#E8611A' : '#d0d0d0'}`, background: selRoles.includes(r) ? 'rgba(232,97,26,.08)' : 'none', color: selRoles.includes(r) ? '#E8611A' : '#666', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}>
                    {selRoles.includes(r) ? '✓ ' : ''}{r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">Presupuesto / compensación</label>
              <select value={form.budget} onChange={upd('budget')} style={inputStyle}>
                <option value="">Seleccionar...</option>
                <option>Sin presupuesto (equity / pasión)</option>
                <option>$500 - $2,000 USD</option>
                <option>$2,000 - $10,000 USD</option>
                <option>$10,000+ USD</option>
                <option>A definir con el equipo</option>
              </select>
            </div>
            <div>
              <label className="form-label">Equity por talento (%)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" max="50" step="0.5"
                  value={form.equity} onChange={upd('equity')}
                  placeholder="Ej: 5  (opcional)"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = '#E8611A'}
                  onBlur={e => e.target.style.borderColor = '#d0d0d0'}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#888', pointerEvents: 'none' }}>%</span>
              </div>
              <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Participación que le ofrecés a cada miembro del equipo a cambio de su trabajo.</p>
            </div>

            {/* Toggle público / privado */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: true, label: '🌍 Pública', desc: 'Visible para inversores' }, { v: false, label: '🔒 Privada', desc: 'Solo vos y tu equipo' }].map(opt => (
                <button key={String(opt.v)} onClick={() => setIsPublic(opt.v)} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1px solid ${isPublic === opt.v ? '#E8611A' : '#d0d0d0'}`, background: isPublic === opt.v ? 'rgba(232,97,26,.08)' : 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .15s', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isPublic === opt.v ? '#E8611A' : '#666' }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <button onClick={handleSubmit} style={{ width: '100%', padding: 16, fontSize: 16, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all .2s', marginTop: 8 }}>
              🤖 Activar IA — Buscar mi equipo
            </button>
            {!user && <p style={{ textAlign: 'center', fontSize: 13, color: '#666' }}>Te pediremos que te registres antes de ver los resultados.</p>}
          </div>
        </div>
      )}

      {/* MATCHING */}
      {stage === 'matching' && (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>IA en acción</h2>
          <p style={{ color: '#666', marginBottom: 40, fontSize: 14 }}>Analizando: <strong style={{ color: '#0a0a0a' }}>{form.title}</strong></p>
          <div style={{ width: 48, height: 48, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 40px' }} />
          <div style={{ textAlign: 'left' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', opacity: i <= currentStep ? 1 : 0.2, transition: 'opacity .4s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i < currentStep ? '#22c55e' : i === currentStep ? '#E8611A' : '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0, transition: 'background .3s' }}>
                  {i < currentStep ? '✓' : i === currentStep ? '⟳' : ''}
                </div>
                <span style={{ fontSize: 14, color: i <= currentStep ? '#0a0a0a' : '#666' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {stage === 'results' && (
        <>
          {/* Flash de relámpago */}
          {flash && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(232,97,26,0.18) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)',
              animation: 'lightning .7s ease forwards',
            }} />
          )}
        <div style={{ padding: '100px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14, animation: 'glowSuccess 2s ease infinite' }}>⚡ Equipo encontrado</div>
          <h1 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8, animation: 'zapIn .6s cubic-bezier(.22,1,.36,1) both' }}>Tu equipo ideal</h1>
          <p style={{ color: '#666', marginBottom: 32, fontSize: 15 }}>
            {matched.length > 0
              ? `La IA seleccionó ${matched.length} profesionales para "${form.title}"`
              : `La IA analizó "${form.title}". Todavía no hay talentos registrados que coincidan con los roles requeridos.`}
          </p>

          {/* Análisis IA */}
          {aiData && (
            <div style={{ padding: 24, marginBottom: 28, border: '1px solid #d0d0d0', borderRadius: 12, background: '#f8f9fa' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>🤖 Análisis de Equia</div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', marginBottom: 20 }}>{aiData.pitch}</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#666', marginBottom: 20, fontStyle: 'italic' }}>"{aiData.whyThisTeam}"</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 16 }}>
                {[['Equipo ideal', `${aiData.teamSize} personas`], ['Complejidad', aiData.complexity], ['Tiempo est.', aiData.timeEstimate]].map(([k, v]) => (
                  <div key={k} style={{ padding: '12px 14px', background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#E8611A' }}>{v}</div>
                  </div>
                ))}
              </div>
              {aiData.successTip && <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 8, fontSize: 13, color: '#22c55e', lineHeight: 1.6, marginBottom: 10 }}>💡 <strong>Tip:</strong> {aiData.successTip}</div>}
              {aiData.risks && <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 8, fontSize: 13, color: '#f59e0b', lineHeight: 1.6 }}>⚠️ <strong>Riesgo principal:</strong> {aiData.risks}</div>}
            </div>
          )}

          {/* Equipo */}
          {matched.length > 0 && (
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
              {matched.map((t, i) => (
                <div key={t.id} style={{ animation: `cardReveal .5s cubic-bezier(.22,1,.36,1) ${i * 120}ms both` }}>
                  <TalentCard talent={t} showInvite={false} />
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          <div style={{ padding: '28px 24px', border: '1px solid #d0d0d0', borderRadius: 12, textAlign: 'center', animation: 'cardReveal .5s cubic-bezier(.22,1,.36,1) .4s both' }}>
            {sent ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>¡Invitaciones enviadas!</h3>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                  El proyecto fue guardado y los talentos recibieron su invitación. Podés seguir el estado desde tu dashboard.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {savedIdeaId && (
                    <button className="btn-primary" onClick={() => navigate(`/panel/${savedIdeaId}`)} style={{ padding: '14px 32px', fontSize: 15 }}>⚡ Abrir Panel IA →</button>
                  )}
                  <button className="btn-outline" onClick={() => navigate('/dashboard')} style={{ padding: '14px 22px', fontSize: 15 }}>Ver mi dashboard</button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 8 }}>¿Te gusta este equipo?</h3>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                  {matched.length > 0
                    ? 'Se guardará tu proyecto y se enviarán invitaciones personalizadas a cada talento.'
                    : 'Se guardará tu proyecto. Cuando se registren talentos con los roles necesarios, podrás invitarlos.'}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={handleSaveIdea} disabled={sending} style={{ padding: '14px 32px', fontSize: 15, opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Guardando...' : matched.length > 0 ? '📨 Guardar y enviar invitaciones' : '💾 Guardar proyecto'}
                  </button>
                  <button className="btn-outline" onClick={() => { setStage('form'); setAiData(null); setMatched([]) }} style={{ padding: '14px 22px', fontSize: 15 }}>✏️ Editar idea</button>
                </div>
              </>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
