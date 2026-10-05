import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem } from '../types';
import {
  getLocalInventory,
  fetchUserInventory,
  upsertInventoryItem,
  deleteInventoryItem,
} from '../services/inventoryService';

export function useInventory(userId?: string | null) {
  const [items, setItems] = useState<InventoryItem[]>(() => getLocalInventory());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserInventory(userId);
      setItems(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    fetchUserInventory(userId)
      .then(data => {
        if (active) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading inventory');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const saveItem = useCallback(
    async (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
      const saved = await upsertInventoryItem(userId, item);
      setItems(prev => {
        const existingIdx = prev.findIndex(i => i.component_id === saved.component_id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = saved;
          return updated;
        }
        return [saved, ...prev];
      });
      return saved;
    },
    [userId]
  );

  const removeItem = useCallback(
    async (componentId: string, itemId?: string) => {
      await deleteInventoryItem(userId, componentId, itemId);
      setItems(prev => prev.filter(i => (itemId ? i.id !== itemId : i.component_id !== componentId)));
    },
    [userId]
  );

  return { items, setItems, loading, error, setError, reload, saveItem, removeItem };
}
