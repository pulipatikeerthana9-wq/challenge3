"use client";

import { useState } from "react";
import { fetchSimulate } from "@/lib/api";
import type { LifestyleProfile, SimulateResult } from "@/types";

interface Props {
  profile: LifestyleProfile;
}

const SUGGESTIONS = [
  "What if I switch to metro?",
  "What if I go vegetarian?",
  "What if I use solar energy?",
  "What if I bike to work?",
  "What if I stop using AC?",
  "What if I work from home?",
];

export default function WhatIfSimulator({ profile }: Props) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "force-ai" | "force-local">("auto");

  const handleSimulate = async (text?: string) => {
    const whatIf = text ?? query;
    if (!whatIf.trim()) return;
    setQuery(whatIf);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetchSimulate(whatIf, profile, mode);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      const msg = (err as Error)?.message || "Failed to connect to the simulation server. Please try again.";
      setError(msg.includes("Rate limited") ? msg : "Failed to connect to the simulation server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-up fade-up-3" id="what-if-simulator" role="region" aria-labelledby="simulator-title">
      <div className="card-title" id="simulator-title">🔮 What-If Simulator</div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          placeholder="e.g., What if I switch to metro?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSimulate()}
          disabled={loading}
          id="what-if-input"
          aria-label="Lifestyle scenario simulation query"
        />
        <button
          className="btn btn-primary"
          onClick={() => handleSimulate()}
          disabled={loading || !query.trim()}
          id="what-if-submit"
          style={{ whiteSpace: "nowrap" }}
          aria-label="Submit simulation query"
        >
          {loading ? <span className="spinner" /> : "Simulate"}
        </button>
        <select
          aria-label="Force parser mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          style={{ marginLeft: 8, padding: '6px 8px' }}
          disabled={loading}
          title="Force AI or Local parsing for demos"
        >
          <option value="auto">Auto</option>
          <option value="force-local">Force Local</option>
          <option value="force-ai">Force AI</option>
        </select>
      </div>

      {/* Quick suggestions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }} role="group" aria-label="Quick scenario ideas">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="btn btn-ghost"
            style={{ fontSize: "0.78rem", padding: "5px 12px" }}
            onClick={() => handleSimulate(s)}
            disabled={loading}
            aria-label={`Simulate: ${s}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="fade-up"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            marginBottom: 16,
            color: "var(--red)",
            fontSize: "0.88rem",
          }}
          role="alert"
        >
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="fade-up"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius-md)",
            padding: 20,
          }}
        >
          {/* Delta pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              className={result.delta_kg_annual < 0 ? "delta-positive" : "delta-negative"}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.6rem",
                fontWeight: 700,
              }}
            >
              {result.delta_kg_annual < 0 ? "↓" : "↑"}{" "}
              {Math.abs(result.delta_kg_annual).toLocaleString()} kg
            </span>
            <span
              className={`tag ${result.delta_kg_annual < 0 ? "tag-green" : "tag-red"}`}
            >
              {result.percent_change > 0 ? "+" : ""}
              {result.percent_change}%
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              New total: {result.new_total.toLocaleString()} kg/yr
            </span>
          </div>

          {/* Explanation */}
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
