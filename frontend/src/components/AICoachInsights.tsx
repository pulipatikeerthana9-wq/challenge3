"use client";

import { useState, useEffect } from "react";
import type { LifestyleProfile, FootprintBreakdown } from "@/types";
import { estimateTipSavings } from "@/lib/calculator";

interface Props {
  profile: LifestyleProfile;
  breakdown: FootprintBreakdown;
}

interface CoachInsight {
  isAi: boolean;
  analogy: string;
  tips: Array<{ title: string; desc: string }>;
}

export default function AICoachInsights({ profile, breakdown }: Props) {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "force-ai" | "force-local">("auto");

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (mode === "force-local") headers["x-force-mode"] = "local";
      if (mode === "force-ai") headers["x-force-mode"] = "ai";

      const res = await fetch("/api/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({ profile, breakdown }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      } else {
        if (res.status === 429) {
          const ra = res.headers.get("retry-after") || "60";
          setError(`Rate limited. Retry after ${ra}s`);
        } else {
          const text = await res.text().catch(() => null);
          setError(text || "Failed to generate coach advice.");
        }
      }
    } catch {
      setError("Network error generating advice.");
    } finally {
      setLoading(false);
    }
  };

  // fetch on mount and whenever the mode changes
  useEffect(() => {
    fetchInsights();
  }, [profile, breakdown, mode]);

  if (loading) {
    return (
      <div className="card fade-up" style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="spinner" style={{ marginBottom: 12 }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>EcoPilot AI is analyzing your footprint...</div>
        </div>
      </div>
    );
  }

  // control UI for mode and refresh
  const controlBar = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <select aria-label="Coach parser mode" value={mode} onChange={(e) => setMode(e.target.value as any)} disabled={loading}>
        <option value="auto">Auto</option>
        <option value="force-local">Force Local</option>
        <option value="force-ai">Force AI</option>
      </select>
      <button className="btn btn-ghost" onClick={() => { setInsight(null); setError(null); fetchInsights(); }} disabled={loading}>Refresh</button>
      {error && <span style={{ color: 'var(--red)', marginLeft: 8 }}>{error}</span>}
    </div>
  );

  if (error || !insight) return (
    <div>
      {controlBar}
      {error ? <div style={{ color: 'var(--red)' }}>{error}</div> : null}
    </div>
  );

  return (
    <div className="card glow-green fade-up" id="ai-coach-insights" style={{ background: "rgba(34,197,94,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="card-title" style={{ margin: 0 }}>🧠 AI Carbon Coach Insights</div>
        <span className={`tag ${insight.isAi ? "tag-green" : "tag-amber"}`}>
          {insight.isAi ? "🤖 AI-Insights" : "⚡ Local-Fallback"}
        </span>
      </div>

      {/* Relatable Analogy */}
      <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 20, fontStyle: "italic" }}>
        "{insight.analogy}"
      </p>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
          💡 Personalized Action Plan:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {insight.tips.map((tip, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ background: "rgba(34,197,94,0.1)", color: "var(--green-400)", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                {idx + 1}
              </span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600, marginBottom: 2 }}>
                    {tip.title}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(() => {
                      try {
                        const kg = estimateTipSavings(profile, tip.title);
                        return kg > 0 ? `≈ ${kg.toLocaleString()} kg/year saved` : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
