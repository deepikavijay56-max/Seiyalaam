import componentsData from '../../data/components.json';
import type {
  InventoryItem,
  RawIdea,
  ValidatedIdea,
  ValidatedPart,
  VoltageCompatibility,
  ValidationStatus,
  Project,
} from '../../types';
import { supabase } from '../supabase';

interface CatalogComponent {
  id: string;
  name: string;
  category: string;
  weight_g: number;
  voltage: number | null;
  max_current_ma: number | null;
  safety_tags: string[];
  substitutes: string[];
}

const CATALOG: CatalogComponent[] = componentsData as CatalogComponent[];

/**
 * Finds a catalog component by name with case-insensitive matching
 */
export function findCatalogComponent(name: string): CatalogComponent | undefined {
  const clean = name.trim().toLowerCase();
  return CATALOG.find(c => c.name.toLowerCase() === clean);
}

/**
 * Deterministically checks and validates a raw AI idea:
 * 1. Checks every part exists in components catalog
 * 2. Checks owned vs needed quantities with missing parts
 * 3. Evaluates voltage compatibility (suggests converter if mismatched)
 * 4. Checks safety tags (rejects mains voltage and damaged/faulty lithium)
 * 5. Returns validated status: 'verified' | 'needs_parts' | 'rejected'
 */
