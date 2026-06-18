import { NextResponse } from "next/server";
import { calculateFootprint, parseWhatIf, applyChanges } from "@/lib/calculator";
import type { LifestyleProfile } from "@/types";

interface SimulateRequest {
  what_if_text: string;
  current_profile: LifestyleProfile;
}

import { isRateLimited } from "@/lib/rateLimiter";

export async function POST(req: Request) {
  // 1. Rate limiting check
  const ip = req.headers.get("x-forwarded-for") || "local-client";
  if (await isRateLimited(ip, "simulate", 60, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down. (Rate limit: 60/min)" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body: SimulateRequest = await req.json();
    const { what_if_text, current_profile } = body;

    // 2. Strict Input Validations
    if (!what_if_text || typeof what_if_text !== "string" || what_if_text.trim() === "") {
      return NextResponse.json({ error: "Missing or invalid 'what_if_text' parameter." }, { status: 400 });
    }
    if (!current_profile || typeof current_profile !== "object") {
      return NextResponse.json({ error: "Missing or invalid 'current_profile' parameter." }, { status: 400 });
    }

    let changes: Partial<LifestyleProfile> = {};
    let isAiParsed = false;

    // Respect client mode header: 'local' to force local parser, 'ai' to prefer AI
    const forceMode = req.headers.get("x-force-mode");
    const apiKey = process.env.GEMINI_API_KEY;
    const useAi = apiKey && forceMode !== "local";
    if (forceMode === "ai" && !apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured for AI mode." }, { status: 400 });
    }

    // 3. Optional integration with Gemini Developer API for AI-powered Parsing
    if (useAi) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Analyze the user's lifestyle modification description: "${what_if_text}".
Return a JSON block containing ONLY the fields that change. Use these exact key names:
commute_mode (values: 'bike'|'metro'|'car'|'bus'|'wfh')
commute_km_per_day (float)
flights_domestic_per_year (int)
flights_international_per_year (int)
car_fuel_type (values: 'petrol'|'diesel'|'electric'|null)
diet_type (values: 'vegan'|'veg'|'eggetarian'|'non-veg')
eating_out_per_week (int)
electricity_kwh_per_month (float)
lpg_cylinders_per_month (float)
ac_hours_per_day (float)
renewable_percent (float)
new_clothes_per_year (int)
electronics_per_year (int)

Do not return fields that do not change.
Return ONLY valid JSON without markdown formatting. Example output: {"commute_mode": "metro"}`
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(5000) // 5s timeout safety
        });

        if (response.ok) {
          const resJson = await response.json();
          const textResponse = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          changes = JSON.parse(textResponse.trim());
          isAiParsed = true;
        } else {
          const errText = await response.text().catch(() => "unknown error");
          console.error("Gemini API returned error status:", response.status, errText);
        }
      } catch (geminiErr) {
        console.error("Gemini API call failed, falling back to deterministic NLP parser:", geminiErr);
      }
    }

    // Fall back to local NLP parser if Gemini isn't available or fails
    if (!isAiParsed) {
      changes = parseWhatIf(what_if_text);
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({
        delta_kg_annual: 0,
        percent_change: 0,
        new_total: calculateFootprint(current_profile).total,
        explanation:
          "I couldn't detect a specific change. Try phrases like 'switch to metro', 'go vegetarian', or 'use solar energy'.",
        breakdown: calculateFootprint(current_profile),
      });
    }

    const original = calculateFootprint(current_profile);
    const newProfile = applyChanges(current_profile, changes);
    const updated = calculateFootprint(newProfile);

    const delta = updated.total - original.total;
    const pct = original.total > 0 ? (delta / original.total) * 100 : 0;

    // Build human-friendly description of changes
    const changeDescriptions: string[] = [];
    if (changes.commute_mode) changeDescriptions.push(`commute → ${changes.commute_mode}`);
    if (changes.diet_type) changeDescriptions.push(`diet → ${changes.diet_type}`);
    if (changes.renewable_percent !== undefined) changeDescriptions.push(`${changes.renewable_percent}% renewable energy`);
    if (changes.ac_hours_per_day !== undefined) changeDescriptions.push(`AC usage → ${changes.ac_hours_per_day}h/day`);
    if (changes.flights_domestic_per_year !== undefined) changeDescriptions.push(`domestic flights → ${changes.flights_domestic_per_year}/year`);
    if (changes.flights_international_per_year !== undefined) changeDescriptions.push(`international flights → ${changes.flights_international_per_year}/year`);

    const savedTrees = Math.abs(Math.round(delta / 21));
    const action = changeDescriptions.length > 0 ? changeDescriptions.join(", ") : "lifestyle changes";

    const aiBadge = isAiParsed ? "🤖 AI-Parsed: " : "⚡ NLP-Parsed: ";
    const explanation =
      delta < 0
        ? `${aiBadge}With ${action}, you'd save ${Math.abs(Math.round(delta))} kg CO₂e/year — like planting ${savedTrees} trees! 🌱`
        : `${aiBadge}With ${action}, your footprint would increase by ${Math.round(Math.abs(delta))} kg CO₂e/year.`;

    return NextResponse.json({
      delta_kg_annual: Math.round(delta * 10) / 10,
      percent_change: Math.round(pct * 10) / 10,
      new_total: updated.total,
      explanation,
      breakdown: updated,
    });
  } catch (err) {
    console.error("/api/simulate error:", err);
    return NextResponse.json({ error: "Invalid request body or malformed payload." }, { status: 400 });
  }
}
