import { Cpu, Leaf, Zap, Disc, BatteryCharging } from 'lucide-react';

export default function FloatingElectronics() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Floating Microchip 1 */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          opacity: 0.18,
          color: '#10B981',
          filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.3))',
        }}
      >
        <Cpu size={42} />
      </div>

      {/* Floating Eco Leaf 1 */}
      <div
        className="animate-float-reverse"
        style={{
          position: 'absolute',
          top: '22%',
          right: '9%',
          opacity: 0.22,
          color: '#059669',
        }}
      >
        <Leaf size={38} />
      </div>

      {/* Floating Energy Zap */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '5%',
          opacity: 0.16,
          color: '#F59E0B',
          animationDelay: '1.5s',
        }}
      >
        <Zap size={36} />
      </div>

      {/* Floating Motor / Disc */}
      <div
        className="animate-float-reverse"
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '8%',
          opacity: 0.15,
          color: '#06B6D4',
          animationDelay: '2s',
        }}
      >
        <Disc size={40} />
      </div>

      {/* Battery / Capacitor */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          top: '55%',
          right: '3%',
          opacity: 0.14,
          color: '#84CC16',
          animationDelay: '3s',
        }}
      >
        <BatteryCharging size={32} />
      </div>
    </div>
  );
}
