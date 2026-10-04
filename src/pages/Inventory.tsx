import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Check, X, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import componentsData from '../data/components.json';

type Condition = 'tested' | 'untested' | 'partial' | 'faulty';

interface Component { id: string; name: string; category: string; weight_g: number; }

interface InventoryItem {
  id: string;
  component_id: string;
  componentName: string;
  quantity: number;
  condition: Condition;
  available_to_share: boolean;
}

const CONDITIONS: { value: Condition; label: string; color: string }[] = [
  { value: 'tested',   label: 'Tested',   color: 'var(--color-green-500)' },
  { value: 'untested', label: 'Untested', color: 'var(--color-amber-500)' },
  { value: 'partial',  label: 'Partial',  color: 'var(--color-teal-500)' },
  { value: 'faulty',   label: 'Faulty',   color: 'var(--color-red-500)' },
];

const compsList: Component[] = componentsData as Component[];

export default function Inventory() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Add form state
  const [newComp, setNewComp] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newCond, setNewCond] = useState<Condition>('untested');
  const [newShare, setNewShare] = useState(false);
  const [autocomplete, setAutocomplete] = useState<Component[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, component_id, quantity, condition, available_to_share')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Join with local component names
      const compMap = new Map(compsList.map(c => [c.id, c.name]));
      const enriched = (data ?? []).map((item: any) => ({
        ...item,
        componentName: compMap.get(item.component_id) ?? 'Unknown',
      }));
      setItems(enriched);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Autocomplete
  useEffect(() => {
    if (!newComp.trim()) { setAutocomplete([]); return; }
    const q = newComp.toLowerCase();
    setAutocomplete(compsList.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8));
  }, [newComp]);

  async function addItem() {
    if (!user || !newComp.trim()) return;
    const comp = compsList.find(c => c.name.toLowerCase() === newComp.toLowerCase().trim());
    if (!comp) { setError('Please select a component from the list'); return; }

    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.from('inventory_items').upsert({
        user_id: user.id,
        component_id: comp.id,
        quantity: newQty,
        condition: newCond,
        available_to_share: newShare,
      }, { onConflict: 'user_id,component_id' });

      if (error) throw error;
      setNewComp(''); setNewQty(1); setNewCond('untested'); setNewShare(false);
      setShowAddForm(false);
      await fetchInventory();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Remove this component from your inventory?')) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id).eq('user_id', user!.id);
    if (error) { setError(error.message); return; }
    setItems(items.filter(i => i.id !== id));
  }

  async function toggleShare(item: InventoryItem) {
    const { error } = await supabase.from('inventory_items')
      .update({ available_to_share: !item.available_to_share })
      .eq('id', item.id).eq('user_id', user!.id);
    if (error) { setError(error.message); return; }
    setItems(items.map(i => i.id === item.id ? { ...i, available_to_share: !i.available_to_share } : i));
  }

  const condColor = (c: Condition) => CONDITIONS.find(x => x.value === c)?.color ?? 'var(--text-muted)';

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '32px 0 80px' }}>
      <div className="page-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
              {t('inventory.title')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
              {items.length} component{items.length !== 1 ? 's' : ''} logged
            </p>
          </div>
          <button
            id="add-component-btn"
            onClick={() => setShowAddForm(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-green-500)', color: 'white',
              border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <Plus size={16} />
            {t('inventory.add')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: 'var(--color-red-500)', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Add form */}
        {showAddForm && (
          <div style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            marginBottom: 24,
            boxShadow: 'var(--shadow-md)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, margin: '0 0 20px', color: 'var(--text-primary)' }}>
              Add a component
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {/* Component autocomplete */}
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Component name *
                </label>
                <input
                  id="comp-name-input"
                  type="text"
                  value={newComp}
                  onChange={e => setNewComp(e.target.value)}
                  placeholder="Search components…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  autoComplete="off"
                  aria-label="Search and select a component"
                />
                {autocomplete.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden' }}>
                    {autocomplete.map(c => (
                      <button key={c.id} onClick={() => { setNewComp(c.name); setAutocomplete([]); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-tint)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{c.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Quantity</label>
                <input type="number" min={1} max={99} value={newQty} onChange={e => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Condition */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Condition</label>
                <select value={newCond} onChange={e => setNewCond(e.target.value as Condition)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Share toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              <button onClick={() => setNewShare(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: newShare ? 'var(--color-green-500)' : 'var(--text-muted)' }}>
                {newShare ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Available to share with community</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={addItem} disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-green-500)', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, minHeight: 44 }}>
                {saving ? 'Saving…' : 'Add to inventory'}
              </button>
              <button onClick={() => { setShowAddForm(false); setError(null); }}
                style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', background: 'none', border: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 14, cursor: 'pointer', minHeight: 44 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Inventory list */}
        {loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {t('inventory.empty')}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              Click "Add component" to log your first electronics part.
            </p>
            <button onClick={() => setShowAddForm(true)}
              style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', background: 'var(--color-green-500)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Add component
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--surface-card)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-lg)',
                gap: 12,
                flexWrap: 'wrap',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{item.componentName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>×{item.quantity}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      background: `color-mix(in srgb, ${condColor(item.condition)} 12%, transparent)`,
                      color: condColor(item.condition),
                    }}>
                      {CONDITIONS.find(c => c.value === item.condition)?.label}
                    </span>
                    {item.available_to_share && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'color-mix(in srgb, var(--color-teal-500) 12%, transparent)', color: 'var(--color-teal-500)' }}>
                        Sharing
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => toggleShare(item)} title={item.available_to_share ? 'Stop sharing' : 'Share with community'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: item.available_to_share ? 'var(--color-teal-500)' : 'var(--text-muted)', borderRadius: 8 }}>
                    {item.available_to_share ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => deleteItem(item.id)} title="Remove from inventory"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)', borderRadius: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red-500)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    aria-label={`Remove ${item.componentName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
