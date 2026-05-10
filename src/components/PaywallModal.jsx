export default function PaywallModal({ onClose, onConfirm, title, description, perks = [], loading = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        maxWidth: 420, width: '100%',
        background: '#0a0a0a', border: '1px solid #E8611A',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 0 80px rgba(232,97,26,0.12)',
        animation: 'zapIn .4s cubic-bezier(.22,1,.36,1) both',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#E8611A', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
          ⚡ Función premium
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', marginBottom: 10 }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>

        {perks.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {perks.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#22c55e', flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: '#ccc' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '16px 20px', background: '#000', border: '1px solid #1a1a1a', borderRadius: 10, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#666' }}>Pago único</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#E8611A', letterSpacing: '-1px' }}>$29 <span style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>USD</span></span>
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, background: '#E8611A', color: '#fff', border: 'none', borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 12, opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}
        >
          {loading ? 'Procesando...' : 'Pagar $29 →'}
        </button>

        <button
          onClick={onClose}
          style={{ width: '100%', padding: '10px', fontSize: 14, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
