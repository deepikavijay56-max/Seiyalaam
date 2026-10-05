import { describe, it, expect } from 'vitest';
import { validateIdea, getDemoIdeas, saveIdeaAsProject } from '../inventor';
import type { InventoryItem, RawIdea } from '../../../types';

describe('Kandupidi validateIdea Deterministic Engine', () => {
  it('rejects ideas using unknown components not in catalog', () => {
    const raw: RawIdea = {
      title: 'Quantum Teleporter',
      description: 'Uses unobtainium crystals',
      partsUsed: [{ name: 'Unobtainium Crystal V2', qty: 1 }],
      steps: ['Connect crystal'],
      supplyVoltage: 5,
    };

    const validated = validateIdea(raw, []);
    expect(validated.status).toBe('rejected');
    expect(validated.rejectionReason).toContain('Unknown component');
  });

  it('rejects ideas utilizing components with mains_voltage safety tags', () => {
    const raw: RawIdea = {
      title: 'AC Light Switcher',
      description: 'Switches high power AC socket',
      partsUsed: [
        { name: 'Arduino Uno', qty: 1 },
        { name: 'Relay Module', qty: 1 }, // Has safety_tag: mains_voltage
      ],
      steps: ['Connect to 230V socket'],
      supplyVoltage: 5,
    };

    const validated = validateIdea(raw, []);
    expect(validated.status).toBe('rejected');
    expect(validated.rejectionReason).toMatch(/mains/i);
  });

  it('rejects ideas using lithium batteries when user has faulty lithium cells', () => {
    const userInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        component_id: 'c-1',
        componentName: '18650 Li-ion Battery',
        quantity: 1,
        condition: 'faulty', // Damaged/swollen lithium cell!
        available_to_share: false,
      },
    ];

    const raw: RawIdea = {
      title: 'Pocket Flashlight',
      description: 'Handy light with battery',
      partsUsed: [
        { name: '18650 Li-ion Battery', qty: 1 },
        { name: 'Jumper Wires (set)', qty: 1 },
      ],
      steps: ['Connect battery to LED'],
      supplyVoltage: 3.7,
    };

    const validated = validateIdea(raw, userInventory);
    expect(validated.status).toBe('rejected');
    expect(validated.rejectionReason).toMatch(/faulty/i);
  });

  it('marks idea as verified when user owns all required parts in good condition', () => {
    const userInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        component_id: 'c-uno',
        componentName: 'Arduino Uno',
        quantity: 1,
        condition: 'tested',
        available_to_share: false,
      },
      {
        id: 'inv-2',
        component_id: 'c-buzzer',
        componentName: 'Buzzer',
        quantity: 2,
        condition: 'untested',
        available_to_share: false,
      },
    ];

    const raw: RawIdea = {
      title: 'Morse Code Beeper',
      description: 'Simple sounder',
      partsUsed: [
        { name: 'Arduino Uno', qty: 1 },
        { name: 'Buzzer', qty: 1 },
      ],
      steps: ['Connect buzzer to pin 8'],
      supplyVoltage: 5,
    };

    const validated = validateIdea(raw, userInventory);
    expect(validated.status).toBe('verified');
    expect(validated.missingCount).toBe(0);
    expect(validated.rejectionReason).toBeUndefined();
  });

  it('marks idea as needs_parts when user is missing required quantities', () => {
    const userInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        component_id: 'c-uno',
        componentName: 'Arduino Uno',
        quantity: 1,
        condition: 'tested',
        available_to_share: false,
      },
    ];

    const raw: RawIdea = {
      title: 'Distance Alarm',
      description: 'Alerts on proximity',
      partsUsed: [
        { name: 'Arduino Uno', qty: 1 },
        { name: 'Ultrasonic Sensor', qty: 1 },
        { name: 'Buzzer', qty: 2 },
      ],
      steps: ['Wire sensor and buzzers'],
      supplyVoltage: 5,
    };

    const validated = validateIdea(raw, userInventory);
    expect(validated.status).toBe('needs_parts');
    expect(validated.missingCount).toBe(3); // 1 ultrasonic + 2 buzzers
    const missingPartNames = validated.partsUsed.filter(p => p.missing > 0).map(p => p.name);
    expect(missingPartNames).toContain('Ultrasonic Sensor');
    expect(missingPartNames).toContain('Buzzer');
  });

  it('evaluates voltage mismatch and recommends converter', () => {
    const raw: RawIdea = {
      title: 'High Power DC Fan',
      description: 'Uses 12V motor with 5V Arduino',
      partsUsed: [
        { name: 'Arduino Uno', qty: 1 }, // 5V
        { name: 'DC Motor (large)', qty: 1 }, // 12V
      ],
      steps: ['Connect via motor shield'],
      supplyVoltage: 12,
    };

    const validated = validateIdea(raw, []);
    expect(validated.voltageCompatibility.compatible).toBe(false);
    expect(validated.voltageCompatibility.converterSuggested).toMatch(/Buck Converter|regulator/i);
  });

  it('provides cached demo ideas with valid structure for DEMO_MODE', () => {
    const demoIdeas = getDemoIdeas([]);
    expect(demoIdeas).toHaveLength(3);
    for (const idea of demoIdeas) {
      expect(idea.title).toBeTruthy();
      expect(idea.partsUsed.length).toBeGreaterThan(0);
      expect(idea.steps.length).toBeGreaterThan(0);
      expect(['verified', 'needs_parts', 'rejected']).toContain(idea.status);
    }
  });

  it('saves validated idea as project with is_ai_generated flag set to true', async () => {
    const raw: RawIdea = {
      title: 'Smart Plant Soil Hygrometer & Alarm',
      description: 'Reuses Arduino Uno and display',
      partsUsed: [{ name: 'Arduino Uno', qty: 1 }],
      steps: ['Wire sensor'],
      supplyVoltage: 5,
    };
    const validated = validateIdea(raw, []);
    const saved = await saveIdeaAsProject(validated, 'user-123');

    expect(saved.is_ai_generated).toBe(true);
    expect(saved.title).toBe(raw.title);
    expect(saved.created_by).toBe('user-123');
  });
});
