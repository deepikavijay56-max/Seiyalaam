import { describe, it, expect } from 'vitest';
import {
  scoreProject,
  matchProjects,
  buildInventoryMap,
  CONDITION_FACTOR,
  type InventoryEntry,
  type Project,
  type Component,
} from '../matcher';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const components: Component[] = [
  { id: 'c1', name: 'Arduino Uno', category: 'microcontroller', weight_g: 25, voltage: 5, max_current_ma: 500, safety_tags: [], substitutes: ['Arduino Nano'] },
  { id: 'c2', name: 'Arduino Nano', category: 'microcontroller', weight_g: 7, voltage: 5, max_current_ma: 200, safety_tags: [], substitutes: ['Arduino Uno'] },
  { id: 'c3', name: 'DC Motor (small)', category: 'motor', weight_g: 30, voltage: 6, max_current_ma: 200, safety_tags: [], substitutes: ['Gear Motor'] },
  { id: 'c4', name: 'Gear Motor', category: 'motor', weight_g: 45, voltage: 6, max_current_ma: 300, safety_tags: [], substitutes: ['DC Motor (small)'] },
  { id: 'c5', name: 'Ultrasonic Sensor', category: 'sensor', weight_g: 8, voltage: 5, max_current_ma: 15, safety_tags: [], substitutes: ['IR Sensor'] },
  { id: 'c6', name: 'L298N Motor Driver', category: 'driver', weight_g: 20, voltage: 5, max_current_ma: 2000, safety_tags: [], substitutes: ['L293D Motor Driver'] },
  { id: 'c7', name: 'Jumper Wires (set)', category: 'wiring', weight_g: 15, voltage: null, max_current_ma: null, safety_tags: [], substitutes: [] },
];

// Project with all critical parts
const robotProject: Project = {
  id: 'p1',
  title: 'Obstacle Avoiding Robot',
  description: 'Test robot project',
  category: 'educational',
  difficulty: 'medium',
  requirements: [
    { component: 'Arduino Uno', qty: 1, critical: true, substitutes: ['Arduino Nano'] },
    { component: 'DC Motor (small)', qty: 2, critical: true, substitutes: ['Gear Motor'] },
    { component: 'L298N Motor Driver', qty: 1, critical: true, substitutes: ['L293D Motor Driver'] },
    { component: 'Ultrasonic Sensor', qty: 1, critical: true, substitutes: [] },
    { component: 'Jumper Wires (set)', qty: 1, critical: false, substitutes: [] },
  ],
  steps: [],
  safety_notes: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildInventoryMap', () => {
  it('normalises component names to lowercase', () => {
    const inv: InventoryEntry[] = [
      { componentName: 'Arduino UNO', quantity: 1, condition: 'tested' },
    ];
    const map = buildInventoryMap(inv);
    expect(map.has('arduino uno')).toBe(true);
  });

  it('computes effective qty based on condition factor', () => {
    const inv: InventoryEntry[] = [
      { componentName: 'DC Motor (small)', quantity: 2, condition: 'untested' },
    ];
    const map = buildInventoryMap(inv);
    const entry = map.get('dc motor (small)');
    expect(entry?.effectiveQty).toBeCloseTo(2 * CONDITION_FACTOR.untested);
  });
});

describe('scoreProject – perfect match', () => {
  const fullInventory: InventoryEntry[] = [
    { componentName: 'Arduino Uno',        quantity: 1, condition: 'tested' },
    { componentName: 'DC Motor (small)',   quantity: 2, condition: 'tested' },
    { componentName: 'L298N Motor Driver', quantity: 1, condition: 'tested' },
    { componentName: 'Ultrasonic Sensor',  quantity: 1, condition: 'tested' },
    { componentName: 'Jumper Wires (set)', quantity: 1, condition: 'tested' },
  ];

  it('scores 100 when all parts are owned and tested', () => {
    const result = scoreProject(fullInventory, robotProject, components);
    expect(result.score).toBe(100);
    expect(result.missing.length).toBe(0);
  });

  it('has no substitutes used when direct match exists', () => {
    const result = scoreProject(fullInventory, robotProject, components);
    expect(result.substitutesUsed.length).toBe(0);
  });
});

describe('scoreProject – partial inventory', () => {
  const partialInventory: InventoryEntry[] = [
    { componentName: 'Arduino Uno',        quantity: 1, condition: 'tested' },
    { componentName: 'DC Motor (small)',   quantity: 2, condition: 'tested' },
    { componentName: 'L298N Motor Driver', quantity: 1, condition: 'tested' },
    // Missing: Ultrasonic Sensor, Jumper Wires
  ];

  it('reports missing parts', () => {
    const result = scoreProject(partialInventory, robotProject, components);
    const missingNames = result.missing.map(m => m.component);
    expect(missingNames).toContain('Ultrasonic Sensor');
  });

  it('score is below 100 when parts are missing', () => {
    const result = scoreProject(partialInventory, robotProject, components);
    expect(result.score).toBeLessThan(100);
  });

  it('scores 0 when inventory is empty', () => {
    const result = scoreProject([], robotProject, components);
    expect(result.score).toBe(0);
    expect(result.missing.length).toBe(robotProject.requirements.length);
  });
});

