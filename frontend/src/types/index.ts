// Shared TypeScript types for EcoPilot

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface LifestyleProfile {
  commute_mode: "bike" | "metro" | "car" | "bus" | "wfh";
  commute_km_per_day: number;
  flights_domestic_per_year: number;
  flights_international_per_year: number;
  car_fuel_type: "petrol" | "diesel" | "electric" | null;
  diet_type: "vegan" | "veg" | "eggetarian" | "non-veg";
  eating_out_per_week: number;
  electricity_kwh_per_month: number;
  lpg_cylinders_per_month: number;
  ac_hours_per_day: number;
  renewable_percent: number;
  new_clothes_per_year: number;
  electronics_per_year: number;
}

export interface FootprintBreakdown {
  transport: number;
  diet: number;
  energy: number;
  shopping: number;
  total: number;
  trees_equivalent: number;
  car_km_equivalent: number;
}

export interface CarbonTwin {
  current: number;
  improved: number;
  future: number;
}

export interface SimulateResult {
  delta_kg_annual: number;
  percent_change: number;
  new_total: number;
  explanation: string;
  breakdown: FootprintBreakdown;
  error?: string;
}

export const DEFAULT_PROFILE: LifestyleProfile = {
  commute_mode: "bus",
  commute_km_per_day: 10,
  flights_domestic_per_year: 0,
  flights_international_per_year: 0,
  car_fuel_type: null,
  diet_type: "veg",
  eating_out_per_week: 2,
  electricity_kwh_per_month: 150,
  lpg_cylinders_per_month: 0.5,
  ac_hours_per_day: 2,
  renewable_percent: 0,
  new_clothes_per_year: 10,
  electronics_per_year: 1,
};
