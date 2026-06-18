import { NextResponse } from "next/server";
import type { LifestyleProfile, FootprintBreakdown } from "@/types";
import { isRateLimited } from "@/lib/rateLimiter";

interface CoachRequest {
  profile: LifestyleProfile;
  breakdown: FootprintBreakdown;
}
// Rate limiting handled by shared `isRateLimited` util (Redis optional)

export async function POST(req: Request) {
  // Rate limit by IP to avoid accidental Gemini quota burn
  const ip = req.headers.get("x-forwarded-for") || "local-client";
  if (await isRateLimited(ip, "coach", 60, 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down. (Rate limit: 60/min)" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const reqBody = (await req.json()) as CoachRequest | any;
    const profile = reqBody?.profile;
    const breakdown = reqBody?.breakdown;

    if (!profile || typeof profile !== "object" || !breakdown || typeof breakdown !== "object") {
      return NextResponse.json({ error: "Missing or invalid required parameters." }, { status: 400 });
    }

    // Respect client mode header: 'local' to force local coach, 'ai' to prefer AI
    const forceMode = req.headers.get("x-force-mode");
    const apiKey = process.env.GEMINI_API_KEY;
    const useAi = apiKey && forceMode !== "local";
    if (forceMode === "ai" && !apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured for AI mode." }, { status: 400 });
    }

    // Fallback recommendations if Gemini Key is not configured
    const getFallbackInsights = () => {
      // Find highest emission category to give targeted advice
      const categories = [
        { name: "Transport", value: breakdown.transport, tip: "Try switching to the metro, sharing rides, or cycling for short trips under 5 km." },
        { name: "Diet", value: breakdown.diet, tip: "Try incorporating vegetarian meals (like dals and paneer) or replacing dairy with plant options." },
        { name: "Energy", value: breakdown.energy, tip: "Consider setting your AC to 24°C instead of 18°C, and turning off appliances at the wall." },
        { name: "Shopping", value: breakdown.shopping, tip: "Try a clothes shopping ban for 3 months, or choose refurbished electronics." }
      ];
      categories.sort((a, b) => b.value - a.value);
      const primaryCategory = categories[0];

      return {
        isAi: false,
        analogy: `Your yearly carbon footprint of ${breakdown.total.toLocaleString()} kg CO₂e is roughly equal to driving a petrol car for ${breakdown.car_km_equivalent.toLocaleString()} km.`,
        tips: [
          { title: `Optimize ${primaryCategory.name}`, desc: primaryCategory.tip },
          { title: "Monitor Vampire Power", desc: "Unplug chargers and laptops when not in use to save up to 10% on energy." },
          { title: "Reduce Cooking Gas", desc: "Cover pots with lids while boiling food to save LPG cooking cylinders." }
        ]
      };
    };

    if (!useAi) {
      return NextResponse.json(getFallbackInsights());
    }

    // Call Google Gemini Developer API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze the user's carbon footprint and generate a customized carbon coach plan.
User Profile: ${JSON.stringify(profile)}
Calculated Emissions (kg CO2e/year):
- Transport: ${breakdown.transport}
- Diet: ${breakdown.diet}
- Energy: ${breakdown.energy}
- Shopping: ${breakdown.shopping}
- Total Annual: ${breakdown.total}

Generate a JSON block with these exact keys:
1. "analogy": A teenager-friendly, encouraging comparison explaining their footprint under 50 words (e.g. comparing to burger counts, phone charging cycles, or driving segments between Indian cities).
2. "tips": An array of exactly 3 customized mitigation tips. Each tip must be an object with "title" (short action) and "desc" (1-2 sentence encouraging tip). Focus on localized actions matching the Indian context (e.g., BRTS buses, local trains, induction cookers, dal meals, setting AC to 24°C).

Return ONLY the JSON payload, no markdown fences.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return NextResponse.json(getFallbackInsights());
    }

    const resJson = await response.json();
    const textResponse = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(textResponse.trim());

    return NextResponse.json({
      isAi: true,
      analogy: parsed.analogy,
      tips: parsed.tips
    });

  } catch (err) {
    console.error("/api/coach error:", err);
    return NextResponse.json({ error: "Failed to generate AI insights." }, { status: 500 });
  }
}
