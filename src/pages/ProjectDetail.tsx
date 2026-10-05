import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Recycle,
  ShieldAlert,
  Wrench,
  Check,
  Package,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  scoreProject,
  type Project,
  type Component,
} from '../lib/engine/matcher';
import { useInventory, toInventoryEntries } from '../lib/inventory';
import FeasibilityRing from '../components/FeasibilityRing';
import projectsData from '../data/projects.json';
import componentsData from '../data/components.json';

const allProjects: Project[] = projectsData as Project[];
const allComponents: Component[] = componentsData as Component[];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { items } = useInventory(user?.id);

  // Track completed steps locally for maker progress
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const project = useMemo(() => {
    return allProjects.find(p => p.id === id);
  }, [id]);

  const inventoryEntries = useMemo(() => toInventoryEntries(items), [items]);

  const scoreResult = useMemo(() => {
    if (!project) return null;
    return scoreProject(inventoryEntries, project, allComponents);
  }, [project, inventoryEntries]);

  if (!project || !scoreResult) {
    return (
      <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '60px 0' }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 12 }}>
            Project Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            The requested project could not be found in our catalog.
          </p>
          <Link
            to="/projects"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-green-500)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const { score, matched, missing, wasteDiverted_g } = scoreResult;

  // Feasibility status badge and label
  const getStatusText = (s: number) => {
    if (s >= 80) return { title: 'High Feasibility — Ready to Build!', desc: 'You have almost all required components in your inventory.', color: 'var(--color-green-600)' };
    if (s >= 50) return { title: 'Moderate Feasibility — Almost Ready', desc: 'You can build this project by adding or substituting a few parts.', color: 'var(--color-amber-600)' };
    return { title: 'Low Feasibility — Key Parts Missing', desc: 'Check the missing parts checklist below to find what you need.', color: 'var(--color-slate-600)' };
  };

  const status = getStatusText(score);

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '32px 0 80px' }}>
      <div className="page-container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 24 }}>
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-card)',
              border: '1px solid var(--surface-border)',
            }}
          >
            <ArrowLeft size={16} />
            Back to Project Suggestions
          </Link>
        </div>

        {/* Project Header Banner */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Category & Difficulty */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-tint)',
                  color: 'var(--color-green-600)',
                }}>
                  {project.category}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-slate-100)',
                  color: 'var(--text-secondary)',
                }}>
                  Difficulty: {project.difficulty}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(27, 127, 75, 0.1)',
                  color: 'var(--color-green-600)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <Recycle size={14} />
                  {wasteDiverted_g}g E-waste Diverted
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                margin: '0 0 12px',
              }}>
                {project.title}
              </h1>

              <p style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 720,
              }}>
                {project.description}
              </p>
            </div>

            {/* Feasibility Ring Card */}
            <div style={{
              background: 'var(--surface-bg)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              minWidth: 260,
            }}>
              <FeasibilityRing score={score} size={72} strokeWidth={7} labelSize={18} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Match Score
                </span>
                <h4 style={{ margin: '2px 0 4px', fontSize: 16, fontWeight: 700, color: status.color }}>
                  {status.title}
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {status.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Warning Callout */}
        {project.safety_notes && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}>
            <div style={{
              color: 'var(--color-amber-600)',
              marginTop: 2,
              flexShrink: 0,
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', color: '#92400e', fontSize: 15, fontWeight: 700 }}>
                Safety Advisory
              </h4>
              <p style={{ margin: 0, color: '#78350f', fontSize: 14, lineHeight: 1.5 }}>
                {project.safety_notes}
              </p>
            </div>
          </div>
        )}

        {/* Two Column Layout: Requirements vs Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
          {/* Left Column: Required Components */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            height: 'fit-content',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} color="var(--color-green-500)" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Required Components
                </h3>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                {matched.length} of {project.requirements.length} available
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {project.requirements.map((req, idx) => {
                const isMatched = matched.find(m => m.component === req.component);
                const isMissing = missing.find(m => m.component === req.component);

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isMatched ? 'var(--surface-bg)' : '#fef2f2',
                      border: '1px solid',
                      borderColor: isMatched ? 'var(--surface-border)' : '#fee2e2',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                          {req.component}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          (Qty: {req.qty})
                        </span>
                        {req.critical && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#fee2e2',
                            color: 'var(--color-red-500)',
                          }}>
                            Critical
                          </span>
                        )}
                      </div>

                      {/* Condition Note / Substitute details */}
                      {isMatched?.substituteUsed && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-teal-600)', fontWeight: 500 }}>
                          Substituted by owned {isMatched.substituteUsed}
                        </div>
                      )}

                      {isMatched?.conditionNote && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--color-amber-600)' }}>
                          ⚠ {isMatched.conditionNote}
                        </div>
                      )}

                      {isMissing && req.substitutes.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                          Possible substitutes: {req.substitutes.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div style={{ flexShrink: 0, marginTop: 2 }}>
                      {isMatched ? (
                        <CheckCircle2 size={20} color="var(--color-green-500)" />
                      ) : (
                        <XCircle size={20} color="var(--color-red-500)" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {missing.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Link
                  to="/inventory"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-tint)',
                    color: 'var(--color-green-600)',
                    border: '1px solid var(--surface-border)',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Package size={16} />
                  Add Missing Parts in Inventory
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Step-by-Step Build Instructions */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Wrench size={20} color="var(--color-green-500)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>
                Build Guide ({project.steps.length} Steps)
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {project.steps.map(step => {
                const isCompleted = completedSteps[step.step];

                return (
                  <div
                    key={step.step}
                    onClick={() => toggleStep(step.step)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 16,
                      padding: 16,
                      borderRadius: 'var(--radius-md)',
                      background: isCompleted ? 'var(--surface-tint)' : 'var(--surface-bg)',
                      border: '1px solid',
                      borderColor: isCompleted ? 'rgba(27, 127, 75, 0.3)' : 'var(--surface-border)',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                  >
                    {/* Step indicator circle / checkbox */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--color-green-500)' : 'var(--surface-card)',
                      border: `2px solid ${isCompleted ? 'var(--color-green-500)' : 'var(--surface-border)'}`,
                      color: isCompleted ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {isCompleted ? <Check size={16} /> : step.step}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: '0 0 4px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: isCompleted ? 'var(--color-green-700)' : 'var(--text-primary)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                      }}>
                        {step.title}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        color: isCompleted ? 'var(--text-muted)' : 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
