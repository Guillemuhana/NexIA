import { useState, useEffect } from 'react'
import { CATEGORIES } from '../lib/constants'
import ProjectCard from '../components/ProjectCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function mapProject(idea) {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category || '',
    stage: idea.stage || '',
    founder: idea.users?.name || '',
    team: (idea.idea_roles || []).map(r => r.role_name),
    formed: idea.status === 'team_formed',
  }
}

export default function Proyectos() {
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const isInversor = profile?.type === 'inversor'

  useEffect(() => {
    supabase
      .from('ideas')
      .select('id, title, description, category, stage, status, users(name), idea_roles(role_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects((data || []).map(mapProject))
        setLoading(false)
      })
  }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchStatus = filterStatus === 'all' || (filterStatus === 'formed' && p.formed) || (filterStatus === 'open' && !p.formed)
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="page-wrap">
      <div style={{ padding: '100px 24px 32px', borderBottom: '1px solid #e8e8e8', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
          {isInversor ? 'Deal flow' : 'Showcase'}
        </div>
        <h1 style={{ fontSize: 'clamp(32px,7vw,54px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8 }}>
          {isInversor ? 'Proyectos para invertir' : 'Proyectos activos'}
        </h1>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 28 }}>
          {isInversor
            ? 'Explorá proyectos con equipos formados por IA. Filtrá por industria, etapa y financiamiento.'
            : 'Ideas en construcción con equipos reales. Sumate a uno o lanzá el tuyo.'}
        </p>

        <div className="filter-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyectos..." style={{ flex: 1, minWidth: 180, padding: '10px 14px', background: '#f8f9fa', border: '1px solid #e8e8e8', color: '#0a0a0a', fontSize: 14, borderRadius: 8, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '10px 14px', background: '#f8f9fa', border: '1px solid #e8e8e8', color: '#666', fontSize: 14, borderRadius: 8, outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.icon} {c.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px 14px', background: '#f8f9fa', border: '1px solid #e8e8e8', color: '#666', fontSize: 14, borderRadius: 8, outline: 'none', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            <option value="all">Todos</option>
            <option value="formed">Equipo formado</option>
            <option value="open">Buscando equipo</option>
          </select>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          {loading ? 'Cargando...' : `${filtered.length} proyectos encontrados`}
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #e0e0e0', borderTop: '2px solid #E8611A', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#666', gridColumn: '1/-1' }}>
                {projects.length === 0 ? 'Todavía no hay proyectos publicados.' : 'No se encontraron proyectos con esos filtros.'}
              </div>
            ) : (
              filtered.map(p => <ProjectCard key={p.id} project={p} onFavorite={isInversor ? () => {} : null} showContact={isInversor} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
