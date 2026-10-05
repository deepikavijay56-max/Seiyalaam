import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface WasteDevice {
  id: string;
  name: string;
  category: string;
  weightKg: number;
  toxicityRisk: 'High' | 'Medium' | 'Low';
  salvageValue: number;
  components: {
    name: string;
    spec: string;
    status: 'Ready' | 'Tested' | 'Requires Test';
    iconColor: string;
  }[];
  matchedProject: {
    title: string;
    id: string;
    category: string;
    feasibility: number;
    difficulty: string;
    impact: string;
    summary: string;
  };
}

const SAMPLE_DEVICES: WasteDevice[] = [
  {
    id: 'printer',
    name: 'Obsolete Inkjet Printer',
    category: 'Office Electronics',
    weightKg: 3.4,
    toxicityRisk: 'Medium',
    salvageValue: 1250,
    components: [
      { name: 'NEMA 17 Stepper Motor', spec: '12V 1.8° step', status: 'Ready', iconColor: '#10B981' },
      { name: 'Optical Linear Encoder', spec: '150 LPI precision', status: 'Tested', iconColor: '#06B6D4' },
      { name: 'Linear Stainless Rod Rails', spec: '8mm dia × 320mm', status: 'Ready', iconColor: '#84CC16' },
      { name: '24V 1.5A SMPS Power Supply', spec: 'Stable DC rail', status: 'Ready', iconColor: '#F59E0B' },
    ],
    matchedProject: {
      id: 'mini-cnc-plotter',
      title: 'Mini 2-Axis CNC Plotter & Engraver',
      category: 'Practical & Creative',
      feasibility: 96,
      difficulty: 'Medium',
      impact: 'Diverts 3.4 kg e-waste · Saves ₹4,200',
      summary: 'Uses dual salvaged stepper motors and linear rods to draw vector art & circuits with 0.1mm accuracy.',
    },
  },
  {
    id: 'laptop',
    name: 'Dead Core-i5 Laptop (Water Damaged)',
    category: 'Computing Hardware',
    weightKg: 2.1,
    toxicityRisk: 'High',
    salvageValue: 2400,
    components: [
      { name: '18650 Li-ion Cells (6×)', spec: '3.7V 2400mAh each', status: 'Ready', iconColor: '#10B981' },
      { name: 'Brushless Radial Blower', spec: '5V Ultra-quiet PWM', status: 'Tested', iconColor: '#06B6D4' },
      { name: 'Dual Neodymium Speakers', spec: '4Ω 3W Hi-Fi dynamic', status: 'Ready', iconColor: '#84CC16' },
      { name: 'Copper Heatpipe Cooler', spec: 'Direct thermal conduit', status: 'Ready', iconColor: '#F59E0B' },
    ],
    matchedProject: {
      id: 'solar-power-bank',
      title: 'Modular Off-Grid Solar Power Bank',
      category: 'Practical',
      feasibility: 92,
      difficulty: 'Easy',
      impact: 'Recovers 53 Wh energy storage · Diverts lithium landfill risk',
      summary: 'Reclaims healthy 18650 cells into a rechargeable 12V/5V portable emergency power generator for solar camping.',
    },
  },
  {
    id: 'microwave',
    name: 'Defective Microwave Oven',
    category: 'Home Appliances',
    weightKg: 11.8,
    toxicityRisk: 'High',
    salvageValue: 3100,
    components: [
      { name: 'AC Synchronous Turntable Motor', spec: '220V 4-RPM High Torque', status: 'Ready', iconColor: '#10B981' },
      { name: 'Heavy-Duty Shaded-Pole Fan', spec: '230V High CFM airflow', status: 'Tested', iconColor: '#06B6D4' },
      { name: 'Microswitch Interlocks (3×)', spec: '16A 250V snap action', status: 'Ready', iconColor: '#84CC16' },
      { name: 'High-Current Thermal Fuse', spec: '130°C Auto cut-off', status: 'Ready', iconColor: '#F59E0B' },
    ],
    matchedProject: {
      id: 'automated-tumbler',
      title: 'Automatic Rotary Rock & PCB Tumbler',
      category: 'Educational',
      feasibility: 88,
      difficulty: 'Medium',
      impact: 'Diverts 11.8 kg steel & copper scrap from open burning',
      summary: 'Repurposes the bulletproof synchronous motor into a slow continuous tumbler for smoothing 3D prints and etching PCBs.',
    },
  },
];

