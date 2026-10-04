/**
 * matcher.ts – deterministic project matching engine
 * All functions are pure (no side effects, no I/O).
 *
 * Scoring algorithm:
 *  - Per required part: credit = min(owned_credit, needed) / needed
 *    where owned_credit = quantity * condition_factor
 *    condition_factor: tested=1.0, untested=0.7, partial=0.5, faulty=0.0
 *  - If a listed substitute is owned, credit = 0.7 * <substitute credit>
 *  - Critical parts weigh 2× in the weighted average
 *  - Final score 0–100
 */

export type Condition = 'tested' | 'untested' | 'partial' | 'faulty';

export interface InventoryEntry {
  componentName: string;
  quantity: number;
  condition: Condition;
}

export interface Requirement {
  component: string;
  qty: number;
  critical: boolean;
  substitutes: string[];
}

export interface Component {
  id: string;
  name: string;
  category: string;
  weight_g: number;
  voltage?: number | null;
  max_current_ma?: number | null;
  safety_tags: string[];
  substitutes: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'educational' | 'creative' | 'practical';
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: Requirement[];
  steps: { step: number; title: string; desc: string }[];
  safety_notes: string | null;
}

export interface PartResult {
  component: string;
  needed: number;
  owned: number;
  credit: number;        // 0–1
  critical: boolean;
  substituteUsed?: string;
  conditionNote?: string; // e.g. "test first – untested parts give 70% credit"
}

export interface ScoreResult {
  score: number;           // 0–100 rounded to 1 decimal place
  matched: PartResult[];
  missing: PartResult[];
  substitutesUsed: string[];
  wasteDiverted_g: number; // sum of weights of matched components
}

/** Condition factor lookup */
export const CONDITION_FACTOR: Record<Condition, number> = {
  tested:   1.0,
  untested: 0.7,
  partial:  0.5,
  faulty:   0.0,
};

/**
 * Build a map from component name → best available (highest effective qty).
 * If a user has multiple entries for the same component (shouldn't happen with
 * unique constraint, but defensive), pick the best condition.
 */
export function buildInventoryMap(
  inventory: InventoryEntry[]
): Map<string, { quantity: number; condition: Condition; effectiveQty: number }> {
  const map = new Map<string, { quantity: number; condition: Condition; effectiveQty: number }>();
  for (const item of inventory) {
    const key = item.componentName.toLowerCase().trim();
    const factor = CONDITION_FACTOR[item.condition];
    const effectiveQty = item.quantity * factor;
    const existing = map.get(key);
    if (!existing || effectiveQty > existing.effectiveQty) {
      map.set(key, { quantity: item.quantity, condition: item.condition, effectiveQty });
    }
  }
  return map;
}

/**
 * Score a single project against the user's inventory.
 */
export function scoreProject(
  inventory: InventoryEntry[],
  project: Project,
  components: Component[]
): ScoreResult {
  const invMap = buildInventoryMap(inventory);
  const compWeightMap = new Map<string, number>(
    components.map(c => [c.name.toLowerCase().trim(), c.weight_g])
  );

  let totalWeight = 0;   // sum of (critical ? 2 : 1) weights
  let totalCredit = 0;   // weighted sum of credits
  const matched: PartResult[] = [];
  const missing: PartResult[] = [];
  const substitutesUsed: string[] = [];
  let wasteDiverted_g = 0;

  for (const req of project.requirements) {
    const weight = req.critical ? 2 : 1;
    totalWeight += weight;

    const key = req.component.toLowerCase().trim();
    const ownedItem = invMap.get(key);

    // Condition note for partial/untested
    const getConditionNote = (cond: Condition) => {
      if (cond === 'untested') return 'Test first – untested parts give 70% credit';
      if (cond === 'partial') return 'Test first – partial condition gives 50% credit';
      return undefined;
    };

    if (ownedItem && ownedItem.effectiveQty > 0) {
      // Direct match
      const credit = Math.min(ownedItem.effectiveQty, req.qty) / req.qty;
      totalCredit += weight * credit;
      wasteDiverted_g += (compWeightMap.get(key) ?? 0) * Math.min(ownedItem.quantity, req.qty);

      const partResult: PartResult = {
        component: req.component,
        needed: req.qty,
        owned: ownedItem.quantity,
        credit,
        critical: req.critical,
        conditionNote: getConditionNote(ownedItem.condition),
      };

      if (credit >= 1) {
        matched.push(partResult);
      } else {
        // Partially matched – show as matched but flag partial fill
        matched.push(partResult);
      }
    } else {
      // Try substitutes
      let bestSubCredit = 0;
      let bestSub: string | undefined;
      let bestSubOwned = 0;
      let bestSubCond: Condition = 'faulty';

      for (const sub of req.substitutes) {
        const subKey = sub.toLowerCase().trim();
        const subItem = invMap.get(subKey);
        if (subItem && subItem.effectiveQty > 0) {
          // Substitute credit is 70% of what the direct credit would be
          const directCredit = Math.min(subItem.effectiveQty, req.qty) / req.qty;
          const subCredit = directCredit * 0.7;
          if (subCredit > bestSubCredit) {
            bestSubCredit = subCredit;
            bestSub = sub;
            bestSubOwned = subItem.quantity;
            bestSubCond = subItem.condition;
          }
        }
      }

      if (bestSub !== undefined && bestSubCredit > 0) {
        totalCredit += weight * bestSubCredit;
        substitutesUsed.push(bestSub);
        const subKey = (compWeightMap.get(bestSub.toLowerCase().trim()) ?? 0);
        wasteDiverted_g += subKey * Math.min(bestSubOwned, req.qty);

        matched.push({
          component: req.component,
          needed: req.qty,
          owned: bestSubOwned,
          credit: bestSubCredit,
          critical: req.critical,
          substituteUsed: bestSub,
          conditionNote: getConditionNote(bestSubCond),
        });
      } else {
        // Truly missing
        missing.push({
          component: req.component,
          needed: req.qty,
          owned: 0,
          credit: 0,
          critical: req.critical,
        });
        // Still add weight with 0 credit
      }
    }
  }

  const rawScore = totalWeight > 0 ? (totalCredit / totalWeight) * 100 : 0;
  const score = Math.round(rawScore * 10) / 10;

  return { score, matched, missing, substitutesUsed, wasteDiverted_g };
}

/**
 * Score and rank all projects for the user's inventory.
 * Returns projects sorted by score descending.
 */
export function matchProjects(
  inventory: InventoryEntry[],
  projects: Project[],
  components: Component[]
): Array<{ project: Project; result: ScoreResult }> {
  return projects
    .map(project => ({
      project,
      result: scoreProject(inventory, project, components),
    }))
    .sort((a, b) => b.result.score - a.result.score);
}
