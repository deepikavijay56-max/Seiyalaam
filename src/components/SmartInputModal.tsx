import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  parseComponentsFromText,
  type ParsedComponent,
  type UnconfirmedComponent,
} from '../lib/engine/textParser';
import type { Condition } from '../lib/engine/matcher';
import componentsData from '../data/components.json';
import { analyzePhotoWithGemini, isGeminiConfigured } from '../lib/gemini';

interface SmartInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComponents: (items: { componentName: string; quantity: number; condition: Condition }[]) => void;
}

const compsList = componentsData as { id: string; name: string; category: string }[];

export default function SmartInputModal({ isOpen, onClose, onAddComponents }: SmartInputModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'voice' | 'photo'>('voice');
  const [textInput, setTextInput] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  // Parsing result states
  const [matchedItems, setMatchedItems] = useState<ParsedComponent[]>([]);
  const [confirmItems, setConfirmItems] = useState<UnconfirmedComponent[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTextInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [speechLanguage]);

  if (!isOpen) return null;

  function toggleSpeechRecording() {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. Please use the text input instead.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang = speechLanguage;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  }

  function handleParse(textToParse: string) {
    if (!textToParse.trim()) return;
    const result = parseComponentsFromText(textToParse);
    setMatchedItems(result.matched);
    setConfirmItems(result.confirmManually);
    setHasParsed(true);
  }

  // Photo upload handler
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoProcessing(true);

      try {
        const result = await analyzePhotoWithGemini(dataUrl);
        setPhotoProcessing(false);

        if (result.components && result.components.length > 0) {
          const matched: ParsedComponent[] = [];
          const unconfirmed: UnconfirmedComponent[] = [];

          result.components.forEach(item => {
            if (item.isConfirmed) {
              matched.push({
                componentName: item.componentName,
                quantity: item.quantity,
                condition: item.condition,
                confidence: item.confidence,
              });
            } else {
              unconfirmed.push({
                rawName: item.componentName,
                suggestedQuantity: item.quantity,
                condition: item.condition,
              });
            }
          });

          setMatchedItems(matched);
          setConfirmItems(unconfirmed);
          setHasParsed(true);
          if (result.rawText) {
            setTextInput(result.rawText);
          }
        } else if (result.rawText) {
          setTextInput(result.rawText);
          handleParse(result.rawText);
        }
      } catch (err) {
        console.error('Photo analysis error:', err);
        setPhotoProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSaveAll() {
    const itemsToAdd = [
      ...matchedItems.map(m => ({
        componentName: m.componentName,
        quantity: m.quantity,
        condition: m.condition,
      })),
    ];

    onAddComponents(itemsToAdd);
    onClose();
  }

  function mapUnconfirmedToComponent(index: number, componentName: string) {
    const item = confirmItems[index];
    if (!item) return;

    setMatchedItems(prev => [
      ...prev,
      {
        componentName,
        quantity: item.suggestedQuantity,
        condition: item.condition,
        confidence: 1.0,
      },
    ]);

    setConfirmItems(prev => prev.filter((_, idx) => idx !== index));
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 250,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--surface-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: 18, fontWeight: 700 }}>
                Smart Component Input
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Speech recognition, AI photo scan, or free-text parser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          padding: '0 24px',
          borderBottom: '1px solid var(--surface-border)',
          background: 'var(--surface-bg)',
          gap: 12,
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'voice' ? '2px solid var(--color-green-500)' : '2px solid transparent',
              color: activeTab === 'voice' ? 'var(--color-green-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Mic size={16} />
            Voice (English & தமிழ்)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'photo' ? '2px solid var(--color-green-500)' : '2px solid transparent',
              color: activeTab === 'photo' ? 'var(--color-green-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Camera size={16} />
            Photo Scan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'text' ? '2px solid var(--color-green-500)' : '2px solid transparent',
              color: activeTab === 'text' ? 'var(--color-green-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <FileText size={16} />
            Free-Text Notes
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24 }}>
          {/* Tab 1: Voice Input */}
          {activeTab === 'voice' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setSpeechLanguage('en-IN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: speechLanguage === 'en-IN' ? 'var(--color-green-500)' : 'var(--surface-border)',
                    background: speechLanguage === 'en-IN' ? 'var(--surface-tint)' : 'var(--surface-card)',
                    color: speechLanguage === 'en-IN' ? 'var(--color-green-600)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  English (India)
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechLanguage('ta-IN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid',
                    borderColor: speechLanguage === 'ta-IN' ? 'var(--color-green-500)' : 'var(--surface-border)',
                    background: speechLanguage === 'ta-IN' ? 'var(--surface-tint)' : 'var(--surface-card)',
                    color: speechLanguage === 'ta-IN' ? 'var(--color-green-600)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  தமிழ் (Tamil)
                </button>
              </div>

              {/* Big Mic Button */}
              <button
                type="button"
                onClick={toggleSpeechRecording}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: isRecording ? 'var(--color-red-500)' : 'var(--color-green-500)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: isRecording ? '0 0 0 8px rgba(214, 69, 69, 0.2)' : 'var(--shadow-md)',
                  transition: 'all 0.2s',
                }}
                title={isRecording ? 'Stop recording' : 'Start speaking'}
              >
                {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                {isRecording ? 'Listening... Speak your parts list' : 'Click microphone to speak your parts in English or Tamil'}
              </p>

              <div style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'var(--surface-bg)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
              }}>
                Example: "Two Arduino Uno and three servo motors and an ultrasonic sensor"
              </div>
            </div>
          )}

          {/* Tab 2: Photo Input */}
          {activeTab === 'photo' && (
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: isGeminiConfigured() ? 'rgba(27, 127, 75, 0.12)' : 'rgba(245, 165, 36, 0.12)',
                color: isGeminiConfigured() ? 'var(--color-green-600)' : 'var(--color-amber-600)',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 12,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isGeminiConfigured() ? 'var(--color-green-500)' : 'var(--color-amber-500)',
                }} />
                {isGeminiConfigured() ? 'Gemini Vision AI Connected' : 'Offline Simulation Mode (Set VITE_GEMINI_API_KEY in .env.local)'}
              </div>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--surface-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px 20px',
                cursor: 'pointer',
                background: 'var(--surface-bg)',
              }}>
                <Upload size={36} color="var(--color-green-500)" style={{ marginBottom: 12 }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  Upload circuit photo or teardown screenshot
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  PNG, JPG up to 5MB • Vision AI analyzes ICs, motors, displays & sensors
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {photoPreview && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <img
                    src={photoPreview}
                    alt="Uploaded preview"
                    style={{ maxWidth: 200, maxHeight: 120, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                  />
                  {photoProcessing && (
                    <p style={{ fontSize: 13, color: 'var(--color-green-600)', marginTop: 8, fontWeight: 600 }}>
                      Scanning photo for electronic components...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Text Input */}
          <div style={{ marginTop: activeTab !== 'text' ? 16 : 0 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Recognized Speech / Notes
            </label>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Paste or type components list (e.g., '1 Arduino Uno, 2 DC motors, 1 buzzer, 1 OLED display')..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => handleParse(textInput)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-green-500)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Sparkles size={14} />
                Parse Components
              </button>
            </div>
          </div>

          {/* Parsed Results Section */}
          {hasParsed && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--surface-border)' }}>
              {/* Validated Components */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} color="var(--color-green-600)" />
                  Validated Components ({matchedItems.length})
                </h4>

                {matchedItems.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    No exact reference components matched. See manual confirmations below.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matchedItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-tint)',
                          border: '1px solid rgba(27, 127, 75, 0.2)',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                          {item.componentName}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Qty: <strong>{item.quantity}</strong>
                          </span>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            color: 'var(--color-green-600)',
                          }}>
                            {item.condition}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMatchedItems(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Manually List */}
              {confirmItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-amber-600)' }}>
                    <AlertCircle size={16} />
                    Confirm Manually ({confirmItems.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {confirmItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                            Unrecognized: "{item.rawName}" (Qty: {item.suggestedQuantity})
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmItems(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309' }}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Map to:</span>
                          <select
                            defaultValue={item.suggestedMatch || ''}
                            onChange={e => {
                              if (e.target.value) {
                                mapUnconfirmedToComponent(idx, e.target.value);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--surface-border)',
                              background: 'white',
                              fontSize: 13,
                              outline: 'none',
                            }}
                          >
                            <option value="">-- Choose matching component --</option>
                            {compsList.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name} ({c.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--surface-border)',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={matchedItems.length === 0}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-green-500)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: matchedItems.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: matchedItems.length === 0 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Plus size={16} />
                  Add {matchedItems.length} Component{matchedItems.length !== 1 ? 's' : ''} to Inventory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
