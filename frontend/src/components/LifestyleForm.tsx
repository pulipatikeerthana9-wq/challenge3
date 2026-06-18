"use client";

import type { LifestyleProfile } from "@/types";

interface Props {
  profile: LifestyleProfile;
  onChange: (updated: LifestyleProfile) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function LifestyleForm({ profile, onChange, onSubmit, loading }: Props) {
  // Client-side sanitization and bounds enforcing helper
  const setNum = <K extends keyof LifestyleProfile>(
    key: K,
    rawValue: string,
    maxVal: number,
    isInteger: boolean = true
  ) => {
    let num = Number(rawValue);
    if (isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > maxVal) num = maxVal;
    if (isInteger) num = Math.floor(num);
    onChange({ ...profile, [key]: num });
  };

  const set = <K extends keyof LifestyleProfile>(key: K, value: LifestyleProfile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <div className="card fade-up fade-up-2" id="lifestyle-form">
      <div className="card-title">📝 Your Lifestyle Profile</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Commute mode */}
        <div className="form-group">
          <label className="label" htmlFor="commute_mode">Commute Mode</label>
          <select
            id="commute_mode"
            className="input select"
            value={profile.commute_mode}
            onChange={(e) => set("commute_mode", e.target.value as LifestyleProfile["commute_mode"])}
            aria-label="Commute Mode"
          >
            <option value="bus">🚌 Bus</option>
            <option value="metro">🚇 Metro</option>
            <option value="car">🚗 Car</option>
            <option value="bike">🚲 Bike / Walk</option>
            <option value="wfh">🏠 Work from Home</option>
          </select>
        </div>

        {/* Car fuel (show only if car selected) */}
        {profile.commute_mode === "car" && (
          <div className="form-group">
            <label className="label" htmlFor="car_fuel_type">Car Fuel Type</label>
            <select
              id="car_fuel_type"
              className="input select"
              value={profile.car_fuel_type ?? "petrol"}
              onChange={(e) => set("car_fuel_type", e.target.value as LifestyleProfile["car_fuel_type"])}
              aria-label="Car Fuel Type"
            >
              <option value="petrol">⛽ Petrol</option>
              <option value="diesel">⛽ Diesel</option>
              <option value="electric">⚡ Electric</option>
            </select>
          </div>
        )}

        {/* Commute distance */}
        <div className="form-group">
          <label className="label" htmlFor="commute_km">Commute (km/day)</label>
          <input
            id="commute_km"
            className="input"
            type="number"
            min="0"
            max="200"
            step="1"
            value={profile.commute_km_per_day}
            onChange={(e) => setNum("commute_km_per_day", e.target.value, 200, false)}
            aria-label="Commute distance in kilometers per day"
          />
        </div>

        {/* Domestic Flights */}
        <div className="form-group">
          <label className="label" htmlFor="flights_domestic">Domestic Flights / Year</label>
          <input
            id="flights_domestic"
            className="input"
            type="number"
            min="0"
            max="50"
            step="1"
            value={profile.flights_domestic_per_year ?? 0}
            onChange={(e) => setNum("flights_domestic_per_year", e.target.value, 50, true)}
            aria-label="Number of domestic flights taken per year"
          />
        </div>

        {/* International Flights */}
        <div className="form-group">
          <label className="label" htmlFor="flights_intl">Intl Flights / Year</label>
          <input
            id="flights_intl"
            className="input"
            type="number"
            min="0"
            max="50"
            step="1"
            value={profile.flights_international_per_year ?? 0}
            onChange={(e) => setNum("flights_international_per_year", e.target.value, 50, true)}
            aria-label="Number of international flights taken per year"
          />
        </div>

        {/* Diet */}
        <div className="form-group">
          <label className="label" htmlFor="diet_type">Diet</label>
          <select
            id="diet_type"
            className="input select"
            value={profile.diet_type}
            onChange={(e) => set("diet_type", e.target.value as LifestyleProfile["diet_type"])}
            aria-label="Dietary lifestyle"
          >
            <option value="vegan">🌱 Vegan</option>
            <option value="veg">🥗 Vegetarian</option>
            <option value="eggetarian">🥚 Eggetarian</option>
            <option value="non-veg">🍗 Non-Veg</option>
          </select>
        </div>

        {/* Eating out */}
        <div className="form-group">
          <label className="label" htmlFor="eating_out">Eating Out / Week</label>
          <input
            id="eating_out"
            className="input"
            type="number"
            min="0"
            max="21"
            step="1"
            value={profile.eating_out_per_week}
            onChange={(e) => setNum("eating_out_per_week", e.target.value, 21, true)}
            aria-label="Number of times eating out per week"
          />
        </div>

        {/* Electricity */}
        <div className="form-group">
          <label className="label" htmlFor="electricity">Electricity (kWh/month)</label>
          <input
            id="electricity"
            className="input"
            type="number"
            min="0"
            max="2000"
            step="10"
            value={profile.electricity_kwh_per_month}
            onChange={(e) => setNum("electricity_kwh_per_month", e.target.value, 2000, false)}
            aria-label="Monthly electricity consumption in kilowatt hours"
          />
        </div>

        {/* AC hours */}
        <div className="form-group">
          <label className="label" htmlFor="ac_hours">AC Hours / Day</label>
          <input
            id="ac_hours"
            className="input"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={profile.ac_hours_per_day}
            onChange={(e) => setNum("ac_hours_per_day", e.target.value, 24, false)}
            aria-label="Average air conditioning operation hours per day"
          />
        </div>

        {/* LPG cylinders */}
        <div className="form-group">
          <label className="label" htmlFor="lpg">LPG Cylinders / Month</label>
          <input
            id="lpg"
            className="input"
            type="number"
            min="0"
            max="4"
            step="0.1"
            value={profile.lpg_cylinders_per_month}
            onChange={(e) => setNum("lpg_cylinders_per_month", e.target.value, 4, false)}
            aria-label="LPG Cylinders consumed per month"
          />
        </div>

        {/* Clothes */}
        <div className="form-group">
          <label className="label" htmlFor="clothes">New Clothes / Year</label>
          <input
            id="clothes"
            className="input"
            type="number"
            min="0"
            max="100"
            step="1"
            value={profile.new_clothes_per_year}
            onChange={(e) => setNum("new_clothes_per_year", e.target.value, 100, true)}
            aria-label="New clothing items purchased per year"
          />
        </div>

        {/* Electronics */}
        <div className="form-group">
          <label className="label" htmlFor="electronics">Electronics / Year</label>
          <input
            id="electronics"
            className="input"
            type="number"
            min="0"
            max="20"
            step="1"
            value={profile.electronics_per_year}
            onChange={(e) => setNum("electronics_per_year", e.target.value, 20, true)}
            aria-label="Electronics items purchased per year"
          />
        </div>

        {/* Renewable percent */}
        <div className="form-group">
          <label className="label" htmlFor="renewable">Renewable Energy %</label>
          <input
            id="renewable"
            className="input"
            type="number"
            min="0"
            max="100"
            step="5"
            value={profile.renewable_percent}
            onChange={(e) => setNum("renewable_percent", e.target.value, 100, false)}
            aria-label="Percentage of energy sourced from renewable systems"
          />
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={loading}
          id="calculate-btn"
          aria-label="Calculate Carbon Footprint"
        >
          {loading ? <span className="spinner" /> : "🌿 Calculate Footprint"}
        </button>
      </div>
    </div>
  );
}
