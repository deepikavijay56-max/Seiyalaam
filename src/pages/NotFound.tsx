import { Link } from 'react-router-dom';
import { Home, Lightbulb, Package, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--surface-bg)',
      }}
    >
      <div
        style={{
          maxWidth: 540,
          width: '100%',
          textAlign: 'center',
          padding: '48px 32px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        className="glow-card"
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-tint)',
            color: 'var(--color-green-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Compass size={32} />
        </div>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--color-green-700)',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          404 · CIRCUIT NOT FOUND
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 12px',
            color: 'var(--text-primary)',
          }}
        >
          This Trace Leads Nowhere
        </h1>

        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          The electronic component, page, or blueprint you are searching for might have been moved, upcycled, or disconnected from the network.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-green-500), var(--color-green-600))',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Home size={16} /> Return Home
          </Link>

          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid var(--surface-border)',
            }}
          >
            <Lightbulb size={16} color="var(--color-green-500)" /> Browse Projects
          </Link>

          <Link
            to="/inventory"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-bg)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid var(--surface-border)',
            }}
          >
            <Package size={16} color="var(--color-teal-500)" /> My Inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
