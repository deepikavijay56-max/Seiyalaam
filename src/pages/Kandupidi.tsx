import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Zap,
  Bookmark,
  Check,
  RefreshCw,
  Cpu,
  ArrowRight,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../hooks/useAuth';
import {
  generateIdeas,
  saveIdeaAsProject,
  getDemoIdeas
} from '../lib/engine/inventor';
import type { ValidatedIdea } from '../types';

export default function Kandupidi() {
  const { items: inventory, saveItem } = useInventory();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<ValidatedIdea[]>(() => getDemoIdeas(inventory));
  const [loading, setLoading] = useState(false);
  const [savedIdeaIds, setSavedIdeaIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function handleInvent() {
    setLoading(true);
    setToastMessage(null);
    try {
      const generated = await generateIdeas(inventory);
      setIdeas(generated);
    } catch (err) {
      console.error('Kandupidi invention error:', err);
      setToastMessage('Generated ideas using cached demo mode.');
      setIdeas(getDemoIdeas(inventory));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProject(idea: ValidatedIdea) {
    try {
      await saveIdeaAsProject(idea, user?.id);
      setSavedIdeaIds(prev => ({ ...prev, [idea.id]: true }));
      setToastMessage(`"${idea.title}" saved to Projects catalog! (is_ai_generated = true)`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save project:', err);
      setToastMessage('Failed to save project. Please try again.');
    }
  }

  // Quick helper to populate a realistic sample inventory for testing
  function handleLoadTestInventory() {
    const sampleParts: { name: string; qty: number }[] = [
      { name: 'Arduino Uno', qty: 1 },
      { name: 'DC Motor (small)', qty: 2 },
      { name: 'Ultrasonic Sensor', qty: 1 },
      { name: 'Jumper Wires (set)', qty: 2 },
      { name: 'Buzzer', qty: 1 },
      { name: '18650 Li-ion Battery', qty: 2 },
    ];

    sampleParts.forEach(p => {
      saveItem({
        component_id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        componentName: p.name,
        quantity: p.qty,
        condition: 'tested',
        available_to_share: false,
      });
    });

    setToastMessage('Loaded sample salvages electronics into your inventory!');
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-bg)', paddingBottom: 80 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            background: 'var(--color-slate-900)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <CheckCircle size={18} color="var(--color-green-400)" />
          {toastMessage}
        </div>
      )}

      {/* Hero Header */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 100%)',
          borderBottom: '1px solid var(--surface-border)',
          padding: '48px 0 36px',
        }}
      >
        <div className="page-container">
          <div style={{ maxWidth: 860 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--color-green-800)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <Sparkles size={15} color="var(--color-green-600)" />
              AI Inventor & Deterministic Verifier
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: 'var(--color-slate-900)',
                marginBottom: 14,
              }}
            >
              Kandupidi Mode (AI Inventor)
            </h1>

            <p
              style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: 720,
                marginBottom: 28,
              }}
            >
              Turn your salvaged e-waste components into ingenious working hardware. Every AI idea is strictly verified deterministically for catalog existence, owned quantities, voltage rail matching, and electrical safety tags.
            </p>

            {/* Action Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
              <button
                id="btn-invent-something"
                onClick={handleInvent}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Inventing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Invent Something</span>
                  </>
                )}
              </button>

              {inventory.length === 0 && (
                <button
                  onClick={handleLoadTestInventory}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    background: 'white',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--color-slate-700)',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Package size={16} />
                  <span>Load Demo Inventory</span>
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                <ShieldCheck size={16} color="var(--color-green-600)" />
                <span>Zero unverified AI output guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="page-container" style={{ paddingTop: 36 }}>
        {/* User Inventory Summary Bar */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '20px 24px',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Cpu size={20} color="var(--color-green-600)" />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-slate-900)' }}>
                Your Usable Salvaged Inventory (
                {inventory.filter(i => i.quantity > 0).length} types)
              </h2>
            </div>
            <Link
              to="/inventory"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-green-700)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Manage Inventory</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {inventory.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Your inventory is currently empty. Click &quot;Load Demo Inventory&quot; above or teardown a device to add parts!
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {inventory
                .filter(i => i.quantity > 0)
                .map(item => (
                  <span
                    key={item.id}
                    style={{
                      background: item.condition === 'faulty' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-slate-100)',
                      color: item.condition === 'faulty' ? 'var(--color-red-700)' : 'var(--color-slate-800)',
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      border:
                        item.condition === 'faulty'
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid var(--surface-border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{item.componentName}</span>
                    <strong style={{ fontWeight: 700 }}>×{item.quantity}</strong>
                    {item.condition === 'faulty' && (
                      <span style={{ fontSize: 11, color: 'var(--color-red-600)', fontWeight: 600 }}>
                        (faulty)
                      </span>
                    )}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Ideas Grid */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--color-slate-900)',
                  margin: 0,
                }}
              >
                Invention Candidates & Verification Analysis
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                Each invention is run through <code style={{ color: 'var(--color-green-700)' }}>validateIdea()</code>{' '}
                before rendering.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {ideas.map((idea, idx) => {
              const isSaved = Boolean(savedIdeaIds[idea.id]);
              const isVerified = idea.status === 'verified';
              const isNeedsParts = idea.status === 'needs_parts';
              const isRejected = idea.status === 'rejected';

              return (
                <div
                  key={idea.id || idx}
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    border: isVerified
                      ? '2px solid rgba(16, 185, 129, 0.4)'
                      : isNeedsParts
                      ? '1px solid rgba(245, 158, 11, 0.4)'
                      : '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Status Banner */}
                  <div
                    style={{
                      padding: '10px 18px',
                      background: isVerified
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isNeedsParts
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                      borderBottom: '1px solid var(--surface-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isVerified && <CheckCircle size={16} color="var(--color-green-700)" />}
                      {isNeedsParts && <AlertTriangle size={16} color="#d97706" />}
                      {isRejected && <XCircle size={16} color="var(--color-red-600)" />}

                      <span
                        style={{
                          color: isVerified
                            ? 'var(--color-green-800)'
                            : isNeedsParts
                            ? '#b45309'
                            : 'var(--color-red-700)',
                        }}
                      >
                        {isVerified && 'Verified: 100% Ready'}
                        {isNeedsParts && `Needs ${idea.missingCount} parts`}
                        {isRejected && 'Safety Rejected'}
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'white',
                        color: 'var(--color-slate-700)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {idea.supplyVoltage ? `${idea.supplyVoltage}V DC` : '5V DC'}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3
                      style={{
                        fontSize: 19,
                        fontWeight: 800,
                        color: 'var(--color-slate-900)',
                        marginBottom: 8,
                      }}
                    >
                      {idea.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        marginBottom: 16,
                      }}
                    >
                      {idea.description}
                    </p>

                    {/* Rejection / Safety Alert */}
                    {isRejected && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          color: 'var(--color-red-800)',
                          fontSize: 12,
                          lineHeight: 1.4,
                          marginBottom: 16,
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <strong>Reason:</strong> {idea.rejectionReason}
                        </div>
                      </div>
                    )}

                    {/* Voltage Converter Recommendation */}
                    {idea.voltageCompatibility.converterSuggested && (
                      <div
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          color: '#92400e',
                          fontSize: 12,
                          lineHeight: 1.4,
                          marginBottom: 16,
                          display: 'flex',
                          gap: 8,
                        }}
                      >
                        <Zap size={16} style={{ flexShrink: 0, marginTop: 2, color: '#d97706' }} />
                        <div>
                          <strong>Voltage Compatibility:</strong> {idea.voltageCompatibility.converterSuggested}
                        </div>
                      </div>
                    )}

                    {/* Parts Used Breakdown */}
                    <div style={{ marginBottom: 18 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: 'var(--color-slate-500)',
                          marginBottom: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Layers size={14} />
                        <span>Parts Breakdown (Owned vs Needed)</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {idea.partsUsed.map((part, pIdx) => {
                          const isFullyOwned = part.missing === 0;
                          return (
                            <div
                              key={pIdx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: isFullyOwned ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.08)',
                                fontSize: 13,
                              }}
                            >
                              <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                                {part.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                  Owned: {part.owned} / Need: {part.needed}
                                </span>
                                {isFullyOwned ? (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: 'var(--color-green-700)',
                                      background: 'rgba(16, 185, 129, 0.15)',
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                    }}
                                  >
                                    ✓ In Stock
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#b45309',
                                      background: 'rgba(245, 158, 11, 0.2)',
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                    }}
                                  >
                                    +{part.missing} Needed
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Build Steps */}
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: 'var(--color-slate-500)',
                          marginBottom: 8,
                        }}
                      >
                        Build Steps ({idea.steps.length})
                      </div>
                      <ol
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          fontSize: 13,
                          color: 'var(--color-slate-700)',
                          lineHeight: 1.5,
                        }}
                      >
                        {idea.steps.map((step, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: 6 }}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Action Bar */}
                    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--surface-border)' }}>
                      <button
                        onClick={() => handleSaveProject(idea)}
                        disabled={isSaved || isRejected}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          borderRadius: 10,
                          background: isSaved
                            ? 'var(--color-slate-100)'
                            : isRejected
                            ? 'var(--color-slate-100)'
                            : 'var(--color-green-600)',
                          color: isSaved
                            ? 'var(--color-slate-600)'
                            : isRejected
                            ? 'var(--color-slate-400)'
                            : 'white',
                          fontWeight: 600,
                          fontSize: 14,
                          border: 'none',
                          cursor: isSaved || isRejected ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSaved ? (
                          <>
                            <Check size={16} color="var(--color-green-600)" />
                            <span>Saved as Project (is_ai_generated: true)</span>
                          </>
                        ) : (
                          <>
                            <Bookmark size={16} />
                            <span>Save as Project</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Security Callout */}
        <div
          style={{
            marginTop: 48,
            padding: '24px 28px',
            background: 'white',
            borderRadius: 16,
            border: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <Info size={24} color="var(--color-green-600)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-slate-900)' }}>
              Deterministic Hardware Validation Protocol
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Antigravity AI guarantees that every project generated by Kandupidi Mode is passed through
              our strict deterministic validator. No raw LLM hallucinates non-existent hardware, dangerous AC
              voltages, or swollen lithium batteries without being flagged and rejected immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
