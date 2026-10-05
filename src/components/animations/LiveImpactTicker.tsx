import { useState, useEffect } from 'react';
import { Leaf, Award, TrendingUp, Sparkles } from 'lucide-react';

export default function LiveImpactTicker() {
  const [divertedKg, setDivertedKg] = useState(1842);
  const [componentsReclaimed, setComponentsReclaimed] = useState(4320);
  const [makerSavings] = useState(385400);

  // Micro-tick animation simulating active community salvage
  useEffect(() => {
    const interval = setInterval(() => {
      setDivertedKg(prev => prev + (Math.random() > 0.6 ? 1 : 0));
      setComponentsReclaimed(prev => prev + (Math.random() > 0.4 ? 2 : 0));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-md)',
      }}
      className="glow-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-700)', letterSpacing: '0.04em' }}>
            TAMIL NADU CIRCULAR HARDWARE PULSE
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={13} color="var(--color-green-500)" /> Live telemetry updated
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-tint)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Leaf size={16} color="var(--color-green-600)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>E-Waste Diverted</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-green-700)' }} className="tabular-nums">
            {divertedKg.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>kg</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            ≈ 890 old desktop motherboards kept from open fires
          </p>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(6, 182, 212, 0.06)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} color="var(--color-teal-600)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Silicon Reclaimed</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-teal-600)' }} className="tabular-nums">
            {componentsReclaimed.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>parts</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Motors, op-amps, encoders, Li-ion 18650 cells
          </p>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Award size={16} color="var(--color-amber-600)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Student Maker Savings</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--color-amber-600)' }} className="tabular-nums">
            ₹{makerSavings.toLocaleString()}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Hardware costs saved by scavenging instead of buying new
          </p>
        </div>
      </div>
    </div>
  );
}