export default function HardwareTeardownSimulator() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isDeconstructing, setIsDeconstructing] = useState(false);

  const device = SAMPLE_DEVICES[selectedIdx];

  const handleDeconstruct = () => {
    setIsDeconstructing(true);
    setTimeout(() => {
      setIsDeconstructing(false);
    }, 850);
  };

  const handleSelectDevice = (idx: number) => {
    setSelectedIdx(idx);
    setIsDeconstructing(true);
    setTimeout(() => {
      setIsDeconstructing(false);
    }, 450);
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-xl), 0 0 40px rgba(16,185,129,0.08)',
        overflow: 'hidden',
      }}
      className="glow-card"
    >
      {/* Top Banner Header with Status */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--surface-border)',
          background: 'linear-gradient(90deg, var(--surface-tint) 0%, var(--surface-card) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px #10B981',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-green-700)',
              letterSpacing: '0.04em',
            }}
          >
            LIVE REVERSE-ENGINEERING SIMULATOR
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-green-600)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={12} /> Seiyalaam Match Engine v2.4
          </span>
        </div>
      </div>

      {/* Device Selector Tabs */}
      <div
        style={{
          padding: '16px 24px',
          background: 'var(--surface-bg)',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          overflowX: 'auto',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Select E-Waste Scrap:
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {SAMPLE_DEVICES.map((d, idx) => {
            const isSelected = idx === selectedIdx;
            return (
              <button
                key={d.id}
                onClick={() => handleSelectDevice(idx)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--color-green-500)' : '1px solid var(--surface-border)',
                  background: isSelected ? 'var(--color-green-500)' : 'var(--surface-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                }}
              >
                {d.name.split(' (')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Split Stage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: 0,
        }}
      >
        {/* Left Side: Scrap Gadget Teardown & Salvaged Silicon */}
        <div
          style={{
            padding: '28px 24px',
            borderRight: '1px solid var(--surface-border)',
            position: 'relative',
          }}
        >
          {isDeconstructing && <div className="scanline-beam" />}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Scrap Source #{device.id.toUpperCase()}
              </span>
              <h3 style={{ margin: '4px 0 6px', fontSize: 20, fontWeight: 700 }}>
                {device.name}
              </h3>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>⚖️ <strong>{device.weightKg} kg</strong> e-waste</span>
                <span>⚡ Hazard: <strong style={{ color: device.toxicityRisk === 'High' ? '#EF4444' : '#F59E0B' }}>{device.toxicityRisk}</strong></span>
              </div>
            </div>

            <button
              onClick={handleDeconstruct}
              title="Re-run extraction scan"
              style={{
                background: 'var(--surface-tint)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-green-700)',
                transition: 'all 0.2s',
              }}
            >
              <RotateCcw size={13} className={isDeconstructing ? 'animate-spin' : ''} />
              Re-Scan
            </button>
          </div>

          {/* Salvaged Component Chips */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={16} color="var(--color-green-500)" /> Salvaged Silicon & Hardware:
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-green-600)', fontWeight: 600 }}>
                {device.components.length} Components Extracted
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {device.components.map((comp, i) => (
                <div
                  key={comp.name}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s ease',
                    transform: isDeconstructing ? 'scale(0.97)' : 'scale(1)',
                    opacity: isDeconstructing ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: comp.iconColor,
                      }}
                    >
                      0{i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {comp.spec}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--color-green-700)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={11} /> {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: The Living Rebirth Project */}
        <div
          style={{
            padding: '28px 24px',
            background: 'linear-gradient(135deg, var(--surface-tint) 0%, var(--surface-card) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                AUTONOMOUS MATCH
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Feasibility:</span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'var(--color-green-600)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {device.matchedProject.feasibility}% MATCH
                </span>
              </div>
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {device.matchedProject.title}
            </h3>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              {device.matchedProject.summary}
            </p>

            {/* Impact Highlights Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Eco-Impact & Cost Avoidance
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-green-600)', fontFamily: 'var(--font-display)' }}>
                    {device.weightKg} kg
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Landfill Diverted</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-teal-600)', fontFamily: 'var(--font-display)' }}>
                    ₹{device.salvageValue.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Scrap Hardware Value</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-amber-500)', fontFamily: 'var(--font-display)' }}>
                    {device.matchedProject.difficulty}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Build Difficulty</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link
              to="/projects"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-green-500), var(--color-green-600))',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              Explore 20+ Maker Blueprints
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/inventory"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Log Scrap Parts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