export function validateIdea(
  idea: RawIdea,
  inventory: InventoryItem[] = []
): ValidatedIdea {
  let rejectionReason: string | undefined;

  // 1. Verify existence of every part in catalog
  const validatedParts: ValidatedPart[] = [];
  const voltages: number[] = [];

  if (!idea.partsUsed || !Array.isArray(idea.partsUsed) || idea.partsUsed.length === 0) {
    rejectionReason = 'Idea must specify at least one valid component in partsUsed.';
  }

  const partsList = idea.partsUsed || [];

  for (const part of partsList) {
    if (!part || !part.name) {
      rejectionReason = rejectionReason || 'Malformed part specification in AI output.';
      continue;
    }

    const catalogComp = findCatalogComponent(part.name);
    if (!catalogComp) {
      rejectionReason = rejectionReason || `Unknown component: "${part.name}" is not recognized in the hardware catalog.`;
      continue;
    }

    // Safety Check: Mains Voltage tag
    if (catalogComp.safety_tags.includes('mains_voltage')) {
      rejectionReason =
        rejectionReason ||
        `Safety hazard: Platform strictly prohibits high-voltage AC mains circuits (detected "${catalogComp.name}"). Low-voltage DC (<24V) only.`;
    }

    // Safety Check: Damaged Lithium Battery in inventory
    if (catalogComp.safety_tags.includes('lithium')) {
      const faultyLithiumItem = inventory.find(
        item =>
          item.componentName.toLowerCase() === catalogComp.name.toLowerCase() &&
          item.condition === 'faulty'
      );
      if (faultyLithiumItem) {
        rejectionReason =
          rejectionReason ||
          `Safety hazard: Damaged or swollen lithium cell ("${catalogComp.name}") in faulty condition must not be reused. Danger of thermal runaway.`;
      }
    }

    // Calculate owned vs needed
    const needed = Math.max(1, Number(part.qty) || 1);
    const owned = inventory
      .filter(
        item =>
          item.componentName.toLowerCase() === catalogComp.name.toLowerCase() &&
          item.condition !== 'faulty'
      )
      .reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

    const missing = Math.max(0, needed - owned);

    if (catalogComp.voltage !== null && catalogComp.voltage !== undefined) {
      voltages.push(catalogComp.voltage);
    }

    validatedParts.push({
      name: catalogComp.name,
      needed,
      owned,
      missing,
      voltage: catalogComp.voltage,
      safety_tags: catalogComp.safety_tags,
    });
  }

  // Safety text scan in title, description, and steps
  const combinedText = `${idea.title} ${idea.description} ${(idea.steps || []).join(' ')}`.toLowerCase();
  if (
    combinedText.includes('230v') ||
    combinedText.includes('110v') ||
    combinedText.includes('wall socket') ||
    combinedText.includes('mains supply')
  ) {
    rejectionReason =
      rejectionReason ||
      'Safety hazard: High voltage mains power connection (110V/230V AC) detected in project steps. Only safe DC circuits are supported.';
  }

  // 2. Voltage Compatibility Evaluation
  let supplyNum: number | undefined;
  if (typeof idea.supplyVoltage === 'number') {
    supplyNum = idea.supplyVoltage;
  } else if (typeof idea.supplyVoltage === 'string') {
    const parsed = parseFloat(idea.supplyVoltage.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) supplyNum = parsed;
  }

  if (supplyNum !== undefined) {
    voltages.push(supplyNum);
  }

  const uniqueVoltages = Array.from(new Set(voltages));
  let voltageCompatibility: VoltageCompatibility = {
    compatible: true,
    supplyVoltage: supplyNum ?? (uniqueVoltages[0] || 5),
  };

  if (uniqueVoltages.length > 1) {
    const minV = Math.min(...uniqueVoltages);
    const maxV = Math.max(...uniqueVoltages);

    if (maxV >= 12 && minV <= 5) {
      voltageCompatibility = {
        compatible: false,
        supplyVoltage: maxV,
        converterSuggested: 'DC-DC Buck Converter (e.g. LM2596 or 7805 regulator) to step down 12V to 5V',
        notes: `Voltage mismatch: Project uses both ${minV}V logic and ${maxV}V high-power elements. A step-down converter is required.`,
      };
    } else if (maxV >= 5 && minV <= 3.3) {
      voltageCompatibility = {
        compatible: false,
        supplyVoltage: maxV,
        converterSuggested: 'Bi-directional Logic Level Shifter or 3.3V LDO regulator',
        notes: `Logic level mismatch: Project uses 5V and 3.3V components. Level shifting recommended to avoid damaging 3.3V pins.`,
      };
    } else if (minV <= 3.7 && maxV >= 5) {
      voltageCompatibility = {
        compatible: false,
        supplyVoltage: minV,
        converterSuggested: '5V Step-Up Boost Converter (e.g. MT3608 or TP4056 booster)',
        notes: `Supply mismatch: 3.7V Lithium cell requires a boost converter to reliably drive 5V microcontroller.`,
      };
    } else {
      voltageCompatibility = {
        compatible: true,
        supplyVoltage: maxV,
        notes: `Voltages vary slightly (${minV}V - ${maxV}V). Ensure power rail regulation.`,
      };
    }
  }

  // 3. Determine status
  const totalMissing = validatedParts.reduce((sum, p) => sum + p.missing, 0);

  let status: ValidationStatus = 'verified';
  if (rejectionReason) {
    status = 'rejected';
  } else if (totalMissing > 0) {
    status = 'needs_parts';
  } else {
    status = 'verified';
  }

  return {
    id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: idea.title || 'Untitled Hardware Invention',
    description: idea.description || '',
    partsUsed: validatedParts,
    steps: Array.isArray(idea.steps) ? idea.steps : [],
    supplyVoltage: supplyNum || idea.supplyVoltage || 5,
    status,
    rejectionReason,
    missingCount: totalMissing,
    voltageCompatibility,
    is_ai_generated: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Curated offline fallback ideas for DEMO_MODE
 */
export const DEMO_SAMPLE_IDEAS: RawIdea[] = [
  {
    title: 'Smart Plant Soil Hygrometer & Alarm',
    description:
      'Reuses an Arduino Uno and display to build an automated soil hygrometer that alerts you before plants dry out.',
    partsUsed: [
      { name: 'Arduino Uno', qty: 1 },
      { name: 'DHT11 Sensor', qty: 1 },
      { name: 'OLED Display', qty: 1 },
      { name: 'Buzzer', qty: 1 },
      { name: 'Jumper Wires (set)', qty: 1 },
    ],
    steps: [
      'Mount the OLED Display and DHT11 Sensor to the breadboard.',
      'Connect DHT11 signal pin to Arduino Uno Digital Pin 2.',
      'Connect OLED I2C SDA/SCL lines to Arduino Pins A4 and A5.',
      'Wire the Buzzer to Digital Pin 8 with a current-limiting resistor.',
      'Power the Arduino from a 5V USB source and calibrate moisture thresholds.',
    ],
    supplyVoltage: 5,
  },
  {
    title: 'Touchless Desk Cool-Air Blower',
    description:
      'Upcycles a salvaged small DC motor and ultrasonic proximity sensor into an automatic touchless cooling fan.',
    partsUsed: [
      { name: 'Arduino Uno', qty: 1 },
      { name: 'DC Motor (small)', qty: 1 },
      { name: 'Ultrasonic Sensor', qty: 1 },
      { name: 'L293D Motor Driver', qty: 1 },
      { name: 'Jumper Wires (set)', qty: 1 },
    ],
    steps: [
      'Insert L293D motor driver onto the breadboard and connect enable pins.',
      'Wire the DC Motor to driver outputs 1 and 2.',
      'Mount Ultrasonic Sensor facing forward to detect hand presence within 30cm.',
      'Connect trigger and echo pins to Arduino Pins 9 and 10.',
      'Flash the controller sketch to spin the motor whenever motion is detected.',
    ],
    supplyVoltage: 5,
  },
  {
    title: 'High-Lumen Emergency Strobe Beacon',
    description:
      'Creates a portable safety beacon using an addressable LED strip and rechargeable 18650 cell.',
    partsUsed: [
      { name: 'Arduino Nano', qty: 1 },
      { name: 'LED Strip (WS2812)', qty: 1 },
      { name: '18650 Li-ion Battery', qty: 1 },
      { name: 'Jumper Wires (set)', qty: 1 },
    ],
    steps: [
      'Inspect 18650 cell voltage with multimeter to confirm safe state (>3.2V).',
      'Connect LED strip DIN line to Arduino Nano Pin D6.',
      'Wire 3.7V cell through a 5V step-up booster to power the Arduino and LEDs.',
      'Upload flash sequence code with emergency pulsing orange-yellow cadence.',
      'Enclose assembly in a repurposed translucent container as an optical diffuser.',
    ],
    supplyVoltage: 5,
  },
];

/**
 * Returns cached validated sample ideas for DEMO_MODE
 */
export function getDemoIdeas(inventory: InventoryItem[] = []): ValidatedIdea[] {
  return DEMO_SAMPLE_IDEAS.map(raw => validateIdea(raw, inventory));
}

/**
 * Generates 3 innovative upcycling ideas from user inventory using Gemini AI,
 * retries once on malformed JSON, falls back to DEMO_MODE sample ideas,
 * and deterministically passes every idea through validateIdea().
 *
 * CRITICAL RULE: Never displays unverified AI output!
 */
export async function generateIdeas(
  inventory: InventoryItem[] = []
): Promise<ValidatedIdea[]> {
  const inventorySummary = inventory
    .filter(item => item.quantity > 0)
    .map(item => `${item.quantity}x ${item.componentName} (${item.condition})`)
    .join(', ');

  const prompt = `You are "Seiyalaam Kandupidi" (AI Hardware Inventor), an expert circular electronics engineer and e-waste inventor.
Given this maker's currently owned e-waste electronic inventory:
[${inventorySummary || 'Basic maker electronic components'}]

Invent EXACTLY 3 unique, realistic, and practical hardware projects they can build by upcycling electronic components.

CRITICAL RULES:
1. ONLY use components from this recognized list:
${JSON.stringify(CATALOG.map(c => c.name))}
2. Prioritize components the user already owns, but you can include 1 or 2 parts they might need.
3. NEVER design high-voltage AC mains circuits (no 230V/110V wall power). ONLY safe low-voltage DC (<24V).
4. Specify supplyVoltage (e.g. 5, 12, 3.3).
5. Output STRICT JSON ONLY adhering to this format:
[
  {
    "title": "Short catchy project name",
    "description": "1-2 sentence description explaining purpose and upcycling value",
    "partsUsed": [
      { "name": "Exact component name from catalog", "qty": 1 }
    ],
    "steps": [
      "Step 1: concise build step",
      "Step 2: concise build step",
      "Step 3: concise build step"
    ],
    "supplyVoltage": 5
  }
]
No markdown wrapping, no conversational text, strictly valid JSON array of 3 objects.`;

  const fetchAiResponse = async (correctiveInstruction = ''): Promise<RawIdea[]> => {
    const fullPrompt = correctiveInstruction ? `${prompt}\n\nATTENTION: ${correctiveInstruction}` : prompt;

    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        action: 'generate-ideas',
        payload: { prompt: fullPrompt },
      },
    });

    if (error || !data?.rawText) {
      throw new Error(error?.message || 'Empty AI response from proxy');
    }

    const cleaned = data.rawText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned) as RawIdea[];
  };

  let rawIdeas: RawIdea[] = [];

  try {
    rawIdeas = await fetchAiResponse();
  } catch (firstErr) {
    console.warn('Initial Kandupidi JSON parse failed. Retrying once with strict correction prompt...', firstErr);
    try {
      rawIdeas = await fetchAiResponse('Previous response had JSON syntax error. Ensure output is a valid JSON array of 3 objects.');
    } catch (retryErr) {
      console.error('Kandupidi retry failed. Falling back to DEMO_MODE sample ideas:', retryErr);
      return getDemoIdeas(inventory);
    }
  }

  if (!Array.isArray(rawIdeas) || rawIdeas.length === 0) {
    return getDemoIdeas(inventory);
  }

  // Deterministically validate every generated idea. NEVER display unverified AI output!
  return rawIdeas.slice(0, 3).map(raw => validateIdea(raw, inventory));
}

