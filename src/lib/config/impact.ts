/**
 * impact.ts – Environmental & E-waste Impact Assumptions and Conversion Factors
 *
 * All factors here are documented benchmarks used across Seiyalaam.
 * Note: These values are derived from standard life-cycle assessment (LCA)
 * literature on electronic waste recovery and Indian national e-waste statistics.
 */

export interface ImpactConfig {
  /**
   * CO2 avoided per kilogram of diverted electronics (kg CO2e / kg e-waste).
   * ASSUMPTION: Diverting electronic hardware prevents virgin extraction and refining of
   * precious metals (copper, gold, silver), lithium, and engineering thermoplastics.
   * Average published LCA estimates range from 1.2 to 2.5 kg CO2e/kg depending on fraction.
   * We adopt a conservative benchmark of 1.44 kg CO2e per 1 kg of hardware diverted.
   * (Labelled as an estimate).
   */
  CO2_FACTOR_KG_PER_KG: number;

  /**
   * India national e-waste statistics:
   * Source: Central Pollution Control Board (CPCB) & Global E-waste Monitor estimates.
   * India generates approximately 1.4 to 1.7 million metric tonnes of e-waste annually.
   * This translates to:
   *   - ~3,900 metric tonnes (3,900,000 kg) per day.
   *   - ~45 kg per second (45,000 grams every second).
   * (Labelled as approximate official-data estimate).
   */
  INDIA_EWASTE_DAILY_TONNES: number;
  INDIA_EWASTE_PER_SECOND_KG: number;

  /**
   * Equivalent metric baselines for comparison and relatable impacts:
   */
  TREE_SEEDLING_CARBON_ABSORBED_KG_PER_YEAR: number; // ~21 kg CO2/year absorbed per mature tree seedling
  SMARTPHONE_CHARGES_PER_KG_CO2: number;            // ~121 smartphone full battery recharges per kg CO2 avoided
}

export const IMPACT_CONFIG: ImpactConfig = {
  // 1 kg of electronic components salvaged avoids ~1.44 kg of CO2 equivalent emissions.
  CO2_FACTOR_KG_PER_KG: 1.44,

  // India creates roughly 3,900 tonnes of electronic waste every single day.
  INDIA_EWASTE_DAILY_TONNES: 3900,

  // ~45.14 kg of e-waste enters India's waste stream every elapsed second.
  INDIA_EWASTE_PER_SECOND_KG: 45.14,

  // Relatable benchmarks:
  TREE_SEEDLING_CARBON_ABSORBED_KG_PER_YEAR: 21.0,
  SMARTPHONE_CHARGES_PER_KG_CO2: 121.6,
};

/**
 * Calculates estimated kilograms of CO2 avoided from total grams of e-waste diverted.
 * Labeled explicitly as an approximation.
 */
export function calculateCO2AvoidedKg(gramsDiverted: number): {
  co2Kg: number;
  assumptionNote: string;
} {
  const kgDiverted = gramsDiverted / 1000;
  const co2Kg = Math.round(kgDiverted * IMPACT_CONFIG.CO2_FACTOR_KG_PER_KG * 100) / 100;
  return {
    co2Kg,
    assumptionNote: `Estimated at ${IMPACT_CONFIG.CO2_FACTOR_KG_PER_KG} kg CO₂e avoided per 1 kg of salvaged hardware (based on average LCA metals/plastics extraction benchmarks).`,
  };
}
