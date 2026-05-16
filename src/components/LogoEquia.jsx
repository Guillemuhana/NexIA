const letterAnim = (delay) => ({
  display: 'inline',
  animation: `logoLetterReveal 0.35s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
})

export default function LogoEquia({ size = 32, dark = false, onClick, style = {}, badge = null }) {
  const cw = Math.round(size * 0.78)
  const ch = size
  const sw = Math.max(2.5, size * 0.156)
  const base = { fontWeight: 900, fontSize: size, lineHeight: 1, fontFamily: 'Inter, sans-serif' }

  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 0, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', ...style }}
    >
      {/* equ — letters reveal one by one */}
      <span style={{ ...base, letterSpacing: -size * 0.047, color: dark ? '#fff' : '#0a0a0a' }}>
        <span style={letterAnim(0)}>e</span>
        <span style={letterAnim(70)}>q</span>
        <span style={letterAnim(140)}>u</span>
      </span>

      {/* I — same stagger + color flow */}
      <span className="logo-i" style={{ ...base }}>I</span>

      {/* Chevron — draws in after letters */}
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
