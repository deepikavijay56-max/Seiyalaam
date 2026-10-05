import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, ArrowRight, Zap, Lightbulb } from 'lucide-react';

interface ScrapItem {
  id: string;
  name: string;
  category: string;
}

interface ProjectPreview {
  title: string;
  matchScore: number;
  unlockedWith: string[];
  missingPart?: string;
  summary: string;
}

const COMMON_SCRAP: ScrapItem[] = [
  { id: 'pc_psu', name: 'ATX PC Power Supply', category: 'Computing' },
  { id: 'dvd_drive', name: 'Old DVD/CD Drive', category: 'Optical' },
  { id: 'phone_charger', name: '5V Phone Charger Brick', category: 'Power' },
  { id: 'dc_fan', name: '12V PC Cooling Fan', category: 'Cooling' },
  { id: 'potentiometer', name: 'Volume Knob / Potentiometer', category: 'Audio' },
  { id: 'relay_scrap', name: '12V Relay or Transistor', category: 'Semiconductor' },
];

export default function InteractiveScrapCalculator() {
  const [selectedScrap, setSelectedScrap] = useState<string[]>(['pc_psu', 'dc_fan']);

  const toggleItem = (id: string) => {
    if (selectedScrap.includes(id)) {
      if (selectedScrap.length > 1) {
        setSelectedScrap(selectedScrap.filter(s => s !== id));
      }
    } else {
      setSelectedScrap([...selectedScrap, id]);
    }
  };

  // Derive matches based on selections
  const hasPSU = selectedScrap.includes('pc_psu');
  const hasFan = selectedScrap.includes('dc_fan');
  const hasDVD = selectedScrap.includes('dvd_drive');
  const hasCharger = selectedScrap.includes('phone_charger');
  const hasPot = selectedScrap.includes('potentiometer');
  const hasRelay = selectedScrap.includes('relay_scrap');

  const matches: ProjectPreview[] = [];

  if (hasPSU) {
    matches.push({
      title: 'Lab Bench Variable Power Supply',
      matchScore: hasPot ? 100 : 85,
      unlockedWith: ['ATX PC Power Supply', ...(hasPot ? ['Potentiometer'] : [])],
      missingPart: hasPot ? undefined : '10kΩ Potentiometer (₹15)',
      summary: 'Delivers high-current +3.3V, +5V, +12V rails with short-circuit protection for prototyping.',
    });
  }

  if (hasDVD) {
    matches.push({
      title: 'Micro 2-Axis Stepper Laser Engraver',
      matchScore: 90,
      unlockedWith: ['Old DVD/CD Drive (Contains mini stepper & lead screw)'],
      missingPart: 'A4988 Stepper Driver (₹60)',
      summary: 'The precision lead screw from the laser pickup sled gives sub-millimeter positioning accuracy.',
    });
  }

  if (hasFan || hasCharger) {
    matches.push({
      title: 'Soldering Fume Extractor & Activated Carbon Filter',
      matchScore: hasFan && hasCharger ? 100 : 78,
      unlockedWith: [hasFan ? '12V PC Cooling Fan' : '', hasCharger ? '5V Phone Charger' : ''].filter(Boolean),
      missingPart: hasFan && hasCharger ? undefined : (!hasFan ? '12V DC Fan' : '5V/12V Power Adapter'),
      summary: 'Safely redirects hazardous lead and rosin fumes away from your soldering workspace.',
    });
  }

  if (hasRelay || (hasCharger && hasFan)) {
    matches.push({
      title: 'Smart Automated Plant Hydrator',
      matchScore: hasRelay ? 95 : 80,
      unlockedWith: ['Power source', 'Switching transistor/relay'],
      missingPart: hasRelay ? 'Scrap plastic bottle' : '5V Relay Module (₹45)',
      summary: 'Drips water automatically when the capacitive probe signals dry soil.',
    });
  }

  return (
    <div
      style={{
        padding: '24px 16px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        boxShadow: 'var(--shadow-lg)',
      }}
      className="glow-card"
    >
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-tint)',
            border: '1px solid var(--surface-border)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-green-600)',
            marginBottom: 12,
          }}
        >
          <Sparkles size={13} />
          INTERACTIVE HARDWARE PLAYGROUND
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 700,
            margin: '0 0 10px',
            color: 'var(--text-primary)',
          }}
        >
          What Scrap Electronics Do You Have Right Now?
        </h3>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>
          Tap common discarded items below. Watch Seiyalaam's engine calculate instant feasibility & unlocked maker projects.
        </p>
      </div>

      {/* Selectable Scrap Chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        {COMMON_SCRAP.map(item => {
          const isSelected = selectedScrap.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                border: isSelected ? '1px solid var(--color-green-500)' : '1px solid var(--surface-border)',
                background: isSelected ? 'var(--surface-tint)' : 'var(--surface-bg)',
                color: isSelected ? 'var(--color-green-700)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: isSelected ? 'var(--color-green-500)' : 'transparent',
                  border: isSelected ? 'none' : '1px solid var(--surface-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Live Derived Matches Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: 16,
        }}
      >
        {matches.slice(0, 3).map(m => (
          <div
            key={m.title}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-bg)',
              border: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: m.matchScore >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: m.matchScore >= 90 ? 'var(--color-green-700)' : 'var(--color-amber-600)',
                  }}
                >
                  {m.matchScore}% FEASIBILITY
                </span>
                <Zap size={15} color="var(--color-green-500)" />
              </div>

              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {m.title}
              </h4>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px' }}>
                {m.summary}
              </p>

              {m.missingPart ? (
                <div
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: 'var(--color-amber-700)',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Lightbulb size={13} />
                  <span><strong>1-Part Away:</strong> Just add {m.missingPart}</span>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: 'var(--color-green-700)',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={13} />
                  <span><strong>100% Ready to Build:</strong> You have all core parts!</span>
                </div>
              )}
            </div>

            <Link
              to="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-green-600)',
                textDecoration: 'none',
              }}
            >
              View Step-by-Step Blueprint <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
