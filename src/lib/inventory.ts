import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Condition, InventoryEntry, Component } from './engine/matcher';
import componentsData from '../data/components.json';

export type { Condition, InventoryEntry };

export interface InventoryItem {
  id: string;
  component_id: string;
  componentName: string;
  quantity: number;
  condition: Condition;
  available_to_share: boolean;
}

const STORAGE_KEY = 'seiyalaam_inventory';
const compsList: Component[] = componentsData as Component[];

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
    // ignore local storage errors
  }
}

export function toInventoryEntries(items: InventoryItem[]): InventoryEntry[] {
  return items.map(item => ({
    componentName: item.componentName,
    quantity: item.quantity,
    condition: item.condition,
  }));
}

export function useInventory(userId?: string | null) {
  const [items, setItems] = useState<InventoryItem[]>(() => getLocalInventory());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If no user, load from local storage
    if (!userId) {
      const local = getLocalInventory();
      setItems(local);
      setLoading(false);
      return;
    }

    try {
      const { data, error: supaError } = await supabase
        .from('inventory_items')
        .select('id, component_id, quantity, condition, available_to_share')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supaError) {
        // Fallback to local storage if supabase query fails
        const local = getLocalInventory();
        setItems(local);
        return;
      }

      const compMap = new Map(compsList.map(c => [c.id, c.name]));
      const enriched: InventoryItem[] = (data ?? []).map((item: any) => ({
        id: item.id,
        component_id: item.component_id,
        componentName: compMap.get(item.component_id) ?? item.component_id ?? 'Unknown',
        quantity: item.quantity,
        condition: item.condition as Condition,
        available_to_share: Boolean(item.available_to_share),
      }));

      setItems(enriched);
      saveLocalInventory(enriched);
    } catch {
      // Local fallback on network errors
      setItems(getLocalInventory());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, setItems, loading, error, setError, reload: fetchItems };
}
