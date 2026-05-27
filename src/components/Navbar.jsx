import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES, getLevel } from '../lib/constants'
import LogoEquia from './LogoEquia'

function Icon({ name, size = 16, stroke = 'currentColor', strokeWidth = 1.75 }) {
  const d = {
    home:     <path d="M3 12L12 3l9 9M5 21v-9m14 9v-9M9 21v-5h6v5" />,
    compass:  <><circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/></>,
    layers:   <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
    gauge:    <><path d="M12 2a10 10 0 0 1 7.38 16.75"/><path d="M12 2a10 10 0 0 0-7.38 16.75"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1.5" fill={stroke}/></>,
    tag:      <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    zap:      <path d="M13 2L3 14h9l-1 8 10-12h-9z" />,
    briefcase:<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12.01" y2="12"/></>,
    logout:   <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    arrow:    <path d="M5 12h14M12 5l7 7-7 7" />,
    help:     <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {d[name]}
    </svg>
  )
}

const PATH_ICON = {
  '/':          'home',
  '/explorar':  'compass',
  '/proyectos': 'layers',
  '/dashboard': 'gauge',
  '/precios':   'tag',
  '/lanzar':    'zap',
  '/faq':       'help',
}

const ROLE_ICON = {
  visionario: 'zap',
  talento:    'user',
  inversor:   'briefcase',
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const go = (path) => { navigate(path); setMenuOpen(false); window.scrollTo({ top: 0 }) }
  const isActive = (path) => location.pathname === path

  const getLinks = () => {
    if (!user) return [{ path: '/explorar', label: 'Explorar' }, { path: '/proyectos', label: 'Proyectos' }, { path: '/precios', label: 'Precios' }, { path: '/faq', label: 'FAQ' }]
    if (profile?.type === 'visionario') return [{ path: profile.idea_id ? `/panel/${profile.idea_id}` : '/dashboard', label: 'Mi Panel' }, { path: '/proyectos', label: 'Proyectos' }, { path: '/precios', label: 'Precios' }, { path: '/faq', label: 'FAQ' }]
    if (profile?.type === 'talento') return [{ path: '/dashboard', label: 'Invitaciones' }, { path: '/proyectos', label: 'Proyectos' }, { path: '/precios', label: 'Precios' }, { path: '/faq', label: 'FAQ' }]
    if (profile?.type === 'inversor') return [{ path: '/proyectos', label: 'Proyectos' }, { path: '/dashboard', label: 'Favoritos' }, { path: '/precios', label: 'Precios' }, { path: '/faq', label: 'FAQ' }]
    return []
  }

  const links = getLinks()
  const roleInfo = profile?.type ? ROLES[profile.type] : null

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        height: 64, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? '#e0e0e0' : '#f0f0f0'}`,
        transition: 'border-color .3s',
      }}>

        {/* Logo */}
        <div
          style={{ transition: 'transform .2s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <LogoEquia size={32} onClick={() => go('/')} />
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: 'flex', gap: 2 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: isActive(l.path) ? '#f5f5f5' : 'none', border: 'none',
              color: isActive(l.path) ? '#0a0a0a' : '#888',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              padding: '6px 13px', borderRadius: 6, transition: 'all .15s',
              fontFamily: 'Inter, sans-serif',
            }}
              onMouseEnter={e => { if (!isActive(l.path)) e.currentTarget.style.color = '#333' }}
              onMouseLeave={e => { if (!isActive(l.path)) e.currentTarget.style.color = '#888' }}
            >
              <Icon name={l.path.startsWith('/panel/') ? 'zap' : PATH_ICON[l.path] || 'arrow'} size={14} />
              {l.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && profile ? (
            <>
              {/* Credits badge */}
              {profile.credits !== undefined && (
                <div
                  onClick={() => go('/dashboard')}
                  title={`Nivel ${getLevel(profile.credits).name}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(232,97,26,.08)', border: '1px solid rgba(232,97,26,.18)', cursor: 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,97,26,.15)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,97,26,.08)' }}
                >
                  <span style={{ fontSize: 11 }}>⚡</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#E8611A' }}>{profile.credits}</span>
                </div>
              )}
              {roleInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.04)', border: '1px solid #e0e0e0' }}>
                  <Icon name={ROLE_ICON[profile.type] || 'user'} size={13} stroke={profile.type === 'visionario' ? '#E8611A' : profile.type === 'inversor' ? '#b45309' : '#666'} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: profile.type === 'visionario' ? '#E8611A' : profile.type === 'inversor' ? '#b45309' : '#555' }}>
                    {profile.cv_data?.job_title || roleInfo.label}
                  </span>
                </div>
              )}
              <button onClick={() => go('/perfil')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8611A', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0 }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/login')} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 7, cursor: 'pointer', background: 'transparent', color: '#888', border: '1px solid #e0e0e0', fontFamily: 'Inter, sans-serif', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderColor = '#bbb' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#e0e0e0' }}
              >
                Ingresar
              </button>
              <button onClick={() => go('/registro')} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
                Únete gratis
              </button>
            </>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} style={{ width: 36, height: 36, background: 'none', border: '1px solid #e0e0e0', borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#bbb'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e0e0e0'}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: menuOpen ? 16 : i === 1 ? 12 : 16, height: 1.5, background: '#888', borderRadius: 2, display: 'block', transition: 'all .25s',
                transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(4px, 4px)' : i === 2 ? 'rotate(-45deg) translate(4px, -4px)' : 'none') : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 998, background: '#fff', borderBottom: menuOpen ? '1px solid #e8e8e8' : 'none', maxHeight: menuOpen ? 480 : 0, overflow: 'hidden', transition: 'max-height .3s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ padding: '8px 12px 20px' }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              background: isActive(l.path) ? '#f5f5f5' : 'none', border: 'none',
              color: isActive(l.path) ? '#0a0a0a' : '#888',
              fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15,
              cursor: 'pointer', padding: '13px 12px', borderRadius: 9,
              marginBottom: 2, textAlign: 'left', transition: 'all .15s',
            }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: isActive(l.path) ? 'rgba(232,97,26,.08)' : '#f5f5f5', border: `1px solid ${isActive(l.path) ? 'rgba(232,97,26,.2)' : '#e8e8e8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                <Icon name={l.path.startsWith('/panel/') ? 'zap' : PATH_ICON[l.path] || 'arrow'} size={15} stroke={isActive(l.path) ? '#E8611A' : '#888'} />
              </span>
              {l.label}
              {isActive(l.path) && <Icon name="arrow" size={14} stroke="#ccc" style={{ marginLeft: 'auto' }} />}
            </button>
          ))}

          <div style={{ height: 1, background: '#f0f0f0', margin: '10px 0' }} />

          {user ? (
            <button onClick={() => { signOut(); go('/') }} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 12px', background: 'none', border: 'none', color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 15, borderRadius: 9, cursor: 'pointer', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#888'}
            >
              <span style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f5f5', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="logout" size={15} stroke="#888" />
              </span>
              Cerrar sesión
            </button>
          ) : (
            <button onClick={() => go('/registro')} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 9, marginTop: 4 }}>
              Únete gratis →
            </button>
          )}
        </div>
      </div>
    </>
  )
}
