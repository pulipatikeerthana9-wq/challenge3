"use client";

import type { CarbonTwin } from "@/types";
import { INDIA_AVG_KG } from "@/lib/constants";

interface Props {
  data: CarbonTwin | null;
}

const TIERS = [
  { key: "current",  label: "You Now",        icon: "🔴", color: "#ef4444" },
  { key: "improved", label: "With Changes",   icon: "🟡", color: "#f59e0b" },
  { key: "future",   label: "2-Year Goal",    icon: "🟢", color: "#22c55e" },
] as const;

export default function CarbonTwinCard({ data }: Props) {
  if (!data) return null;

  const max = Math.max(data.current, INDIA_AVG_KG) * 1.15;

  return (
    <div className="card fade-up fade-up-1" id="carbon-twin">
      <div className="card-title">🪞 Your Carbon Twin</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {TIERS.map(({ key, label, icon, color }) => {
          const value = data[key as keyof CarbonTwin];
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
                    fontSize: "0.95rem",
                    color,
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

        {/* India average reference */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <span
            style={{
              width: 16,
              height: 1,
              background: "var(--text-muted)",
              display: "inline-block",
            }}
          />
          India avg: {INDIA_AVG_KG.toLocaleString()} kg CO₂e/year
        </div>
      </div>
    </div>
  );
}
