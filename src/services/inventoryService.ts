import { supabase } from '../lib/supabase';
import type { InventoryItem, DbInventoryRow } from '../types';
import componentsData from '../data/components.json';

const STORAGE_KEY = 'seiyalaam_inventory';

interface RawComponentJson {
  id: string;
  name: string;
  category: string;
  weight_g: number;
}

const compsList: RawComponentJson[] = componentsData as RawComponentJson[];
const compMap = new Map(compsList.map(c => [c.id, c.name]));

export const DEFAULT_DEMO_ITEMS: InventoryItem[] = [
  {
    id: 'demo-1',
    component_id: 'arduino-uno',
    componentName: 'Arduino Uno',
    quantity: 1,
    condition: 'tested',
    available_to_share: false,
  },
  {
    id: 'demo-2',
    component_id: 'ultrasonic',
    componentName: 'Ultrasonic Sensor',
    quantity: 1,
    condition: 'tested',
    available_to_share: true,
  },
  {
    id: 'demo-3',
    component_id: 'jumper-wires',
    componentName: 'Jumper Wires (set)',
    quantity: 1,
    condition: 'tested',
    available_to_share: false,
  },
  {
    id: 'demo-4',
    component_id: 'dc-motor-small',
    componentName: 'DC Motor (small)',
    quantity: 2,
    condition: 'untested',
    available_to_share: true,
  },
];

export function getLocalInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Gracefully ignore storage quota errors
  }
}

/**
 * Fetch inventory items for a user from Supabase with graceful fallback to local storage
 */
export async function fetchUserInventory(userId?: string | null): Promise<InventoryItem[]> {
  if (!userId) {
    return getLocalInventory();
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, user_id, component_id, quantity, condition, available_to_share, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return getLocalInventory();
    }

    const rows = data as unknown as DbInventoryRow[];
    const enriched: InventoryItem[] = rows.map(row => ({
      id: row.id,
      component_id: row.component_id,
      componentName: compMap.get(row.component_id) ?? row.component_id ?? 'Unknown Component',
      quantity: row.quantity,
      condition: row.condition,
      available_to_share: Boolean(row.available_to_share),
    }));

    saveLocalInventory(enriched);
    return enriched;
  } catch {
    return getLocalInventory();
  }
}

/**
 * Upsert an inventory item to Supabase and sync local cache
 */
export async function upsertInventoryItem(
  userId: string | null | undefined,
  item: Omit<InventoryItem, 'id'> & { id?: string }
): Promise<InventoryItem> {
  const localItem: InventoryItem = {
    id: item.id || `inv-${Date.now()}`,
    component_id: item.component_id,
    componentName: item.componentName,
    quantity: item.quantity,
    condition: item.condition,
    available_to_share: item.available_to_share,
  };

  if (userId) {
    try {
      await supabase.from('inventory_items').upsert(
        {
          user_id: userId,
          component_id: item.component_id,
          quantity: item.quantity,
          condition: item.condition,
          available_to_share: item.available_to_share,
        },
        { onConflict: 'user_id,component_id' }
      );
    } catch {
      // Keep going with local cache if offline
    }
  }

  return localItem;
}

/**
 * Delete an inventory item from Supabase and local cache
 */
export async function deleteInventoryItem(
  userId: string | null | undefined,
  componentId: string,
  itemId?: string
): Promise<void> {
  if (userId) {
    try {
      await supabase
        .from('inventory_items')
        .delete()
        .eq('user_id', userId)
        .eq('component_id', componentId);
    } catch {
      // offline fallback
    }
  }

  const current = getLocalInventory();
  const filtered = current.filter(i => (itemId ? i.id !== itemId : i.component_id !== componentId));
  saveLocalInventory(filtered);
}
