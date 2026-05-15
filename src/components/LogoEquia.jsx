import { useId } from 'react'

export default function LogoEquia({ size = 32, dark = false, onClick, style = {}, badge = null }) {
  const uid = useId().replace(/:/g, '')
  const chevronW = Math.round(size * 0.78)
  const chevronH = size
  const strokeW = Math.max(2.5, size * 0.156)

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 0, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', ...style }}
    >
      <span style={{
        fontWeight: 900, fontSize: size, letterSpacing: -size * 0.047,
        color: dark ? '#fff' : '#0a0a0a', lineHeight: 1, fontFamily: 'Inter, sans-serif',
      }}>equ</span>
      <span style={{
        fontWeight: 900, fontSize: size, color: '#E8611A',
        lineHeight: 1, fontFamily: 'Inter, sans-serif',
      }}>I</span>

      <svg
        width={chevronW}
        height={chevronH}
        viewBox="0 0 24 32"
        fill="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8611A" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff7a35" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo de luz en el tip — lámpara */}
        <ellipse
          cx="12" cy="2" rx="11" ry="8"
          fill={`url(#halo-${uid})`}
          className="logo-glow-halo"
        />

        {/* Rayos de luz — se dibujan desde el tip hacia afuera */}
        <g stroke="#E8611A" strokeLinecap="round">
          {/* arriba */}
          <line x1="12" y1="1" x2="12" y2="-8" strokeWidth={strokeW * 0.45} pathLength="1" className="logo-ray" style={{ '--rd': '0.78s' }} />
          {/* arriba-izquierda */}
          <line x1="10.5" y1="0.5" x2="5" y2="-4.5" strokeWidth={strokeW * 0.38} pathLength="1" className="logo-ray" style={{ '--rd': '0.83s' }} />
          {/* arriba-derecha */}
          <line x1="13.5" y1="0.5" x2="19" y2="-4.5" strokeWidth={strokeW * 0.38} pathLength="1" className="logo-ray" style={{ '--rd': '0.83s' }} />
          {/* izquierda */}
          <line x1="9" y1="2.5" x2="1" y2="1.5" strokeWidth={strokeW * 0.3} pathLength="1" className="logo-ray" style={{ '--rd': '0.89s' }} />
          {/* derecha */}
          <line x1="15" y1="2.5" x2="23" y2="1.5" strokeWidth={strokeW * 0.3} pathLength="1" className="logo-ray" style={{ '--rd': '0.89s' }} />
        </g>

        {/* Chevron principal */}
        <path
          d="M1.5 30L12 2L22.5 30"
          stroke="#E8611A"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          className="logo-chevron"
        />
      </svg>

      {badge && (
        <span style={{
          marginLeft: 8, fontSize: size * 0.31, fontWeight: 700,
          color: '#888', letterSpacing: 1, textTransform: 'uppercase',
          border: '1px solid #d0d0d0', borderRadius: 4, padding: '1px 5px',
        }}>{badge}</span>
      )}
    </div>
  )
}
