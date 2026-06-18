"use client";

import { useState, useCallback } from "react";
import { fetchFootprint } from "@/lib/api";
import { DEFAULT_PROFILE } from "@/types";
import type { LifestyleProfile, FootprintBreakdown, CarbonTwin } from "@/types";

import FootprintSummaryCard from "@/components/FootprintSummaryCard";
import CarbonTwinCard from "@/components/CarbonTwinCard";
import BreakdownChart from "@/components/BreakdownChart";
import LifestyleForm from "@/components/LifestyleForm";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import AICoachInsights from "@/components/AICoachInsights";

export default function Home() {
  const [profile, setProfile] = useState<LifestyleProfile>({ ...DEFAULT_PROFILE });
  const [footprint, setFootprint] = useState<FootprintBreakdown | null>(null);
  const [twin, setTwin] = useState<CarbonTwin | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFootprint(profile);
      if ((result as any).error) {
        setError((result as any).error);
      } else {
        setFootprint(result);
        setTwin({
          current: result.total,
          improved: Math.round(result.total * 0.8 * 10) / 10,
          future: Math.round(result.total * 0.8 * 0.85 * 10) / 10,
        });
        setCalculated(true);
      }
    } catch (err) {
      setError("Failed to calculate carbon footprint. Please verify inputs and try again.");
      console.error("Calculation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return (
    <div className="page-wrapper">
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="nav" id="main-nav">
        <div className="nav-logo">
          <span className="leaf">🌿</span>
          <span>EcoPilot</span>
        </div>
        <span className="nav-badge">Carbon Coach AI</span>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero" id="hero">
        <div className="hero-eyebrow">
          <span>🌍</span> PromptWars Challenge 3
        </div>
        <h1>
          Know Your <span className="highlight">Carbon Footprint</span>
        </h1>
        <p className="hero-sub">
          Input your lifestyle, see your CO₂ impact, and explore what-if scenarios to reduce your footprint.
        </p>
        {!calculated && (
          <a
            href="#lifestyle-form"
            className="btn btn-primary"
            style={{ fontSize: "1rem", padding: "14px 32px" }}
          >
            🚀 Get Started
          </a>
        )}
      </section>

      <div className="container">
        {/* Error banner */}
        {error && (
          <div
            className="fade-up animate-error"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 20,
              color: "var(--red)",
              fontSize: "0.9rem",
              textAlign: "center"
            }}
            role="alert"
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── Lifestyle Form ────────────────────────────────────────────── */}
        <section className="section" id="input-section">
          <LifestyleForm
            profile={profile}
            onChange={setProfile}
            onSubmit={handleCalculate}
            loading={loading}
          />
        </section>

        {/* ── Results (shown after calculation) ─────────────────────────── */}
        {calculated && (
          <>
            <hr className="divider" />

            <section className="section" id="results-section">
              <div className="section-header">
                <h2 className="section-title">📊 Your Results</h2>
                <span className="tag tag-green">
                  🌿 Calculated
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                <FootprintSummaryCard data={footprint} loading={loading} />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <CarbonTwinCard data={twin} />
                  <BreakdownChart data={footprint} />
                </div>
              </div>

              {/* AI Carbon Coach Insights */}
              {footprint && (
                <div style={{ marginTop: 20 }}>
                  <AICoachInsights profile={profile} breakdown={footprint} />
                </div>
              )}
            </section>

            <hr className="divider" />

            {/* ── What-If Simulator ──────────────────────────────────────── */}
            <section className="section" id="simulator-section">
              <WhatIfSimulator profile={profile} />
            </section>

            {/* ── Quick Tips ────────────────────────────────────────────── */}
            <section className="section fade-up fade-up-4" id="tips-section">
              <div className="card" style={{ textAlign: "center" }}>
                <div className="card-title">💡 Quick Impact Tips</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  {[
                    {
                      icon: "🚇",
                      title: "Switch to Metro",
                      desc: "Save up to 500+ kg CO₂e/year",
                    },
                    {
                      icon: "🥗",
                      title: "Go Vegetarian",
                      desc: "Cut diet emissions by ~40%",
                    },
                    {
                      icon: "☀️",
                      title: "Use Solar Energy",
                      desc: "Reduce energy footprint by 50%",
                    },
                  ].map((tip) => (
                    <div
                      key={tip.title}
                      style={{
                        padding: 20,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(34,197,94,0.04)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>{tip.icon}</div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          marginBottom: 4,
                          color: "var(--text-primary)",
                        }}
                      >
                        {tip.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {tip.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          style={{
            textAlign: "center",
            padding: "40px 0 24px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border)",
            marginTop: 32,
          }}
          id="footer"
        >
          <p>
            🌿 EcoPilot — Carbon Coach AI • Emission factors sourced from IPCC
            &amp; India CEA 2023
          </p>
          <p style={{ marginTop: 4 }}>
            Built for PromptWars Virtual Challenge 3
          </p>
        </footer>
      </div>

      {/* Responsive override for results grid */}
      <style>{`
        @media (max-width: 768px) {
          #results-section > div {
            grid-template-columns: 1fr !important;
          }
          #tips-section .card > div:last-child {
            grid-template-columns: 1fr !important;
          }
          #lifestyle-form > div:first-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
