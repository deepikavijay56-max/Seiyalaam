import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface DetectedPart {
  name: string;
  pins: string;
  category: string;
  confidence: number;
  condition: string;
}

const DETECTIONS: DetectedPart[] = [
  { name: 'STMicroelectronics LM358P', pins: 'DIP-8 Dual Op-Amp', category: 'Analog IC', confidence: 99.2, condition: 'Salvage Grade A' },
  { name: 'Nidec 24V Stepper 17PM', pins: '4-Pin JST Connector', category: 'Actuator', confidence: 98.7, condition: 'Verified Functional' },
  { name: 'Nichicon 2200µF 50V', pins: 'Radial Aluminum Electrolytic', category: 'Capacitor', confidence: 97.4, condition: 'Safe Low ESR' },
  { name: 'IRFZ44N Power MOSFET', pins: 'TO-220 55V 49A N-Ch', category: 'Power Switch', confidence: 99.6, condition: 'Pristine Pins' },
];

export default function ComponentVisionScanner() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % DETECTIONS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const current = DETECTIONS[activeIdx];

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        background: '#0B1410',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '20px',
        color: '#F1FBF5',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3), 0 0 25px rgba(16,185,129,0.15)',
      }}
    >
      {/* Background Reticle Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />

      {/* Laser Scan Beam */}
      <div className="scanline-beam" />

      {/* Camera Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.08em' }}>
            VISION AI OPTICAL SCANNER ACTIVE
          </span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
          FPS: 60 · RES: 1080P
        </span>
      </div>

      {/* Bounding Box Visualizer */}
      <div
        style={{
          position: 'relative',
          borderRadius: 8,
          border: '1px dashed #10B981',
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.05)',
          marginBottom: 16,
          zIndex: 1,
        }}
      >
        {/* Corner Reticles */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 8, height: 8, borderTop: '2px solid #34D399', borderLeft: '2px solid #34D399' }} />
        <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderTop: '2px solid #34D399', borderRight: '2px solid #34D399' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 8, height: 8, borderBottom: '2px solid #34D399', borderLeft: '2px solid #34D399' }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderBottom: '2px solid #34D399', borderRight: '2px solid #34D399' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#34D399' }}>
            {current.name}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
            {current.confidence}% CONFIDENCE
          </span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94A3B8' }}>
          Pinout: {current.pins}
        </div>
      </div>

      {/* Detection Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
          <ShieldCheck size={14} />
          <span>{current.condition}</span>
        </div>
        <span style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
          Auto-saved to Inventory
        </span>
      </div>
    </div>
  );
}
