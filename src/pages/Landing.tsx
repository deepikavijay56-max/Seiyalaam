import { Link } from 'react-router-dom';
import {
  Leaf,
  Zap,
  Users,
  ArrowRight,
  CircuitBoard,
  ShieldCheck,
  Sparkles,
  Wrench,
  ExternalLink,
  Award
} from 'lucide-react';
import CircuitCanvas from '../components/animations/CircuitCanvas';
import FloatingElectronics from '../components/animations/FloatingElectronics';
import HardwareTeardownSimulator from '../components/animations/HardwareTeardownSimulator';
import InteractiveScrapCalculator from '../components/animations/InteractiveScrapCalculator';
import ComponentVisionScanner from '../components/animations/ComponentVisionScanner';
import LiveImpactTicker from '../components/animations/LiveImpactTicker';

export default function Landing() {
  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      {/* ─────────────────────────────────────────────────────────────
          Hero Section with Interactive Circuit Canvas
          ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 68px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 0 80px',
          background: 'linear-gradient(180deg, #F8FAFC 0%, #EFFCF6 45%, #F8FAFC 100%)',
          overflow: 'hidden',
        }}
        className="circuit-grid"
      >
        {/* Interactive canvas running real electronic trace pulses */}
        <CircuitCanvas opacity={0.65} interactive={true} />

        {/* Ambient floating components */}
        <FloatingElectronics />

        <div className="page-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
            {/* Hackathon Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)',
                marginBottom: 24,
              }}
              className="shimmer-badge"
            >
              <Award size={15} color="var(--color-green-600)" />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-green-800)',
                }}
              >
                HACKATHON INNOVATION · E-WASTE REBIRTH ENGINE
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 6.2vw, 68px)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.08,
                marginBottom: 22,
                color: 'var(--text-primary)',
              }}
            >
              Turn <span style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Dead Electronics</span> into Living Innovations.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(16px, 2vw, 19px)',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: 36,
                maxWidth: 680,
                margin: '0 auto 36px',
              }}
            >
              Scavenge valuable stepper motors, high-grade silicon, and 18650 cells from obsolete gadgets. Match with 20+ tested DIY blueprints, avoid landfill toxicity, and build high-tech gear.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
              <Link
                to="/projects"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Browse 20+ Reuse Projects</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="#simulator"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 26px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Zap size={16} color="var(--color-amber-500)" />
                <span>Test Live Teardown Simulator</span>
              </a>
            </div>

            {/* Micro Stats Bar */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px 24px',
                padding: '12px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--surface-border)',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '100%',
              }}
            >
              {[
                { val: '20+', lbl: 'Curated Blueprints' },
                { val: '30+', lbl: 'Scavengeable Components' },
                { val: 'Class A-E', lbl: 'Hazard Safety Engine' },
                { val: '100% Free', lbl: 'Open-Access Maker Tech' },
              ].map(s => (
                <div key={s.lbl} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--color-green-700)' }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Showstopper: Live Interactive Teardown Simulator */}
          <div id="simulator" style={{ marginTop: 56, maxWidth: 1040, margin: '56px auto 0' }}>
            <HardwareTeardownSimulator />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Live Circular Impact Telemetry Banner
          ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 0', background: 'var(--surface-bg)', borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>
        <div className="page-container">
          <LiveImpactTicker />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Interactive Instant Scrap Calculator (Try It Live)
          ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(180deg, var(--surface-bg) 0%, var(--surface-card) 100%)' }}>
        <div className="page-container">
          <InteractiveScrapCalculator />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Bento Grid: The 4 Technological Pillars of Seiyalaam
          ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surface-card)', position: 'relative' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-green-600)',
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              CIRCULAR HARDWARE ARCHITECTURE
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: '8px 0 12px',
                color: 'var(--text-primary)',
              }}
            >
              Engineered to Turn Junk into Gold
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
              A deterministic matching algorithm, hazard-mitigated teardown workflows, and localized vernacular intelligence.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {/* Box 1: AI Vision Optical Scanner (Spans 7 cols) */}
            <div
              style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-bg)',
                border: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              className="glow-card bento-col-7"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--color-green-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircuitBoard size={18} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-700)' }}>
                    AI COMPONENT VISION & PINOUT ENGINE
                  </span>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                  Smart Component Identification
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  Take a photo of mystery salvaged circuit boards or microchips. The engine parses IC markings, suggests pinouts, and flags hazardous parts.
                </p>
              </div>

              {/* Live interactive visualizer */}
              <ComponentVisionScanner />
            </div>

            {/* Box 2: "One-Away" Missing Link Engine (Spans 5 cols) */}
            <div
              style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, var(--surface-tint) 0%, var(--surface-card) 100%)',
                border: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              className="glow-card bento-col-5"
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: 'var(--color-amber-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-600)' }}>
                    THE "ONE-AWAY" ALGORITHM
                  </span>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                  Unlock Multiple Projects with 1 Cheap Part
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                  Don't have all components? Our engine pinpoints the exact single missing part that unlocks the maximum number of feasible creations.
                </p>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Example Engine Output
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-green-700)' }}>
                    + 1x 10kΩ Potentiometer (₹15)
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Unlocks: <strong>Bench Power Supply</strong>, <strong>Audio Mixer</strong>, and <strong>Fan Speed Controller</strong>.
                  </div>
                </div>
              </div>

              <Link
                to="/suggestions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 24,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--color-green-600)',
                  textDecoration: 'none',
                }}
              >
                Inspect Matching Engine <ArrowRight size={15} />
              </Link>
            </div>

            {/* Box 3: Teardown Safety & Hazard Classification (Spans 6 cols) */}
            <div
              style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
              }}
              className="glow-card bento-col-6"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-red-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-red-500)' }}>
                  SAFETY-FIRST PROTOCOLS
                </span>
              </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>
                Class A to E Teardown Risk Assessment
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Never risk electrocution or battery fires. Seiyalaam walks makers through discharge protocols for CRT flybacks, high-voltage capacitors, and lithium batteries.
              </p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Class A: Safe Low-Volt', 'Class C: Repairable', 'Class E: Hazardous Recycle'].map(c => (
                  <span
                    key={c}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-bg)',
                      border: '1px solid var(--surface-border)',
                      fontWeight: 600,
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Box 4: Open Maker Education (Spans 6 cols) */}
            <div
              style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
              }}
              className="glow-card bento-col-6"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'var(--color-teal-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-teal-600)' }}>
                  OPEN CIRCULAR HARDWARE
                </span>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>
                Grassroots Maker Hardware Guides
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Hardware hacking should be accessible to all innovators. Makers and engineering students can learn component recovery, schematics, and circular upcycling with step-by-step guidance.
              </p>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-tint)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontSize: 13,
                  color: 'var(--color-green-800)',
                  fontWeight: 600,
                }}
              >
                &quot;Don&apos;t trash obsolete electronics — rebuild them into purpose-driven hardware!&quot;
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            div[style*="gridTemplateColumns: repeat(12"] > div {
              grid-column: span 12 !important;
            }
          }
        `}</style>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          How It Works: 3-Step Rebirth Cycle
          ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surface-bg)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 52px' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-green-600)', fontWeight: 700 }}>
              SEAMLESS LIFECYCLE
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, margin: '6px 0 10px' }}>
              From Landfill Waste to Functional Hardware
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
              Follow three simple steps to start your hardware salvage journey.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                step: '01',
                title: 'Safely Teardown & Log Parts',
                desc: 'Assess your old device safety class, follow step-by-step disassembly guides, and log components into your private inventory.',
                icon: <Wrench size={22} color="var(--color-green-500)" />,
              },
              {
                step: '02',
                title: 'Algorithm Matches Projects',
                desc: 'Our deterministic scoring engine computes feasible builds, highlighting projects you can build right now with 100% components ready.',
                icon: <Zap size={22} color="var(--color-teal-500)" />,
              },
              {
                step: '03',
                title: 'Build & Divert Landfill E-Waste',
                desc: 'Follow schematics, mark projects as completed, and track real kilograms of toxic e-waste diverted from local ecosystems.',
                icon: <Leaf size={22} color="var(--color-lime-500)" />,
              },
            ].map(item => (
              <div
                key={item.step}
                style={{
                  padding: '32px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--surface-border)',
                  position: 'relative',
                }}
                className="glow-card"
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-tint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--color-green-600)',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  PHASE {item.step}
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, margin: '0 0 10px' }}>
                  {item.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Call to Action Banner
          ───────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 0',
          background: 'linear-gradient(135deg, #09120E 0%, #101C16 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CircuitCanvas opacity={0.35} interactive={false} />

        <div className="page-container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 720 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              marginBottom: 20,
            }}
          >
            <Sparkles size={13} />
            CIRCULAR HARDWARE REVOLUTION
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 18,
              color: '#F1FBF5',
            }}
          >
            Don't let rare earth minerals and stepper motors die in a landfill.
          </h2>

          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.6, marginBottom: 36 }}>
            Join makers, students, and engineers across Tamil Nadu building real hardware for zero rupees.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 32px',
                borderRadius: 'var(--radius-full)',
                background: '#10B981',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: '0 6px 25px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              Get Started Free <ArrowRight size={18} />
            </Link>

            <Link
              to="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#F1FBF5',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 16,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Modern Footer
          ───────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--surface-border)',
          padding: '40px 0',
          background: 'var(--surface-card)',
        }}
      >
        <div className="page-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/logo.png"
                alt="Seiyalaam"
                style={{
                  height: 36,
                  width: 'auto',
                  maxWidth: 40,
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                }}
              />
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                  Seiyalaam
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                  — Let's make it together
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
              <Link to="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
                Projects
              </Link>
              <Link to="/teardown" style={{ textDecoration: 'none', color: 'inherit' }}>
                Teardowns
              </Link>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
                Impact
              </Link>
              <a
                href="https://github.com/deepikavijay56-max/Seiyalaam"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', color: 'var(--color-green-600)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                GitHub <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--surface-border)',
              marginTop: 24,
              paddingTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span>Built for the planet & sustainable circular hardware 🌿</span>
            <span>Bilingual Tamil-English Engine · Clean Code</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
