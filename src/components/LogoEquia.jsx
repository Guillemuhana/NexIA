import { useId } from 'react'

export default function LogoEquia({ size = 32, dark = false, onClick, style = {}, badge = null }) {
  const uid = useId().replace(/:/g, '')
  const cw = Math.round(size * 0.78)
  const ch = size
  const sw = Math.max(2.5, size * 0.156)

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 0, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', ...style }}
    >
      <span style={{ fontWeight: 900, fontSize: size, letterSpacing: -size * 0.047, color: dark ? '#fff' : '#0a0a0a', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>equ</span>
      <span style={{ fontWeight: 900, fontSize: size, color: '#E8611A', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>I</span>

      <svg width={cw} height={ch} viewBox="0 0 24 32" fill="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE000" stopOpacity="0.9" />
            <stop offset="35%"  stopColor="#FFB800" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo amarillo — bombilla encendiéndose y respirando */}
        <ellipse
          cx="12" cy="1.5" rx="13" ry="9"
          fill={`url(#halo-${uid})`}
          className="logo-halo"
        />

        {/* 3 rayos elegantes — recto arriba, diagonal izq y der */}
        <line x1="12" y1="-1"  x2="12"  y2="-11" stroke="#FFD700" strokeWidth={sw * 0.48} strokeLinecap="round" pathLength="1" className="logo-ray" style={{ '--rd': '0.74s' }} />
        <line x1="9.5" y1="-0.5" x2="3.5" y2="-7"  stroke="#FFD700" strokeWidth={sw * 0.38} strokeLinecap="round" pathLength="1" className="logo-ray" style={{ '--rd': '0.79s' }} />
        <line x1="14.5" y1="-0.5" x2="20.5" y2="-7" stroke="#FFD700" strokeWidth={sw * 0.38} strokeLinecap="round" pathLength="1" className="logo-ray" style={{ '--rd': '0.79s' }} />

        {/* Punto de luz en el tip */}
        <circle cx="12" cy="2" r={sw * 0.5} fill="#FFF0A0" className="logo-tip" />

        {/* Chevron naranja — se dibuja primero */}
        <path
          d="M1.5 30L12 2L22.5 30"
          stroke="#E8611A"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          className="logo-chevron"
        />
      </svg>

      {badge && (
        <span style={{ marginLeft: 8, fontSize: size * 0.31, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', border: '1px solid #d0d0d0', borderRadius: 4, padding: '1px 5px' }}>{badge}</span>
      )}
    </div>
  )
}
