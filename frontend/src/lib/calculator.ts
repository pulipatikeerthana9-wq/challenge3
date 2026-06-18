import { EMISSION_FACTORS } from "./constants";
import type { LifestyleProfile, FootprintBreakdown } from "@/types";

/**
 * Pure deterministic carbon footprint calculator.
 * No LLM involved — every number is auditable.
 */
export function calculateFootprint(profile: LifestyleProfile): FootprintBreakdown {
  const EF = EMISSION_FACTORS;

  // ── Transport ────────────────────────────────────────────────────────────
  let transportFactor: number;
  if (profile.commute_mode === "car") {
    const fuelKey = `car_${profile.car_fuel_type ?? "petrol"}` as keyof typeof EF;
    transportFactor = (EF[fuelKey] as number) ?? EF.car_petrol;
  } else {
    const modeKey = profile.commute_mode as keyof typeof EF;
    transportFactor = (EF[modeKey] as number) ?? EF.bus;
  }
  // Standardize commuting to an average work/study year of 240 days to prevent 365-day inflation
  const commute = profile.commute_km_per_day * 240 * transportFactor;
  
  // Calculate domestic and international flights separately
  const domesticFlights = (profile.flights_domestic_per_year ?? 0) * EF.flight_domestic;
  const internationalFlights = (profile.flights_international_per_year ?? 0) * EF.flight_international;
  const transport = commute + domesticFlights + internationalFlights;

  // ── Diet ─────────────────────────────────────────────────────────────────
  const dietKey = profile.diet_type as keyof typeof EF;
  const dailyDiet = (EF[dietKey] as number) ?? EF.veg;
  const diet =
    dailyDiet * 365 +
    profile.eating_out_per_week * 52 * 1.2; // eating out ≈ 20% extra

  // ── Energy ───────────────────────────────────────────────────────────────
  // Household energy calculation that avoids double counting AC usage.
  // 1. Calculate AC electricity contribution first (1.5 kW average load)
  const acElectricity = profile.ac_hours_per_day * 365 * 1.5; // in kWh
  
  // 2. Subtract AC kWh from utility total to find base electricity usage.
  // Clamp base electricity to 0 to prevent negative values if user over-specifies AC hours.
  const totalElecPerYear = profile.electricity_kwh_per_month * 12;
  const nonAcElectricity = Math.max(0, totalElecPerYear - acElectricity);
  
  // 3. Apply renewable offset factor only to non-renewable grid consumption
  const renewableFactor = 1 - profile.renewable_percent / 100;
  const elecEmissions = (nonAcElectricity * renewableFactor) * EF.electricity_kwh;
  const acEmissions = acElectricity * renewableFactor * EF.electricity_kwh;
  
  const lpg = profile.lpg_cylinders_per_month * 12 * 14.2 * EF.lpg_kg;
  const energy = elecEmissions + lpg + acEmissions;

  // ── Shopping ─────────────────────────────────────────────────────────────
  const shopping =
    profile.new_clothes_per_year * EF.clothing_item +
    profile.electronics_per_year * EF.electronics_item;

  const total = transport + diet + energy + shopping;

  return {
    transport: Math.round(transport * 10) / 10,
    diet: Math.round(diet * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    shopping: Math.round(shopping * 10) / 10,
    total: Math.round(total * 10) / 10,
    trees_equivalent: Math.round(total / 21),        // 1 tree absorbs ≈21 kg CO2/yr
    car_km_equivalent: Math.round(total / EF.car_petrol),
  };
}

/** Apply a subset of changes over an existing profile */
export function applyChanges(
  base: LifestyleProfile,
  changes: Partial<LifestyleProfile>
): LifestyleProfile {
  return { ...base, ...changes };
}

/** Parse NLP/Text-based what-if patterns with high accuracy */
export function parseWhatIf(text: string): Partial<LifestyleProfile> {
  const lower = text.toLowerCase();
  const changes: Partial<LifestyleProfile> = {};

  // Transport Modes
  if (/metro|train|subway|tube|rapid transit/.test(lower)) {
    changes.commute_mode = "metro";
    changes.car_fuel_type = null;
  } else if (/bus|public transit|public transport|shuttle/.test(lower)) {
    changes.commute_mode = "bus";
    changes.car_fuel_type = null;
  } else if (/bike|cycle|bicycle|pedal|walk|foot|run/.test(lower)) {
    changes.commute_mode = "bike";
    changes.car_fuel_type = null;
  } else if (/work from home|wfh|remote|telecommute|stay at home/.test(lower)) {
    changes.commute_mode = "wfh";
  } else if (/electric car|ev\b|tesla|electric vehicle|plug-in/.test(lower)) {
    changes.commute_mode = "car";
    changes.car_fuel_type = "electric";
  } else if (/diesel/.test(lower)) {
    changes.commute_mode = "car";
    changes.car_fuel_type = "diesel";
  } else if (/petrol|gas car/.test(lower)) {
    changes.commute_mode = "car";
    changes.car_fuel_type = "petrol";
  }

  // Flights (Domestic & International)
  if (/no flights?|stop flying|zero flights?|never fly|cancel flights?/.test(lower)) {
    changes.flights_domestic_per_year = 0;
    changes.flights_international_per_year = 0;
  }
  if (/no international|zero international|stop international/.test(lower)) {
    changes.flights_international_per_year = 0;
  }
  if (/no domestic|zero domestic|stop domestic/.test(lower)) {
    changes.flights_domestic_per_year = 0;
  }
  
  // Custom flight numbers matching
  const flightMatch = lower.match(/(\d+)\s*(international|domestic)\s*flights?/);
  if (flightMatch) {
    const num = parseInt(flightMatch[1], 10);
    if (flightMatch[2] === "international") {
      changes.flights_international_per_year = num;
    } else {
      changes.flights_domestic_per_year = num;
    }
  }

  // Diet
  if (/vegan|plant-based|plant based/.test(lower)) {
    changes.diet_type = "vegan";
  } else if (/vegetarian|veg\b|no meat|meatless/.test(lower)) {
    changes.diet_type = "veg";
  } else if (/eggetarian|egg/.test(lower)) {
    changes.diet_type = "eggetarian";
  } else if (/meat|non-veg|non veg|carnivore/.test(lower)) {
    changes.diet_type = "non-veg";
  }

  if (/stop eating out|no restaurant|cook at home/.test(lower)) {
    changes.eating_out_per_week = 0;
  }

  // Energy & Utilities
  if (/solar|renewable|green energy|clean energy|solar panel/.test(lower)) {
    changes.renewable_percent = 100;
  }
  if (/ac.*24|24.*ac|raise.*ac|ac.*less|reduce ac/.test(lower)) {
    changes.ac_hours_per_day = Math.max(0, changes.ac_hours_per_day ? changes.ac_hours_per_day - 1 : 1);
  }
  if (/no ac|without ac|stop ac|turn off ac|shut down ac/.test(lower)) {
    changes.ac_hours_per_day = 0;
  }

  // Shopping
  if (/fewer clothes|less clothes|no clothes|stop shopping clothes/.test(lower)) {
    changes.new_clothes_per_year = 2;
  }
  if (/fewer gadgets|less electronics|no electronics|stop shopping gadgets/.test(lower)) {
    changes.electronics_per_year = 0;
  }

  return changes;
}

/**
 * Heuristic estimate of kg CO2e saved by applying a single suggested tip.
 * Uses conservative, auditable heuristics to map a tip title to plausible profile changes.
 */
export function estimateTipSavings(base: LifestyleProfile, tipTitle: string): number {
  const lower = tipTitle.toLowerCase();
  const baseFp = calculateFootprint(base);
  const changes: Partial<LifestyleProfile> = {};

  if (/metro|train|subway|rapid transit|public transit|bus|commute|transport|bike|cycle/.test(lower)) {
    // Assume switching to metro if not already metro/bike/wfh
    if (base.commute_mode !== "metro") {
      changes.commute_mode = "metro";
    } else {
      // if already metro, assume 20% fewer commute km
      changes.commute_km_per_day = Math.max(0, Math.round(base.commute_km_per_day * 0.8));
    }
  } else if (/vegan|vegetarian|veg|plant-based|no meat|meatless/.test(lower)) {
    // Move to vegan diet
    changes.diet_type = "vegan";
  } else if (/solar|renewable|clean energy|green energy/.test(lower)) {
    // Assume 50% renewable increase
    changes.renewable_percent = Math.min(100, Math.max(0, base.renewable_percent ?? 0) + 50);
  } else if (/ac|air.?condi|set ac|ac usage|reduce ac|turn off ac|raise.*ac/.test(lower)) {
    // Reduce AC hours by 1-2 hours conservatively
    changes.ac_hours_per_day = Math.max(0, (base.ac_hours_per_day ?? 0) - 1);
  } else if (/vampire|unplug|chargers|standby/.test(lower)) {
    // Reduce electricity by 10%
    changes.electricity_kwh_per_month = Math.max(0, (base.electricity_kwh_per_month ?? 0) * 0.9);
  } else if (/cooking gas|lpg|gas/.test(lower)) {
    // Reduce LPG by 20%
    changes.lpg_cylinders_per_month = Math.max(0, (base.lpg_cylinders_per_month ?? 0) * 0.8);
  } else if (/clothes|shopping|refurbished|fewer clothes/.test(lower)) {
    changes.new_clothes_per_year = Math.max(0, Math.round((base.new_clothes_per_year ?? 0) * 0.5));
  } else if (/electronics|gadgets/.test(lower)) {
    changes.electronics_per_year = Math.max(0, Math.round((base.electronics_per_year ?? 0) * 0.5));
  } else {
    // Unknown mapping: try a conservative 5% reduction in total electricity + transport
    changes.electricity_kwh_per_month = Math.max(0, (base.electricity_kwh_per_month ?? 0) * 0.95);
    changes.commute_km_per_day = Math.max(0, Math.round((base.commute_km_per_day ?? 0) * 0.95));
  }

  const newProfile = applyChanges(base, changes);
  const newFp = calculateFootprint(newProfile);
  const delta = Math.round((baseFp.total - newFp.total) * 10) / 10; // kg saved (positive)
  return delta > 0 ? delta : 0;
}