describe('scoreProject – substitute credit', () => {
  it('uses substitute at 70% credit when direct part is missing', () => {
    const inventory: InventoryEntry[] = [
      // Has Arduino Nano instead of Arduino Uno (substitute)
      { componentName: 'Arduino Nano',       quantity: 1, condition: 'tested' },
      { componentName: 'DC Motor (small)',   quantity: 2, condition: 'tested' },
      { componentName: 'L298N Motor Driver', quantity: 1, condition: 'tested' },
      { componentName: 'Ultrasonic Sensor',  quantity: 1, condition: 'tested' },
      { componentName: 'Jumper Wires (set)', quantity: 1, condition: 'tested' },
    ];

    const result = scoreProject(inventory, robotProject, components);
    expect(result.substitutesUsed).toContain('Arduino Nano');
    // Score should be less than 100 due to substitute penalty
    expect(result.score).toBeLessThan(100);
    // But higher than 0
    expect(result.score).toBeGreaterThan(0);
  });
});

describe('scoreProject – condition factors', () => {
  it('untested parts give 70% credit', () => {
    const testedInventory: InventoryEntry[] = [
      { componentName: 'Arduino Uno', quantity: 1, condition: 'tested' },
    ];
    const untestedInventory: InventoryEntry[] = [
      { componentName: 'Arduino Uno', quantity: 1, condition: 'untested' },
    ];

    const simpleProject: Project = {
      id: 'p-simple',
      title: 'Simple',
      description: '',
      category: 'educational',
      difficulty: 'easy',
      requirements: [{ component: 'Arduino Uno', qty: 1, critical: true, substitutes: [] }],
      steps: [],
      safety_notes: null,
    };

    const testedResult = scoreProject(testedInventory, simpleProject, components);
    const untestedResult = scoreProject(untestedInventory, simpleProject, components);

    expect(testedResult.score).toBe(100);
    expect(untestedResult.score).toBeCloseTo(70, 0);
  });

  it('faulty parts give 0% credit', () => {
    const inv: InventoryEntry[] = [
      { componentName: 'Arduino Uno', quantity: 1, condition: 'faulty' },
    ];
    const simpleProject: Project = {
      id: 'p-simple2',
      title: 'Simple',
      description: '',
      category: 'educational',
      difficulty: 'easy',
      requirements: [{ component: 'Arduino Uno', qty: 1, critical: true, substitutes: [] }],
      steps: [],
      safety_notes: null,
    };

    const result = scoreProject(inv, simpleProject, components);
    expect(result.score).toBe(0);
  });
});

describe('scoreProject – critical weighting', () => {
  it('critical parts weigh 2× in the score', () => {
    // Project with 1 critical + 1 non-critical part
    const mixedProject: Project = {
      id: 'p-mixed',
      title: 'Mixed',
      description: '',
      category: 'educational',
      difficulty: 'easy',
      requirements: [
        { component: 'Arduino Uno',        qty: 1, critical: true,  substitutes: [] },
        { component: 'Jumper Wires (set)', qty: 1, critical: false, substitutes: [] },
      ],
      steps: [],
      safety_notes: null,
    };

    // Own only the non-critical part
    const inv: InventoryEntry[] = [
      { componentName: 'Jumper Wires (set)', quantity: 1, condition: 'tested' },
    ];

    const result = scoreProject(inv, mixedProject, components);
    // Weight total = 2 (critical) + 1 (non-critical) = 3
    // Credit = 0 (critical) + 1 (non-critical) = 1
    // Score = 1/3 * 100 ≈ 33.3
    expect(result.score).toBeCloseTo(33.3, 0);
  });
});

describe('matchProjects', () => {
  it('returns projects sorted by score descending', () => {
    const inventory: InventoryEntry[] = [
      { componentName: 'Arduino Nano',       quantity: 1, condition: 'tested' },
      { componentName: 'Jumper Wires (set)', quantity: 1, condition: 'tested' },
    ];

    // Easy project requiring only Arduino Nano + Jumper Wires
    const easyProject: Project = {
      id: 'p-easy',
      title: 'Easy',
      description: '',
      category: 'educational',
      difficulty: 'easy',
      requirements: [
        { component: 'Arduino Nano',       qty: 1, critical: true, substitutes: [] },
        { component: 'Jumper Wires (set)', qty: 1, critical: false, substitutes: [] },
      ],
      steps: [],
      safety_notes: null,
    };

    const results = matchProjects(inventory, [robotProject, easyProject], components);
    expect(results[0].project.id).toBe('p-easy');
    expect(results[0].result.score).toBeGreaterThan(results[1].result.score);
  });
});

describe('scoreProject – waste diversion', () => {
  it('computes waste diverted as sum of component weights', () => {
    const inventory: InventoryEntry[] = [
      { componentName: 'Arduino Uno',        quantity: 1, condition: 'tested' },
      { componentName: 'DC Motor (small)',   quantity: 2, condition: 'tested' },
      { componentName: 'L298N Motor Driver', quantity: 1, condition: 'tested' },
      { componentName: 'Ultrasonic Sensor',  quantity: 1, condition: 'tested' },
      { componentName: 'Jumper Wires (set)', quantity: 1, condition: 'tested' },
    ];

    const result = scoreProject(inventory, robotProject, components);
    // arduino(25) + motors(30*2=60) + driver(20) + ultrasonic(8) + jumpers(15) = 128g
    expect(result.wasteDiverted_g).toBe(128);
  });
});