/**
 * Saves a validated idea into the projects database with is_ai_generated = true.
 */
export async function saveIdeaAsProject(
  idea: ValidatedIdea,
  userId?: string
): Promise<Project> {
  const newProject: Project = {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: 'practical',
    difficulty: idea.partsUsed.length > 4 ? 'medium' : 'easy',
    requirements: idea.partsUsed.map(p => ({
      component: p.name,
      qty: p.needed,
      critical: true,
      substitutes: [],
    })),
    steps: idea.steps.map((text, idx) => ({
      step: idx + 1,
      title: `Step ${idx + 1}`,
      desc: text,
    })),
    safety_notes: idea.rejectionReason || idea.voltageCompatibility.notes || 'Handle all circuit wiring with power disconnected.',
    is_ai_generated: true,
    created_by: userId,
  };

  // Try saving to Supabase
  if (supabase) {
    try {
      await supabase.from('projects').insert({
        id: newProject.id,
        title: newProject.title,
        description: newProject.description,
        category: newProject.category,
        difficulty: newProject.difficulty,
        requirements: newProject.requirements,
        steps: newProject.steps,
        safety_notes: newProject.safety_notes,
        is_ai_generated: true,
        created_by: userId || null,
      });
    } catch (err) {
      console.warn('Could not persist project to Supabase, saving locally:', err);
    }
  }

  // Also save to localStorage cache so it shows up in suggestions & projects
  try {
    const existingStr = localStorage.getItem('seiyalaam_custom_projects');
    const existing: Project[] = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(newProject);
    localStorage.setItem('seiyalaam_custom_projects', JSON.stringify(existing));
  } catch (storageErr) {
    console.warn('LocalStorage save failed:', storageErr);
  }

  return newProject;
}
