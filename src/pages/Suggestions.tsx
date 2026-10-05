import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  Search,
  Filter,
  ArrowRight,
  Package,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Recycle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import {
  matchProjects,
  type Project,
  type Component,
} from '../lib/engine/matcher';
import {
  oneAwayProjects,
  unlockCounts,
} from '../lib/engine/oneAway';
import { useInventory, toInventoryEntries } from '../lib/inventory';
import FeasibilityRing from '../components/FeasibilityRing';
import projectsData from '../data/projects.json';
import componentsData from '../data/components.json';

const allProjects: Project[] = projectsData as Project[];
const allComponents: Component[] = componentsData as Component[];

export default function Suggestions() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, loading } = useInventory(user?.id);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [feasibilityFilter, setFeasibilityFilter] = useState<'all' | 'ready' | 'one-away'>('all');

  // Convert current inventory items into format expected by engine
  const inventoryEntries = useMemo(() => toInventoryEntries(items), [items]);

  // Match and rank all projects
  const rankedProjects = useMemo(() => {
    return matchProjects(inventoryEntries, allProjects, allComponents);
  }, [inventoryEntries]);

  // "One part away" projects
  const oneAwayList = useMemo(() => {
    return oneAwayProjects(inventoryEntries, allProjects, allComponents);
  }, [inventoryEntries]);

  // Highest unlocking missing components
  const unlockList = useMemo(() => {
    return unlockCounts(inventoryEntries, allProjects, allComponents);
  }, [inventoryEntries]);

  // Filtered project list
  const filteredList = useMemo(() => {
    return rankedProjects.filter(({ project, result }) => {
      // Category filter
      if (selectedCategory !== 'all' && project.category !== selectedCategory) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && project.difficulty !== selectedDifficulty) {
        return false;
      }
      // Feasibility filter
      if (feasibilityFilter === 'ready' && result.score < 80) {
        return false;
      }
      if (feasibilityFilter === 'one-away') {
        const isOneAway = oneAwayList.some(o => o.project.id === project.id);
        if (!isOneAway) return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = project.title.toLowerCase().includes(q);
        const matchDesc = project.description.toLowerCase().includes(q);
        const matchReq = project.requirements.some(r => r.component.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchReq) return false;
      }

      return true;
    });
  }, [rankedProjects, selectedCategory, selectedDifficulty, feasibilityFilter, searchTerm, oneAwayList]);

  // Top recommendation unlock banner (if any component unlocks >= 1 project)
  const topUnlock = unlockList[0];

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '32px 0 80px' }}>
      <div className="page-container">
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-tint)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-green-500)',
              }}>
                <Lightbulb size={20} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
                {t('suggestions.title')}
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              Ranked by parts feasibility based on your {items.length} inventory item{items.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/kandupidi"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              <Sparkles size={16} />
              Kandupidi Mode (AI Inventor)
            </Link>

            <Link
              to="/inventory"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--surface-border)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'border-color 0.2s, transform 0.1s',
              }}
            >
              <Package size={16} color="var(--color-green-500)" />
              Manage Inventory
            </Link>
          </div>
        </div>

        {/* Top Unlock / One-Part Away Insight Banner */}
        {topUnlock && topUnlock.projectsUnlocked > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(27, 127, 75, 0.08) 0%, rgba(14, 154, 167, 0.08) 100%)',
            border: '1px solid rgba(27, 127, 75, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 24px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 260 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--color-green-500)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-green-600)' }}>
                  Smart Hardware Insight
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                  Acquiring 1x <strong>{topUnlock.component}</strong> unlocks {topUnlock.projectsUnlocked} project{topUnlock.projectsUnlocked !== 1 ? 's' : ''} to 90%+ feasibility!
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                to="/community"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-slate-900)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Find on Community Board
              </Link>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('one-away')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                View 1-Part Away Projects
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search projects by name, description, or component…"
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
              <Filter size={15} />
              <span>Filters:</span>
            </div>

            {/* Feasibility filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: feasibilityFilter === 'all' ? 'var(--color-green-500)' : 'var(--surface-border)',
                  background: feasibilityFilter === 'all' ? 'var(--surface-tint)' : 'var(--surface-card)',
                  color: feasibilityFilter === 'all' ? 'var(--color-green-600)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All Scores
              </button>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('ready')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: feasibilityFilter === 'ready' ? 'var(--color-green-500)' : 'var(--surface-border)',
                  background: feasibilityFilter === 'ready' ? 'var(--surface-tint)' : 'var(--surface-card)',
                  color: feasibilityFilter === 'ready' ? 'var(--color-green-600)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ready to Build (≥80%)
              </button>
              <button
                type="button"
                onClick={() => setFeasibilityFilter('one-away')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: feasibilityFilter === 'one-away' ? 'var(--color-green-500)' : 'var(--surface-border)',
                  background: feasibilityFilter === 'one-away' ? 'var(--surface-tint)' : 'var(--surface-card)',
                  color: feasibilityFilter === 'one-away' ? 'var(--color-green-600)' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                1-Part Away ({oneAwayList.length})
              </button>
            </div>

            {/* Category dropdown */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                <option value="educational">Educational</option>
                <option value="creative">Creative</option>
                <option value="practical">Practical</option>
              </select>

              {/* Difficulty dropdown */}
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  outline: 'none',
                }}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
          }}>
            <AlertCircle size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
              No projects matched your filters
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Try resetting your search filters or add more parts to your inventory.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
                setFeasibilityFilter('all');
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-green-500)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}>
            {filteredList.map(({ project, result }) => {
              const totalReqs = project.requirements.length;
              const matchedCount = result.matched.filter(m => m.credit >= 0.7).length;
              const missingCount = result.missing.length;

              return (
                <div
                  key={project.id}
                  className="glow-card"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Header: Title + Feasibility Ring */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
                      <div>
                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--surface-tint)',
                            color: 'var(--color-green-600)',
                          }}>
                            {project.category}
                          </span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-slate-100)',
                            color: 'var(--text-secondary)',
                          }}>
                            {project.difficulty}
                          </span>
                        </div>

                        <h3 style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 18,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          margin: 0,
                          color: 'var(--text-primary)',
                        }}>
                          {project.title}
                        </h3>
                      </div>

                      {/* Circular Feasibility Ring */}
                      <FeasibilityRing score={result.score} size={54} strokeWidth={5} />
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: '0 0 16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {project.description}
                    </p>

                    {/* Requirements Status */}
                    <div style={{
                      background: 'var(--surface-bg)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      marginBottom: 16,
                      fontSize: 13,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Parts Feasibility</span>
                        <span style={{ fontWeight: 600, color: result.score >= 80 ? 'var(--color-green-600)' : 'var(--text-primary)' }}>
                          {matchedCount} / {totalReqs} ready
                        </span>
                      </div>

                      {/* Missing or substitutes highlights */}
                      {missingCount === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-green-600)', fontSize: 12, fontWeight: 500 }}>
                          <CheckCircle2 size={14} />
                          <span>All required components in inventory!</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {result.missing.slice(0, 2).map((m, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: '#fef2f2',
                                color: 'var(--color-red-500)',
                                fontWeight: 500,
                              }}
                            >
                              Need {m.needed}× {m.component}
                            </span>
                          ))}
                          {missingCount > 2 && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                              +{missingCount - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Substitute tag if used */}
                      {result.substitutesUsed.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-teal-600)', fontWeight: 500 }}>
                          Using substitute: {result.substitutesUsed[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Waste diverted + Action Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid var(--surface-border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-green-600)', fontSize: 12, fontWeight: 600 }}>
                      <Recycle size={15} />
                      <span>{result.wasteDiverted_g}g diverted</span>
                    </div>

                    <Link
                      to={`/projects/${project.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--color-green-600)',
                        fontWeight: 600,
                        fontSize: 13,
                        textDecoration: 'none',
                      }}
                    >
                      <span>View Detail</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
