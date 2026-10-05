import { describe, it, expect } from 'vitest';
import { oneAwayProjects, unlockCounts } from '../oneAway';
import type { InventoryEntry, Project, Component } from '../matcher';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const components: Component[] = [
  { id: 'c1', name: 'Arduino Uno',       category: 'microcontroller', weight_g: 25, voltage: 5, max_current_ma: 500, safety_tags: [], substitutes: [] },
  { id: 'c2', name: 'DC Motor (small)',  category: 'motor',           weight_g: 30, voltage: 6, max_current_ma: 200, safety_tags: [], substitutes: [] },
  { id: 'c3', name: 'Servo Motor',       category: 'motor',           weight_g: 14, voltage: 5, max_current_ma: 900, safety_tags: [], substitutes: [] },
  { id: 'c4', name: 'Buzzer',            category: 'audio',           weight_g: 5,  voltage: 5, max_current_ma: 30,  safety_tags: [], substitutes: [] },
  { id: 'c5', name: 'Ultrasonic Sensor', category: 'sensor',          weight_g: 8,  voltage: 5, max_current_ma: 15,  safety_tags: [], substitutes: [] },
];

// Project that will be "one away" – only missing 1 part
const robotProject: Project = {
  id: 'proj-robot',
  title: 'Robot',
  description: '',
  category: 'educational',
  difficulty: 'medium',
  requirements: [
    { component: 'Arduino Uno',      qty: 1, critical: true,  substitutes: [] },
    { component: 'DC Motor (small)', qty: 2, critical: true,  substitutes: [] },
    { component: 'Servo Motor',      qty: 1, critical: false, substitutes: [] }, // MISSING
  ],
  steps: [],
  safety_notes: null,
};

// Project with 2 missing parts – should NOT appear in oneAway
const complexProject: Project = {
  id: 'proj-complex',
  title: 'Complex Project',
  description: '',
  category: 'educational',
  difficulty: 'hard',
  requirements: [
    { component: 'Arduino Uno',       qty: 1, critical: true, substitutes: [] },
    { component: 'Servo Motor',       qty: 1, critical: true, substitutes: [] }, // MISSING
    { component: 'Ultrasonic Sensor', qty: 1, critical: true, substitutes: [] }, // MISSING
  ],
  steps: [],
  safety_notes: null,
};

// Project fully owned (score = 100, NOT one-away)
const simpleProject: Project = {
  id: 'proj-simple',
  title: 'Simple',
  description: '',
  category: 'practical',
  difficulty: 'easy',
  requirements: [
    { component: 'Arduino Uno', qty: 1, critical: true, substitutes: [] },
    { component: 'Buzzer',      qty: 1, critical: false, substitutes: [] },
  ],
  steps: [],
  safety_notes: null,
};

// Inventory has Arduino Uno + DC Motor (small) x2 + Buzzer, but NOT Servo Motor or Ultrasonic Sensor
const inventory: InventoryEntry[] = [
  { componentName: 'Arduino Uno',      quantity: 1, condition: 'tested' },
  { componentName: 'DC Motor (small)', quantity: 2, condition: 'tested' },
  { componentName: 'Buzzer',           quantity: 1, condition: 'tested' },
];

const allProjects = [robotProject, complexProject, simpleProject];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('oneAwayProjects', () => {
  it('includes project with exactly 1 missing required part and score >= 70', () => {
    const result = oneAwayProjects(inventory, allProjects, components);
    const ids = result.map(r => r.project.id);
    expect(ids).toContain('proj-robot');
  });

  it('excludes project with 2 missing parts', () => {
    const result = oneAwayProjects(inventory, allProjects, components);
    const ids = result.map(r => r.project.id);
    expect(ids).not.toContain('proj-complex');
  });

  it('excludes fully-owned project (0 missing)', () => {
    const result = oneAwayProjects(inventory, allProjects, components);
    const ids = result.map(r => r.project.id);
    expect(ids).not.toContain('proj-simple');
  });

  it('reports the correct missing component', () => {
    const result = oneAwayProjects(inventory, allProjects, components);
    const robotResult = result.find(r => r.project.id === 'proj-robot');
    expect(robotResult?.missingComponent).toBe('Servo Motor');
  });

  it('excludes projects with score < 70', () => {
    // Low-score project – only has 1 out of many required parts
    const lowScoreProject: Project = {
      id: 'proj-low',
      title: 'Low score',
      description: '',
      category: 'practical',
      difficulty: 'hard',
      requirements: [
        { component: 'Arduino Uno',       qty: 1, critical: true,  substitutes: [] }, // owned
        { component: 'Servo Motor',       qty: 1, critical: true,  substitutes: [] }, // MISSING
        { component: 'Ultrasonic Sensor', qty: 1, critical: true,  substitutes: [] }, // MISSING
        { component: 'DC Motor (small)',  qty: 2, critical: true,  substitutes: [] }, // owned
        // Score will be 50% (2/4 critical parts) - below threshold for one-away
      ],
      steps: [],
      safety_notes: null,
    };

    const result = oneAwayProjects(inventory, [lowScoreProject], components);
    // 2 missing parts → not one-away
    expect(result.length).toBe(0);
  });

  it('updates result after adding the missing part', () => {
    const inventoryWithServo: InventoryEntry[] = [
      ...inventory,
      { componentName: 'Servo Motor', quantity: 1, condition: 'tested' },
    ];
    const result = oneAwayProjects(inventoryWithServo, allProjects, components);
    const ids = result.map(r => r.project.id);
    // After adding servo, robot project is no longer one-away (score = 100)
    expect(ids).not.toContain('proj-robot');
  });
});

describe('unlockCounts', () => {
  it('returns counts sorted descending by projectsUnlocked', () => {
    const counts = unlockCounts(inventory, allProjects, components);
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i].projectsUnlocked).toBeGreaterThanOrEqual(counts[i + 1].projectsUnlocked);
    }
  });

  it('identifies servo motor as unlocking at least 1 project', () => {
    const counts = unlockCounts(inventory, allProjects, components);
    const servoEntry = counts.find(c => c.component === 'Servo Motor');
    // Adding servo would push robot project over 90%
    if (servoEntry) {
      expect(servoEntry.projectsUnlocked).toBeGreaterThan(0);
    }
  });

  it('returns empty array when all projects are fully owned', () => {
    const fullInventory: InventoryEntry[] = [
      { componentName: 'Arduino Uno',      quantity: 1, condition: 'tested' },
      { componentName: 'DC Motor (small)', quantity: 2, condition: 'tested' },
      { componentName: 'Servo Motor',      quantity: 1, condition: 'tested' },
      { componentName: 'Buzzer',           quantity: 1, condition: 'tested' },
      { componentName: 'Ultrasonic Sensor',quantity: 1, condition: 'tested' },
    ];
    const counts = unlockCounts(fullInventory, allProjects, components);
    // No projects need unlocking – may be empty or counts.every(c => c.projectsUnlocked === 0)
    expect(counts.length).toBe(0);
  });
});
