import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../lib/constants'

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

  // Links según si está logueado y su rol
  const getLinks = () => {
    const base = [{ path: '/', label: 'Inicio' }]
    if (!user) return [...base, { path: '/explorar', label: 'Explorar' }, { path: '/proyectos', label: 'Proyectos' }]
    if (profile?.type === 'visionario') return [...base, { path: '/dashboard', label: 'Mi Proyecto' }, { path: '/explorar', label: 'Talento' }]
    if (profile?.type === 'talento') return [...base, { path: '/dashboard', label: 'Mis Invitaciones' }, { path: '/proyectos', label: 'Proyectos' }]
    if (profile?.type === 'inversor') return [...base, { path: '/proyectos', label: 'Proyectos' }, { path: '/dashboard', label: 'Favoritos' }]
    return base
  }

  const links = getLinks()
  const roleInfo = profile?.type ? ROLES[profile.type] : null

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        height: 60, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? '#1a1a1a' : 'transparent'}`,
        transition: 'border-color .3s',
      }}>
        {/* Logo */}
        <div onClick={() => go('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, transition: 'transform .2s ease', userSelect: 'none' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: -1.5, color: '#fff' }}>nex</span>
          <span style={{ fontWeight: 900, fontSize: 28, letterSpacing: -1.5, color: '#E8611A', textShadow: '0 0 18px rgba(232,97,26,0.6)' }}>IA</span>
        </div>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 2 }}>
          {links.map(l => (
            <button key={l.path} onClick={() => go(l.path)} style={{
              background: isActive(l.path) ? '#111' : 'none', border: 'none',
              color: isActive(l.path) ? '#fff' : '#666',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              padding: '6px 14px', borderRadius: 6, transition: 'all .15s',
              fontFamily: 'Inter, sans-serif',
            }}>{l.label}</button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && profile ? (
            <>
              {roleInfo && (
                <span className={`role-badge ${roleInfo.badge}`} style={{ fontSize: 12 }}>
                  {roleInfo.icon} {roleInfo.label}
                </span>
              )}
              <button onClick={() => go('/perfil')} style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8611A', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/login')} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, borderRadius: 7, cursor: 'pointer', background: 'transparent', color: '#666', border: '1px solid #222', fontFamily: 'Inter, sans-serif' }}>
                Ingresar
              </button>
              <button onClick={() => go('/registro')} className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
                Únete gratis
              </button>
            </>
          )}
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} style={{ width: 36, height: 36, background: 'none', border: '1px solid #222', borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4.5 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width: 16, height: 1.5, background: '#666', borderRadius: 2, display: 'block', transition: 'all .25s',
                transform: menuOpen ? (i===0 ? 'rotate(45deg) translate(4px,4px)' : i===2 ? 'rotate(-45deg) translate(4px,-4px)' : 'none') : 'none',
                opacity: menuOpen && i===1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* Dropdown */}
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 998, background: '#000', borderBottom: '1px solid #1a1a1a', maxHeight: menuOpen ? 420 : 0, overflow: 'hidden', transition: 'max-height .3s ease' }}>
        <div style={{ padding: '12px 16px 20px' }}>
          {links.map((l, i) => (
            <button key={l.path} onClick={() => go(l.path)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              background: isActive(l.path) ? '#0f0f0f' : 'none', border: 'none',
              color: isActive(l.path) ? '#E8611A' : '#999',
              fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 16,
              cursor: 'pointer', padding: '14px 12px', borderRadius: 8,
              marginBottom: 2, textAlign: 'left', transition: 'all .15s',
            }}>
              {['🏠','⚡','💡','👤'][i] || '→'} {l.label}
            </button>
          ))}
          <div style={{ height: 1, background: '#1a1a1a', margin: '8px 0' }} />
          {user ? (
            <button onClick={() => { signOut(); go('/') }} style={{ width: '100%', padding: 14, background: '#111', color: '#666', border: '1px solid #1a1a1a', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, borderRadius: 8, cursor: 'pointer', marginTop: 8 }}>
              Cerrar sesión
            </button>
          ) : (
            <button onClick={() => go('/registro')} className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 8, marginTop: 8 }}>
              Únete gratis →
            </button>
          )}
        </div>
      </div>
    </>
  )
}
