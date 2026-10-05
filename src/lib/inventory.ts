import type { InventoryItem } from '../types';
import type { Condition, InventoryEntry } from './engine/matcher';

export type { Condition, InventoryEntry, InventoryItem };

export {
  DEFAULT_DEMO_ITEMS,
  getLocalInventory,
  saveLocalInventory,
  fetchUserInventory,
  upsertInventoryItem,
  deleteInventoryItem,
} from '../services/inventoryService';

export { useInventory } from '../hooks/useInventory';

export function toInventoryEntries(items: InventoryItem[]): InventoryEntry[] {
  return items.map(item => ({
    componentName: item.componentName,
    quantity: item.quantity,
    condition: item.condition,
  }));
}
