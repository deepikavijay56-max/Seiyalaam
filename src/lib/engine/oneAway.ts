/**
 * oneAway.ts – "One part away" detection and unlock count calculations
 *
 * oneAwayProjects: projects with score >= 70 AND exactly one missing required part
 * unlockCounts: for each missing component across projects with score >= 50,
 *               count how many projects would reach >= 90 if that component were added
 */

import { scoreProject, type InventoryEntry, type Project, type Component } from './matcher';

export interface OneAwayProject {
  project: Project;
  score: number;
  missingComponent: string;
  missingQty: number;
}

export interface UnlockCount {
  component: string;
  projectsUnlocked: number;
  projects: Project[];
}

/**
 * Returns projects where score >= 70 and exactly 1 required part is missing.
 */
export function oneAwayProjects(
  inventory: InventoryEntry[],
  projects: Project[],
  components: Component[]
): OneAwayProject[] {
  const result: OneAwayProject[] = [];

  for (const project of projects) {
    const { score, missing } = scoreProject(inventory, project, components);

    // Must be >= 70 score and have exactly 1 missing required part
    if (score >= 70 && missing.length === 1) {
      result.push({
        project,
        score,
        missingComponent: missing[0].component,
        missingQty: missing[0].needed,
      });
    }
  }

  return result.sort((a, b) => b.score - a.score);
}

/**
 * For each missing component across ALL projects with score >= 50,
 * count how many projects would reach >= 90 if that single component were added.
 * Returns sorted descending by projectsUnlocked.
 */
export function unlockCounts(
  inventory: InventoryEntry[],
  projects: Project[],
  components: Component[]
): UnlockCount[] {
  // First find all projects with score >= 50
  const candidateProjects = projects.filter(p => {
    const { score } = scoreProject(inventory, p, components);
    return score >= 50;
  });

  // Collect all unique missing components from these projects
  const missingComponentSet = new Set<string>();
  for (const project of candidateProjects) {
    const { missing } = scoreProject(inventory, project, components);
    for (const m of missing) {
      missingComponentSet.add(m.component);
    }
  }

  const counts: UnlockCount[] = [];

  for (const compName of missingComponentSet) {
    // Simulate adding this component (1 unit, tested) to inventory
    const hypotheticalInventory: InventoryEntry[] = [
      ...inventory,
      { componentName: compName, quantity: 1, condition: 'tested' },
    ];

    // Count how many candidate projects reach >= 90
    const unlocked: Project[] = [];
    for (const project of candidateProjects) {
      const { score: currentScore } = scoreProject(inventory, project, components);
      const { score: newScore } = scoreProject(hypotheticalInventory, project, components);
      if (currentScore < 90 && newScore >= 90) {
        unlocked.push(project);
      }
    }

    if (unlocked.length > 0) {
      counts.push({
        component: compName,
        projectsUnlocked: unlocked.length,
        projects: unlocked,
      });
    }
  }

  return counts.sort((a, b) => b.projectsUnlocked - a.projectsUnlocked);
}
