import { Link } from 'react-router-dom';
import { Leaf, Recycle, Zap, Users, ArrowRight, CircuitBoard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Landing() {
  const { t } = useLanguage();

  return (
    <main>
      {/* Hero Section */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(135deg, var(--surface-bg) 0%, var(--surface-tint) 50%, var(--surface-bg) 100%)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="circuit-bg"
      >
        {/* Decorative floating blobs */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(27,127,75,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(14,154,167,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div className="page-container" style={{ padding: '80px 24px', width: '100%' }}>
          <div style={{ maxWidth: 680 }}>
            {/* Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-tint)',
              border: '1px solid var(--surface-border)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-green-600)',
              marginBottom: 24,
            }}>
              <Leaf size={13} />
              Tamil-English E-Waste Platform
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 60px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 24,
              color: 'var(--text-primary)',
            }}>
              {t('landing.hero.title')}
            </h1>

            <p style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              marginBottom: 40,
              maxWidth: 540,
            }}>
              {t('landing.hero.subtitle')}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/signup" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-green-500)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 16,
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 12px rgba(27,127,75,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(27,127,75,0.4)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(27,127,75,0.3)';
              }}
              >
                {t('landing.hero.cta1')}
                <ArrowRight size={18} />
              </Link>
              <Link to="/projects" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: 16,
                border: '1px solid var(--surface-border)',
              }}>
                {t('landing.hero.cta2')}
              </Link>
            </div>

            {/* Live counter placeholder */}
            <div style={{
              display: 'flex',
              gap: 32,
              marginTop: 48,
              paddingTop: 32,
              borderTop: '1px solid var(--surface-border)',
              flexWrap: 'wrap',
            }}>
              {[
                { value: '20+', label: 'Reuse Projects' },
                { value: '30+', label: 'Component Types' },
                { value: 'Free', label: 'Always Free' },
              ].map(stat => (
                <div key={stat.label}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--color-green-500)' }} className="tabular-nums">
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 0', background: 'var(--surface-card)' }}>
        <div className="page-container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center', color: 'var(--text-primary)' }}>
            How it works
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 56, fontSize: 16 }}>
            Three steps to give your old electronics a new purpose
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                icon: <Package3D />,
                step: '01',
                title: 'Log your components',
                desc: 'Add components from old devices to your inventory. Mark condition and toggle "available to share".',
              },
              {
                icon: <MatchIcon />,
                step: '02',
                title: 'Get matched to projects',
                desc: 'Our engine scores 20 curated reuse projects against your inventory and ranks them by feasibility.',
              },
              {
                icon: <ImpactIcon />,
                step: '03',
                title: 'Build and track impact',
                desc: 'Mark projects as built, see the e-waste you\'ve diverted, and share parts via the community board.',
              },
            ].map(item => (
              <div key={item.step} style={{
                padding: 32,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-bg)',
                border: '1px solid var(--surface-border)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-tint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  color: 'var(--color-green-500)',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-500)', letterSpacing: '0.08em', marginBottom: 8 }}>
                  STEP {item.step}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section style={{ padding: '80px 0' }}>
        <div className="page-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: <CircuitBoard size={24} />, title: 'Teardown Guides', desc: 'Safe step-by-step instructions for 12 device types.' },
              { icon: <Recycle size={24} />,      title: 'Community Board', desc: 'Post and request parts from others nearby.' },
              { icon: <Zap size={24} />,          title: 'AI Inventor',     desc: 'Generate project ideas from your exact parts (Phase 3).' },
              { icon: <Users size={24} />,        title: 'Tamil Support',   desc: 'Full Tamil language support with Noto Sans Tamil.' },
            ].map(f => (
              <div key={f.title} style={{
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ color: 'var(--color-green-500)' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--surface-border)',
        padding: '32px 0',
        background: 'var(--surface-card)',
      }}>
        <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={16} color="var(--color-green-500)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              Seiyalaam
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>— Let's make it</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="https://github.com/deepikavijay56-max/Seiyalaam" target="_blank" rel="noreferrer"
              style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              GitHub
            </a>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Built for the planet 🌿
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Simple icon placeholder components
function Package3D() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>; }
function MatchIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>; }
function ImpactIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>; }
