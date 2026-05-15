export default function LogoEquia({ size = 32, dark = false, onClick, style = {}, badge = null }) {
  const cw = Math.round(size * 0.78)
  const ch = size
  const sw = Math.max(2.5, size * 0.156)

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 0, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', ...style }}
    >
      <span style={{ fontWeight: 900, fontSize: size, letterSpacing: -size * 0.047, color: dark ? '#fff' : '#0a0a0a', lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>equ</span>
      <span className="logo-i" style={{ fontWeight: 900, fontSize: size, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>I</span>

      <svg width={cw} height={ch} viewBox="0 0 24 32" fill="none" style={{ display: 'block' }}>
        <path
          d="M1.5 30L12 2L22.5 30"
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
