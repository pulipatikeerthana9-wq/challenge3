"use client";

import { useEffect, useState } from "react";
import type { FootprintBreakdown } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: FootprintBreakdown | null;
}

const COLORS = [
  { key: "transport", label: "Transport", color: "#f59e0b" },
  { key: "diet",      label: "Diet",      color: "#22c55e" },
  { key: "energy",    label: "Energy",     color: "#3b82f6" },
  { key: "shopping",  label: "Shopping",   color: "#a855f7" },
];

export default function BreakdownChart({ data }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data) return null;

  const chartData = COLORS.map(({ key, label }) => ({
    name: label,
    value: data[key as keyof FootprintBreakdown] as number,
  }));

  return (
    <div className="card fade-up fade-up-2" id="breakdown-chart">
      <div className="card-title">📊 Emission Breakdown</div>
      <div style={{ width: "100%", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!isMounted ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading breakdown...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell key={COLORS[i].key} fill={COLORS[i].color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0f1a12",
                  border: "1px solid rgba(52,211,100,0.2)",
                  borderRadius: 10,
                  fontSize: "0.82rem",
                  color: "#f0fdf4",
                }}
                formatter={(value: number) => [`${value.toLocaleString()} kg`, ""]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: "#86efac", fontSize: "0.8rem" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
