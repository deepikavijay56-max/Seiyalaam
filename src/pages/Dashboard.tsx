import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Recycle,
  Lightbulb,
  Wrench,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInventory, toInventoryEntries } from '../lib/inventory';
import { matchProjects, type Project, type Component } from '../lib/engine/matcher';
import { unlockCounts } from '../lib/engine/oneAway';
import {
  IMPACT_CONFIG,
  calculateCO2AvoidedKg,
} from '../lib/config/impact';
import {
  getDeviceCountsByClass,
  CLASS_LABELS,
  type DeviceClass,
} from '../lib/devices';
import projectsData from '../data/projects.json';
import componentsData from '../data/components.json';

const allProjects: Project[] = projectsData as Project[];
const allComponents: Component[] = componentsData as Component[];

export default function Dashboard() {
  const { user } = useAuth();
  const { items } = useInventory(user?.id);

  // Live India e-waste ticker (elapsed seconds on page)
  const [secondsOnPage, setSecondsOnPage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsOnPage(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const entries = useMemo(() => toInventoryEntries(items), [items]);

  const ranked = useMemo(() => {
    return matchProjects(entries, allProjects, allComponents);
  }, [entries]);

  // Unlock counts
  const unlocks = useMemo(() => {
    return unlockCounts(entries, allProjects, allComponents);
  }, [entries]);

  // Compute total grams diverted from logged inventory
  const compWeightMap = useMemo(() => {
    return new Map(allComponents.map(c => [c.name.toLowerCase().trim(), c.weight_g]));
  }, []);

  const totalGramsFromInventory = useMemo(() => {
    return items.reduce((acc, item) => {
      const wt = compWeightMap.get(item.componentName.toLowerCase().trim()) ?? 20;
      return acc + (wt * item.quantity);
    }, 0);
  }, [items, compWeightMap]);

  // Projects feasible >= 80%
  const readyProjects = useMemo(() => {
    return ranked.filter(r => r.result.score >= 80);
  }, [ranked]);

  // Potential waste diverted if ready projects are built
  const totalGramsFromProjects = useMemo(() => {
    return readyProjects.reduce((acc, curr) => acc + curr.result.wasteDiverted_g, 0);
  }, [readyProjects]);

  const totalGrams = totalGramsFromInventory + totalGramsFromProjects;
  const totalKgDiverted = Math.round((totalGrams / 1000) * 100) / 100;

  // CO2 avoided calculation
  const { co2Kg, assumptionNote } = calculateCO2AvoidedKg(totalGrams);

  // Relatable metrics
  const treesEquivalent = Math.round((co2Kg / IMPACT_CONFIG.TREE_SEEDLING_CARBON_ABSORBED_KG_PER_YEAR) * 10) / 10;
  const smartphoneCharges = Math.round(co2Kg * IMPACT_CONFIG.SMARTPHONE_CHARGES_PER_KG_CO2);

  // India cumulative e-waste generated while user has been on page (~45.14 kg per sec)
  const indiaAccumulatedKg = Math.round(secondsOnPage * IMPACT_CONFIG.INDIA_EWASTE_PER_SECOND_KG);

  // Assessed device counts by class
  const [deviceClassCounts] = useState<Record<DeviceClass, number>>(() => getDeviceCountsByClass());

  const totalDevicesAssessed = Object.values(deviceClassCounts).reduce((a, b) => a + b, 0);

  // Category breakdown for chart
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      microcontroller: 0,
      motor: 0,
      sensor: 0,
      display: 0,
      power: 0,
      other: 0,
    };

    const compCatMap = new Map(allComponents.map(c => [c.name.toLowerCase().trim(), c.category]));

    for (const item of items) {
      const cat = compCatMap.get(item.componentName.toLowerCase().trim()) ?? 'other';
      const wt = compWeightMap.get(item.componentName.toLowerCase().trim()) ?? 15;
      if (stats[cat] !== undefined) {
        stats[cat] += wt * item.quantity;
      } else {
        stats.other += wt * item.quantity;
      }
    }

    return stats;
  }, [items, compWeightMap]);

  const maxCatWeight = Math.max(1, ...Object.values(categoryStats));

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '32px 0 80px' }}>
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
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
                <LayoutDashboard size={20} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0 }}>
                Circular Impact Dashboard
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              Track hardware diversion, estimated CO₂ emissions avoided, and device diagnostic health.
            </p>
          </div>

          <Link
            to="/teardown"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-green-500)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <Wrench size={16} />
            Assess a Device
          </Link>
        </div>

        {/* 4 Primary Impact Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}>
          {/* 1. Total kg Diverted */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(27, 127, 75, 0.1)', color: 'var(--color-green-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Recycle size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Diverted</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {totalKgDiverted} <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {items.length} parts logged ({totalGramsFromInventory}g) + {readyProjects.length} ready builds
            </p>
          </div>

          {/* 2. Estimated CO2 Avoided */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(14, 154, 167, 0.1)', color: 'var(--color-teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>CO₂e Avoided</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              ~{co2Kg} <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>kg</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Factor: 1.44 kg CO₂e / kg hardware <span style={{ color: 'var(--color-teal-600)', fontWeight: 600 }}>(Estimate)</span>
            </p>
          </div>

          {/* 3. Devices Assessed / Torn Down */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(245, 165, 36, 0.12)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Devices Assessed</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {totalDevicesAssessed}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              diagnostic checklists completed
            </p>
          </div>

          {/* 4. Projects Feasible / Ready to Build */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--surface-tint)', color: 'var(--color-green-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={20} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Ready Projects</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {readyProjects.length}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              projects with ≥80% feasibility score
            </p>
          </div>
        </div>

        {/* Device Counts by Class A - E (Phase 2B requirement) */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 32,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: 18, fontWeight: 700 }}>
                Device Classification Breakdown (Classes A–E)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Triage summary based on diagnostic checklist criteria
              </p>
            </div>
            <Link to="/teardown" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-green-600)', textDecoration: 'none' }}>
              Perform Diagnostic Assessment →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {(['A', 'B', 'C', 'D', 'E'] as DeviceClass[]).map(cls => {
              const count = deviceClassCounts[cls] || 0;
              const colorMap: Record<DeviceClass, string> = {
                A: 'var(--class-a)',
                B: 'var(--class-b)',
                C: 'var(--class-c)',
                D: 'var(--class-d)',
                E: 'var(--class-e)',
              };

              return (
                <div
                  key={cls}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--surface-border)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: colorMap[cls],
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '28px',
                    marginBottom: 6,
                  }}>
                    {cls}
                  </span>
                  <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colorMap[cls], marginTop: 2 }}>
                    {CLASS_LABELS[cls]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seiyalaam vs India Comparison & Live E-waste Ticker */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(27, 127, 75, 0.06) 0%, rgba(14, 154, 167, 0.06) 100%)',
          border: '1px solid rgba(27, 127, 75, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                }}>
                  National Perspective
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  (Official-Data Estimate based on CPCB reports)
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                Seiyalaam vs. India E-waste Tide
              </h3>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 640 }}>
                India generates approximately <strong>3,900 metric tonnes of electronic waste every single day</strong> — that is over <strong>45 kilograms every second</strong>. By salvaging parts instead of binning them, makers in our network intercept critical metals and circuit modules before they reach toxic landfills.
              </p>

              {/* Equivalence Pill Badges */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'white',
                  border: '1px solid var(--surface-border)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  🌱 Equivalent to <strong>{treesEquivalent}</strong> tree seedlings grown for 1 year
                </div>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'white',
                  border: '1px solid var(--surface-border)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  📱 Offsets <strong>{smartphoneCharges}</strong> full smartphone charges
                </div>
              </div>
            </div>

            {/* Live Ticker Box */}
            <div style={{
              background: 'white',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              minWidth: 240,
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <Clock size={14} />
                <span>Elapsed on this page: {secondsOnPage}s</span>
              </div>
              <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-amber-600)' }}>
                {indiaAccumulatedKg.toLocaleString()} kg
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                approximate e-waste generated in India during your session (~45 kg/s)
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Section: Category Diversion Chart + Smart Hardware Insight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Left: Category Diversion Chart */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
              E-waste Diverted by Component Category (Grams)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(categoryStats).map(([cat, grams]) => {
                const percentage = Math.round((grams / maxCatWeight) * 100);

                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                        {cat}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                        {grams} g
                      </span>
                    </div>
                    {/* Horizontal Bar */}
                    <div style={{
                      width: '100%',
                      height: 10,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-bg)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.max(4, percentage)}%`,
                        height: '100%',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(90deg, var(--color-green-400), var(--color-teal-500))',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              <Info size={14} />
              <span>{assumptionNote}</span>
            </div>
          </div>

          {/* Right: Top Unlock / 1-Part Away Highlights */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Sparkles size={18} color="var(--color-green-500)" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>
                  High-Impact Part Unlocks
                </h3>
              </div>

              {unlocks.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  No missing components identified. Add parts to your inventory to calculate unlock opportunities!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {unlocks.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-bg)',
                        border: '1px solid var(--surface-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          +1× {item.component}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--color-green-600)' }}>
                          Unlocks {item.projectsUnlocked} project{item.projectsUnlocked !== 1 ? 's' : ''} to ≥90%
                        </span>
                      </div>
                      <Link
                        to="/suggestions"
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-green-600)',
                          textDecoration: 'none',
                        }}
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--surface-border)', display: 'flex', gap: 12 }}>
              <Link
                to="/inventory"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-tint)',
                  color: 'var(--color-green-600)',
                  border: '1px solid var(--surface-border)',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Log More Parts
              </Link>
              <Link
                to="/suggestions"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Explore Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
