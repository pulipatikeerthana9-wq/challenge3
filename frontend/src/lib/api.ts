// Frontend fetch helpers — all calls go through Next.js API routes

import type { LifestyleProfile, FootprintBreakdown, SimulateResult } from "@/types";

const BASE = ""; // Same-origin: Next.js API routes at /api/*

export async function fetchFootprint(
  profile: LifestyleProfile
): Promise<FootprintBreakdown> {
  const res = await fetch(`${BASE}/api/footprint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    if (res.status === 429) {
      const ra = res.headers.get("retry-after") || "60";
      throw new Error(`Rate limited. Retry after ${ra}s`);
    }
    throw new Error("Footprint API failed");
  }
  return res.json();
}

export async function fetchSimulate(
  whatIfText: string,
  profile: LifestyleProfile
  , mode: "auto" | "force-ai" | "force-local" = "auto"
): Promise<SimulateResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (mode === "force-local") headers["x-force-mode"] = "local";
  if (mode === "force-ai") headers["x-force-mode"] = "ai";

  const res = await fetch(`${BASE}/api/simulate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ what_if_text: whatIfText, current_profile: profile }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      const ra = res.headers.get("retry-after") || "60";
      throw new Error(`Rate limited. Retry after ${ra}s`);
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || "Simulate API failed");
  }
  return res.json();
}
