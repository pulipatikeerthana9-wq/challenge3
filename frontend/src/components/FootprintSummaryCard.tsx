"use client";

import type { FootprintBreakdown } from "@/types";

interface Props {
  data: FootprintBreakdown | null;
  loading: boolean;
}

const CATEGORIES = [
  { key: "transport", label: "Transport", icon: "🚗", color: "#f59e0b" },
  { key: "diet",      label: "Diet",      icon: "🥗", color: "#22c55e" },
  { key: "energy",    label: "Energy",     icon: "⚡", color: "#3b82f6" },
  { key: "shopping",  label: "Shopping",   icon: "🛍️", color: "#a855f7" },
] as const;

export default function FootprintSummaryCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="card glow-green fade-up" id="footprint-summary">
        <div className="card-title">🌍 Your Carbon Footprint</div>
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const max = Math.max(data.transport, data.diet, data.energy, data.shopping, 1);

  return (
    <div className="card glow-green fade-up" id="footprint-summary">
      <div className="card-title">🌍 Your Carbon Footprint</div>

      {/* Big number */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="stat-value">{data.total.toLocaleString()}</div>
        <div className="stat-unit">kg CO₂e / year</div>
      </div>

      {/* Equivalents row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <div className="info-chip">
          <span className="icon">🌳</span>
          <span>≈ {data.trees_equivalent} trees needed</span>
        </div>
        <div className="info-chip">
          <span className="icon">🚗</span>
          <span>≈ {data.car_km_equivalent.toLocaleString()} km driven</span>
        </div>
      </div>

      {/* Category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CATEGORIES.map(({ key, label, icon, color }) => {
          const value = data[key as keyof FootprintBreakdown] as number;
          const pct = (value / max) * 100;
          return (
            <div key={key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {icon} {label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {value.toLocaleString()} kg
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
