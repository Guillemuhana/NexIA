export default function LogoEquia({ size = 32, dark = false, onClick, style = {}, badge = null }) {
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
        style={{ display: 'block' }}
      >
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
