import { useState } from 'react';
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  classifyDevice,
  CLASS_LABELS,
  CLASS_DESCRIPTIONS,
  type DeviceClass,
  type ChecklistAnswers,
} from '../lib/engine/classifier';
import {
  devicesData,
  saveAssessedDevice,
  useAssessedDevices,
  type DeviceDefinition,
} from '../lib/devices';

const allDevices = devicesData as DeviceDefinition[];

const CLASS_COLORS: Record<DeviceClass, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(27, 127, 75, 0.1)', text: 'var(--class-a)', border: 'var(--class-a)' },
  B: { bg: 'rgba(14, 154, 167, 0.1)', text: 'var(--class-b)', border: 'var(--class-b)' },
  C: { bg: 'rgba(245, 165, 36, 0.12)', text: 'var(--class-c)', border: 'var(--class-c)' },
  D: { bg: 'rgba(100, 116, 139, 0.12)', text: 'var(--class-d)', border: 'var(--class-d)' },
  E: { bg: 'rgba(214, 69, 69, 0.12)', text: 'var(--class-e)', border: 'var(--class-e)' },
};

export default function Teardown() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(allDevices[0].id);
  const [answers, setAnswers] = useState<Partial<ChecklistAnswers>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { devices: userAssessed, refresh } = useAssessedDevices();

  const currentDevice = allDevices.find(d => d.id === selectedDeviceId) ?? allDevices[0];

  // Deterministically compute device class
  const assignedClass = classifyDevice(answers);
  const classMeta = CLASS_COLORS[assignedClass];

  function handleAnswer(questionId: keyof ChecklistAnswers, value: boolean) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    setSaveSuccess(false);
  }

  function handleReset() {
    setAnswers({});
    setSaveSuccess(false);
  }

  function handleSave() {
    saveAssessedDevice({
      id: `dev-eval-${Date.now()}`,
      deviceId: currentDevice.id,
      deviceName: currentDevice.name,
      deviceClass: assignedClass,
      answers,
      assessedAt: new Date().toISOString(),
    });
    setSaveSuccess(true);
    refresh();
  }

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '32px 0 80px' }}>
      <div className="page-container" style={{ maxWidth: 880 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-tint)',
              color: 'var(--color-green-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Wrench size={20} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0 }}>
              Device Assessment Checklist
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
            Diagnose electronics safety and determine classification (Classes A to E) before salvage.
          </p>
        </div>

        {/* Device Picker Card */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 24,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Select Device to Assess:
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              value={selectedDeviceId}
              onChange={e => {
                setSelectedDeviceId(e.target.value);
                setAnswers({});
                setSaveSuccess(false);
              }}
              style={{
                flex: 1,
                minWidth: 260,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {allDevices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.difficulty.toUpperCase()} • {d.parts.length} salvageable parts)
                </option>
              ))}
            </select>
          </div>

          {/* Device Warnings */}
          {currentDevice.warnings.length > 0 && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: '#92400e',
            }}>
              <ShieldAlert size={18} />
              <div>
                <strong>Device Warning:</strong> {currentDevice.warnings.join(' • ')}
              </div>
            </div>
          )}
        </div>

        {/* Assessment Grid: Questions + Live Result Badge */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* Left Column: Questions Checklist */}
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
              Condition Checklist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentDevice.checklist.map((item) => {
                const questionKey = item.id as keyof ChecklistAnswers;
                const currentVal = answers[questionKey];

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-md)',
                      background: item.safety ? '#fffbeb' : 'var(--surface-bg)',
                      border: '1px solid',
                      borderColor: item.safety ? '#fde68a' : 'var(--surface-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.question}
                      </span>
                      {item.safety && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#fee2e2',
                          color: 'var(--color-red-500)',
                          flexShrink: 0,
                        }}>
                          Safety Critical
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleAnswer(questionKey, true)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid',
                          borderColor: currentVal === true ? 'var(--color-green-500)' : 'var(--surface-border)',
                          background: currentVal === true ? 'var(--color-green-500)' : 'var(--surface-card)',
                          color: currentVal === true ? 'white' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Yes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswer(questionKey, false)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid',
                          borderColor: currentVal === false ? 'var(--color-slate-500)' : 'var(--surface-border)',
                          background: currentVal === false ? 'var(--color-slate-700)' : 'var(--surface-card)',
                          color: currentVal === false ? 'white' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                Reset answers
              </button>
            </div>
          </div>

          {/* Right Column: Live Assessment Result Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--surface-card)',
              border: `2px solid ${classMeta.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Diagnostic Classification
              </span>

              {/* Big Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '14px 0 16px' }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  background: classMeta.bg,
                  color: classMeta.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 800,
                  border: `2px solid ${classMeta.border}`,
                }}>
                  {assignedClass}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: classMeta.text }}>
                    Class {assignedClass}: {CLASS_LABELS[assignedClass]}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Based on your checklist answers
                  </span>
                </div>
              </div>

              {/* Plain Language Explanation */}
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                {CLASS_DESCRIPTIONS[assignedClass]}
              </p>

              {/* Safety notice for Class E */}
              {assignedClass === 'E' && (
                <div style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-red-500)',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                }}>
                  <AlertTriangle size={18} />
                  <span>Hazard detected: Safety flags prevent teardown and community sharing.</span>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleSave}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Save size={16} />
                Save Device Assessment to Dashboard
              </button>

              {saveSuccess && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-green-600)', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={16} />
                  <span>Assessment saved! Updated on Impact Dashboard.</span>
                </div>
              )}
            </div>

            {/* Expected Salvageable Parts inside */}
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}>
              <h4 style={{ fontFamily: 'var(--font-display)', margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>
                Parts Inside {currentDevice.name} ({currentDevice.parts.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentDevice.parts.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--surface-border)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>×{p.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Previously Assessed Devices Section */}
        {userAssessed.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
              Your Assessed Devices ({userAssessed.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {userAssessed.map(dev => (
                <div
                  key={dev.id}
                  style={{
                    padding: 16,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h5 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{dev.deviceName}</h5>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(dev.assessedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700,
                    background: CLASS_COLORS[dev.deviceClass].bg,
                    color: CLASS_COLORS[dev.deviceClass].text,
                    border: `1px solid ${CLASS_COLORS[dev.deviceClass].border}`,
                  }}>
                    Class {dev.deviceClass}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
