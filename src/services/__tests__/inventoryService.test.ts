import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalInventory,
  saveLocalInventory,
  fetchUserInventory,
  upsertInventoryItem,
  deleteInventoryItem,
  DEFAULT_DEMO_ITEMS,
} from '../inventoryService';

describe('inventoryService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('retrieves empty array when localStorage is empty', () => {
    const items = getLocalInventory();
    expect(items).toEqual([]);
  });

  it('saves and retrieves items from local storage', () => {
    saveLocalInventory(DEFAULT_DEMO_ITEMS);
    const retrieved = getLocalInventory();
    expect(retrieved.length).toBe(DEFAULT_DEMO_ITEMS.length);
    expect(retrieved[0].componentName).toBe('Arduino Uno');
  });

  it('fetchUserInventory returns local storage when userId is undefined (guest mode)', async () => {
    saveLocalInventory(DEFAULT_DEMO_ITEMS);
    const result = await fetchUserInventory(undefined);
    expect(result.length).toBe(DEFAULT_DEMO_ITEMS.length);
  });

  it('upsertInventoryItem creates a local item with generated ID if none provided', async () => {
    const newItem = await upsertInventoryItem(null, {
      component_id: 'test-comp-1',
      componentName: 'Test Resistor',
      quantity: 5,
      condition: 'tested',
      available_to_share: true,
    });

    expect(newItem.id).toMatch(/^inv-/);
    expect(newItem.componentName).toBe('Test Resistor');
    expect(newItem.quantity).toBe(5);
  });

  it('deleteInventoryItem removes item from local storage by component_id', async () => {
    saveLocalInventory(DEFAULT_DEMO_ITEMS);
    expect(getLocalInventory().length).toBe(4);

    await deleteInventoryItem(null, 'arduino-uno');
    const remaining = getLocalInventory();
    expect(remaining.length).toBe(3);
    expect(remaining.some(i => i.component_id === 'arduino-uno')).toBe(false);
  });
});
