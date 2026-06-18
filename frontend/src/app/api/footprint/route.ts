import { NextResponse } from "next/server";
import { calculateFootprint } from "@/lib/calculator";
import type { LifestyleProfile } from "@/types";

import { isRateLimited } from "@/lib/rateLimiter";

export async function POST(req: Request) {
  // 1. Rate limiting check
  const ip = req.headers.get("x-forwarded-for") || "local-client";
  if (await isRateLimited(ip, "footprint", 100, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const rawProfile = await req.json();

    // 2. Schema Integrity Checks & Input Sanitization
    if (!rawProfile || typeof rawProfile !== "object") {
      return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
    }

    const sanitizeNum = (val: any, fallback: number = 0) => {
      const num = Number(val);
      return isNaN(num) || num < 0 ? fallback : num;
    };

    const sanitizedProfile: LifestyleProfile = {
      commute_mode: ["bike", "metro", "car", "bus", "wfh"].includes(rawProfile.commute_mode)
        ? rawProfile.commute_mode
        : "bus",
      commute_km_per_day: Math.min(200, sanitizeNum(rawProfile.commute_km_per_day, 10)),
      flights_domestic_per_year: Math.min(50, sanitizeNum(rawProfile.flights_domestic_per_year, 0)),
      flights_international_per_year: Math.min(50, sanitizeNum(rawProfile.flights_international_per_year, 0)),
      car_fuel_type: ["petrol", "diesel", "electric", null].includes(rawProfile.car_fuel_type)
        ? rawProfile.car_fuel_type
        : null,
      diet_type: ["vegan", "veg", "eggetarian", "non-veg"].includes(rawProfile.diet_type)
        ? rawProfile.diet_type
        : "veg",
      eating_out_per_week: Math.min(21, sanitizeNum(rawProfile.eating_out_per_week, 2)),
      electricity_kwh_per_month: Math.min(2000, sanitizeNum(rawProfile.electricity_kwh_per_month, 150)),
      lpg_cylinders_per_month: Math.min(4, sanitizeNum(rawProfile.lpg_cylinders_per_month, 0.5)),
      ac_hours_per_day: Math.min(24, sanitizeNum(rawProfile.ac_hours_per_day, 2)),
      renewable_percent: Math.min(100, sanitizeNum(rawProfile.renewable_percent, 0)),
      new_clothes_per_year: Math.min(100, sanitizeNum(rawProfile.new_clothes_per_year, 10)),
      electronics_per_year: Math.min(20, sanitizeNum(rawProfile.electronics_per_year, 1)),
    };

    const result = calculateFootprint(sanitizedProfile);
    return NextResponse.json(result);
  } catch (err) {
    console.error("/api/footprint error:", err);
    return NextResponse.json({ error: "Malformed request payload." }, { status: 400 });
  }
}
