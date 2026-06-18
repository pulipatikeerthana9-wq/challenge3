// Emission factors — hardcoded, auditable (IPCC / India CEA 2023)
export const EMISSION_FACTORS = {
  // Transport: kg CO2e per km
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_electric: 0.045,
  bus: 0.089,
  metro: 0.031,
  bike: 0.0,
  wfh: 0.0,

  // Flights: kg CO2e per flight
  flight_domestic: 255,
  flight_international: 1620,

  // Diet: kg CO2e per day
  vegan: 1.5,
  veg: 2.0,
  eggetarian: 2.5,
  "non-veg": 3.3,

  // Energy
  electricity_kwh: 0.716, // India CEA grid factor 2023
  lpg_kg: 2.983,          // 1 cylinder ≈ 14.2 kg → 42.35 kg CO2e

  // Shopping: kg CO2e per item
  clothing_item: 12.0,
  electronics_item: 70.0,
} as const;

export const INDIA_AVG_KG = 1800; // kg CO2e / year
