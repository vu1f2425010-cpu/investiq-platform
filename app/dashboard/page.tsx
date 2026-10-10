"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MOCK_CAS_DATABASE, CASData } from "@/lib/mockCASDatabase";
import {
  assetAllocation,
  companySectorExposure,
  concentrationAnalysis,
  duplicateDetection,
  diversificationScore,
  riskIndicators,
  portfolioGaps,
  alternativeAssetAnalysis,
  taxAndXIRR,
  hiddenExposure,
  simulateCrash,
} from "@/lib/analyticsEngine";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const COLORS = ["#00D4FF", "#818CF8", "#10B981", "#F59E0B", "#F43F5E", "#38BDF8"];

// ============== Investment Suggestion Types ==============
interface InvestmentSuggestion {
  id: string;
  type: "REIT" | "InvIT" | "Bond";
  name: string;
  issuer: string;
  ticker: string;
  category: string;
  minInvestment: number;
  recommendedAmount: number;
  tenureMonths: number;
  expectedReturnPct: number;
  distributionYield: number;
  riskLevel: "Low" | "Moderate" | "High";
  riskScore: number;
  projectedValue: number;
  totalReturn: number;
  totalReturnPct: number;
  annualIncome: number;
  taxBenefit: string;
  liquidity: "High" | "Moderate" | "Low";
  exchangeListed: boolean;
  rating: string;
  whyRecommended: string;
  keyRisks: string[];
  highlights: string[];
  allocationPct: number;
}

// ============== Investment Panel Component ==============
function InvestmentPanel({
  suggestions,
  loading,
  provider,
  onClose,
  formatINR,
  totalPortfolioValue,
}: {
  suggestions: InvestmentSuggestion[];
  loading: boolean;
  provider: string;
  onClose: () => void;
  formatINR: (n: number) => string;
  totalPortfolioValue: number;
}) {
  const [activeTab, setActiveTab] = useState<"All" | "REIT" | "InvIT" | "Bond">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeTab === "All" ? suggestions : suggestions.filter((s) => s.type === activeTab);

  const totalRecommendedInvest = suggestions.reduce((sum, s) => sum + (s.recommendedAmount || 0), 0);
  const totalProjectedReturn = suggestions.reduce((sum, s) => sum + (s.totalReturn || 0), 0);
  const avgYield = suggestions.length > 0
    ? (suggestions.reduce((sum, s) => sum + s.distributionYield, 0) / suggestions.length).toFixed(1)
    : "0";

  const tabActiveClass = (tab: string) => {
    if (tab === activeTab) {
      if (tab === "REIT") return "invest-tab active-reit";
      if (tab === "InvIT") return "invest-tab active-invit";
      if (tab === "Bond") return "invest-tab active-bond";
      return "invest-tab active-all";
    }
    return "invest-tab";
  };

  const riskDotClass = (level: string) => {
    if (level === "Low") return "risk-dot risk-low";
    if (level === "High") return "risk-dot risk-high";
    return "risk-dot risk-moderate";
  };

  const typeColorMap: Record<string, string> = {
    REIT: "var(--accent-teal)",
    InvIT: "var(--accent-purple)",
    Bond: "var(--accent-emerald)",
  };

  const tenureLabel = (months: number) => {
    if (months < 12) return `${months} months`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}yr ${m}mo` : `${y} year${y > 1 ? "s" : ""}`;
  };

  return (
    <div className="invest-panel-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="invest-panel">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <div className="section-label" style={{ color: "var(--accent-amber)" }}>GROQ AI · INVESTMENT INTELLIGENCE</div>
            <h2 style={{ fontSize: "26px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.5px", marginTop: "4px" }}>
              💰 Smart Investment Suggestions
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px", fontWeight: 500 }}>
              Personalized REITs · InvITs · Bonds — curated by Groq AI based on your portfolio
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-teal)", background: "rgba(0,212,255,0.12)", border: "1px solid var(--border-bright)", padding: "4px 12px", borderRadius: "6px" }}>
              ⚡ {provider}
            </span>
            <button
              onClick={onClose}
              style={{ background: "var(--bg-card-subtle)", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", color: "var(--text-secondary)", fontSize: "14px", fontWeight: 700 }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        {!loading && suggestions.length > 0 && (
          <div className="invest-summary-banner" style={{ marginBottom: "24px" }}>
            <div className="invest-summary-stat">
              <div className="invest-summary-stat-label">Total Suggested Allocation</div>
              <div className="invest-summary-stat-value">{formatINR(totalRecommendedInvest)}</div>
            </div>
            <div style={{ width: "1px", height: "36px", background: "var(--border)" }} />
            <div className="invest-summary-stat">
              <div className="invest-summary-stat-label">Projected Additional Returns</div>
              <div className="invest-summary-stat-value" style={{ color: "var(--accent-emerald)" }}>{formatINR(totalProjectedReturn)}</div>
            </div>
            <div style={{ width: "1px", height: "36px", background: "var(--border)" }} />
            <div className="invest-summary-stat">
              <div className="invest-summary-stat-label">Avg. Distribution Yield</div>
              <div className="invest-summary-stat-value" style={{ color: "var(--accent-purple)" }}>{avgYield}% p.a.</div>
            </div>
            <div style={{ width: "1px", height: "36px", background: "var(--border)" }} />
            <div className="invest-summary-stat">
              <div className="invest-summary-stat-label">Portfolio Allocation</div>
              <div className="invest-summary-stat-value" style={{ color: "var(--accent-sky)" }}>
                {totalPortfolioValue > 0 ? ((totalRecommendedInvest / totalPortfolioValue) * 100).toFixed(1) : 0}% of Portfolio
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "4px" }}>INSTRUMENTS</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span className="type-badge reit">🏢 {suggestions.filter(s => s.type === "REIT").length} REITs</span>
                <span className="type-badge invit">⚡ {suggestions.filter(s => s.type === "InvIT").length} InvITs</span>
                <span className="type-badge bond">📄 {suggestions.filter(s => s.type === "Bond").length} Bonds</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="invest-tabs" style={{ marginBottom: "20px" }}>
          {(["All", "REIT", "InvIT", "Bond"] as const).map((tab) => (
            <button key={tab} className={tabActiveClass(tab)} onClick={() => setActiveTab(tab)}>
              {tab === "All" && "🌟 "}{tab === "REIT" && "🏢 "}{tab === "InvIT" && "⚡ "}{tab === "Bond" && "📄 "}
              {tab === "All" ? "All Investments" : tab + "s"}
              {tab !== "All" && (
                <span style={{ marginLeft: "6px", opacity: 0.7 }}>({suggestions.filter(s => s.type === tab).length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ borderRadius: "18px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div className="invest-skeleton" style={{ height: "5px" }} />
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="invest-skeleton" style={{ height: "20px", width: "60%" }} />
                  <div className="invest-skeleton" style={{ height: "14px", width: "40%" }} />
                  <div className="invest-skeleton" style={{ height: "60px" }} />
                  <div className="invest-skeleton" style={{ height: "14px" }} />
                  <div className="invest-skeleton" style={{ height: "14px", width: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Investment Cards */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {filtered.map((s) => {
              const isExpanded = expandedId === s.id;
              const typeClass = s.type.toLowerCase();
              const typeColor = typeColorMap[s.type] || "var(--accent-teal)";
              const returnMeterWidth = Math.min(100, (s.expectedReturnPct / 20) * 100);
              const yieldMeterWidth = Math.min(100, (s.distributionYield / 12) * 100);

              return (
                <div
                  key={s.id}
                  className={`invest-card ${typeClass}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span className={`type-badge ${typeClass}`}>
                          {s.type === "REIT" ? "🏢" : s.type === "InvIT" ? "⚡" : "📄"} {s.type}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>{s.ticker}</span>
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>{s.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px", fontWeight: 500 }}>{s.issuer}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <div style={{ fontSize: "22px", fontWeight: 900, color: typeColor, fontFamily: "var(--font-mono)" }}>
                        {s.expectedReturnPct}%
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>p.a. return</div>
                    </div>
                  </div>

                  {/* Return Meter */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Expected Annual Return</span>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: typeColor }}>{s.expectedReturnPct}%</span>
                    </div>
                    <div className="return-meter">
                      <div
                        className="return-meter-fill"
                        style={{ width: `${returnMeterWidth}%`, background: `linear-gradient(90deg, ${typeColor}, ${typeColor}88)` }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Distribution Yield</span>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-amber)" }}>{s.distributionYield}%</span>
                    </div>
                    <div className="return-meter">
                      <div
                        className="return-meter-fill"
                        style={{ width: `${yieldMeterWidth}%`, background: "linear-gradient(90deg, var(--accent-amber), var(--accent-rose))" }}
                      />
                    </div>
                  </div>

                  {/* Key Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ background: "var(--bg-card-subtle)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>RECOMMENDED</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: typeColor, fontFamily: "var(--font-mono)" }}>{formatINR(s.recommendedAmount)}</div>
                    </div>
                    <div style={{ background: "var(--bg-card-subtle)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>TENURE</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{tenureLabel(s.tenureMonths)}</div>
                    </div>
                    <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--accent-emerald)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>PROJECTED VALUE</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>{formatINR(s.projectedValue)}</div>
                    </div>
                    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--accent-amber)", fontWeight: 700, letterSpacing: "1px", marginBottom: "4px" }}>TOTAL RETURN</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>+{formatINR(s.totalReturn)}</div>
                    </div>
                  </div>

                  {/* Risk & Rating Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className={riskDotClass(s.riskLevel)} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>{s.riskLevel} Risk</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-card-subtle)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "5px" }}>
                        {s.rating}
                      </span>
                      {s.exchangeListed && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-emerald)", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", padding: "2px 8px", borderRadius: "5px" }}>
                          NSE Listed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Calculation Box */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "12px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "6px" }}>📐 CALCULATION</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                      <span style={{ color: typeColor }}>{formatINR(s.recommendedAmount)}</span>
                      <span style={{ color: "var(--text-muted)" }}> × (1 + </span>
                      <span style={{ color: "var(--accent-amber)" }}>{s.expectedReturnPct}%</span>
                      <span style={{ color: "var(--text-muted)" }}>) ^ </span>
                      <span style={{ color: "var(--accent-purple)" }}>{(s.tenureMonths / 12).toFixed(1)}yr</span>
                      <br />
                      <span style={{ color: "var(--text-muted)" }}>= </span>
                      <span style={{ color: "var(--accent-emerald)", fontWeight: 800 }}>{formatINR(s.projectedValue)}</span>
                      <span style={{ color: "var(--text-muted)" }}> | Gain: </span>
                      <span style={{ color: "var(--accent-amber)", fontWeight: 800 }}>+{s.totalReturnPct}%</span>
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--accent-sky)" }}>
                      Annual Income: <strong>{formatINR(s.annualIncome)}/yr</strong>
                    </div>
                  </div>

                  {/* Tax Benefit */}
                  <div
                    style={{
                      background: "rgba(129,140,248,0.08)",
                      border: "1px solid rgba(129,140,248,0.2)",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                      fontSize: "12px",
                      color: "var(--accent-purple)",
                      fontWeight: 600,
                    }}
                  >
                    🏷️ Tax: {s.taxBenefit}
                  </div>

                  {/* Expand/Collapse */}
                  <button
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: `1px solid ${typeColor}40`,
                      borderRadius: "8px",
                      padding: "8px",
                      color: typeColor,
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : s.id);
                    }}
                  >
                    {isExpanded ? "▲ Hide Details" : "▼ See Full Details, Risks & Highlights"}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px", animation: "pageEnter 0.2s ease" }}>
                      {/* Why Recommended */}
                      <div style={{ background: "var(--bg-card-subtle)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: typeColor, letterSpacing: "1px", marginBottom: "6px" }}>💡 WHY RECOMMENDED</div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, fontWeight: 500 }}>{s.whyRecommended}</p>
                      </div>

                      {/* Detailed Stats */}
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px" }}>📊 FULL STATS</div>
                        {[
                          { label: "Min. Investment", value: formatINR(s.minInvestment) },
                          { label: "Recommended Amount", value: formatINR(s.recommendedAmount) },
                          { label: "Tenure", value: tenureLabel(s.tenureMonths) },
                          { label: "Expected Return (p.a.)", value: `${s.expectedReturnPct}% CAGR` },
                          { label: "Distribution Yield", value: `${s.distributionYield}% p.a.` },
                          { label: "Annual Income", value: formatINR(s.annualIncome) },
                          { label: "Projected Corpus", value: formatINR(s.projectedValue) },
                          { label: "Total Return", value: `${formatINR(s.totalReturn)} (+${s.totalReturnPct}%)` },
                          { label: "Risk Score", value: `${s.riskScore}/10 (${s.riskLevel})` },
                          { label: "Liquidity", value: s.liquidity },
                          { label: "Exchange Listed", value: s.exchangeListed ? "Yes (NSE/BSE)" : "No (OTC/Direct)" },
                          { label: "Credit Rating", value: s.rating },
                          { label: "Portfolio Allocation", value: `${s.allocationPct}% of portfolio` },
                        ].map(({ label, value }) => (
                          <div key={label} className="invest-stat-row">
                            <span className="invest-stat-label">{label}</span>
                            <span className="invest-stat-value">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Highlights */}
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-emerald)", letterSpacing: "1px", marginBottom: "8px" }}>✅ HIGHLIGHTS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {s.highlights.map((h, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                              <span style={{ color: "var(--accent-emerald)", fontSize: "16px" }}>●</span> {h}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Key Risks */}
                      <div style={{ background: "var(--card-danger-bg)", border: "1px solid var(--card-danger-border)", borderRadius: "10px", padding: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-rose)", letterSpacing: "1px", marginBottom: "8px" }}>⚠️ KEY RISKS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {s.keyRisks.map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                              <span style={{ color: "var(--accent-rose)", fontSize: "14px" }}>▸</span> {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
            fontSize: "12px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          ⚠️ <strong style={{ color: "var(--accent-amber)" }}>Disclaimer:</strong> Investment suggestions are generated by Groq AI for informational purposes only. Past performance does not guarantee future returns. REITs, InvITs and bonds carry market and credit risks. Please consult a SEBI-registered investment advisor before investing.
        </div>
      </div>
    </div>
  );
}

function TiltCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-2px)`;
  };

  const onMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)";
    }
  };

  return (
    <div
      ref={ref}
      className={`glass-card tilt-card ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        boxShadow: "var(--shadow-card)",
        transition: "transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s",
        ...style,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

function HoverXRay({ scheme, holdings }: { scheme: string; holdings: { name: string; pct: number }[] }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={(e) => {
        setShow(true);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.right + 10, y: rect.top });
      }}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          color: "var(--accent-teal)",
          textDecoration: "underline",
          textDecorationStyle: "dashed",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "13px",
        }}
      >
        {scheme.split(" - ")[0].substring(0, 24)}...
      </span>

      {show && (
        <div
          className="tooltip"
          style={{
            position: "fixed",
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            zIndex: 9999,
            minWidth: "250px",
            background: "var(--bg-card-solid)",
            border: "1px solid var(--border-bright)",
            borderRadius: "12px",
            padding: "14px 16px",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "var(--accent-teal)",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            🔍 X-RAY: TOP UNDERLYING HOLDINGS
          </div>
          {holdings.map((h) => (
            <div
              key={h.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{h.name}</span>
              <span
                className="mono"
                style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-amber)" }}
              >
                {h.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${key}`}
          style={{
            paddingLeft: "20px",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {listItems.map((item, i) => (
            <li key={i} style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.7" }}>
              {renderFormattedText(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      const cleanItem = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
      listItems.push(cleanItem);
    } else {
      flushList(index);
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4
            key={index}
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--accent-teal)",
              marginTop: "18px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {renderFormattedText(trimmed.slice(4))}
          </h4>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <div
            key={index}
            style={{
              marginTop: "20px",
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              {renderFormattedText(trimmed.slice(3))}
            </h3>
          </div>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p
            key={index}
            style={{
              color: "var(--text-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.8",
              marginBottom: "14px",
              fontWeight: 450,
            }}
          >
            {renderFormattedText(trimmed)}
          </p>
        );
      }
    }
  });

  flushList(lines.length);

  return <div>{elements}</div>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [casData, setCasData] = useState<CASData>(MOCK_CAS_DATABASE);
  const [isMock, setIsMock] = useState(true);
  const [parseMsg, setParseMsg] = useState("");
  const [crashPct, setCrashPct] = useState(0);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [question, setQuestion] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Investment Suggestions State
  const [showInvestPanel, setShowInvestPanel] = useState(false);
  const [investSuggestions, setInvestSuggestions] = useState<InvestmentSuggestion[]>([]);
  const [loadingInvest, setLoadingInvest] = useState(false);
  const [investProvider, setInvestProvider] = useState("Groq AI");
  const [investFetched, setInvestFetched] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("casData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCasData(parsed);
        setIsMock(parsed.is_mock ?? true);
        setParseMsg(parsed.parse_message ?? "");
        if (parsed.parse_message) setToast(parsed.parse_message);
      } catch {
        setCasData(MOCK_CAS_DATABASE);
      }
    }
  }, []);

  // Dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Computed analytics
  const alloc = assetAllocation(casData);
  const sectors = companySectorExposure(casData);
  const concentration = concentrationAnalysis(casData);
  const duplicates = duplicateDetection(casData);
  const divScore = diversificationScore(casData);
  const risks = riskIndicators(casData);
  const gaps = portfolioGaps(casData);
  const alternatives = alternativeAssetAnalysis(casData);
  const tax = taxAndXIRR(casData);
  const exposed = hiddenExposure(casData);
  const crashValue = simulateCrash(casData, crashPct);

  const totalValue = casData.total_portfolio_value;
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const askAI = async (customPrompt?: string) => {
    setLoadingAI(true);
    const query = customPrompt || question;
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights: casData.computed_insights,
          portfolioSummary: {
            investor_name: casData.investor_name,
            total_value: totalValue,
            asset_allocation: alloc,
            top_sectors: sectors.slice(0, 5),
            duplicates: duplicates,
            hidden_exposures: exposed.slice(0, 4),
            diversification_score: divScore,
          },
          question: query,
        }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation || "No explanation generated.");
      setAiProvider(data.provider || "Groq (Llama 3.3 70B)");
    } catch {
      setAiExplanation("Failed to connect to Groq AI. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const fetchInvestmentSuggestions = async () => {
    setShowInvestPanel(true);
    if (investFetched && investSuggestions.length > 0) return; // don't re-fetch
    setLoadingInvest(true);
    try {
      const res = await fetch("/api/investment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalValue: totalValue || 2450000,
          assetAllocation: alloc || { equity: 71, debt: 17, gold: 12, other: 0 },
          portfolioSummary: {
            investor_name: casData?.investor_name || "Investor",
            diversification_score: divScore || 70,
            top_sectors: Array.isArray(sectors) ? sectors.slice(0, 5) : [],
            has_gold: alternatives?.hasGold ?? false,
            has_international: alternatives?.hasInternational ?? false,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setInvestSuggestions(data.suggestions);
        setInvestProvider(data.provider || "Groq AI");
        setInvestFetched(true);
      }
    } catch (err) {
      console.error("Investment suggestions error:", err);
    } finally {
      setLoadingInvest(false);
    }
  };

  const pieData = [
    { name: "Equity", value: alloc.equity },
    { name: "Debt", value: alloc.debt },
    { name: "Gold", value: alloc.gold },
    { name: "Other", value: alloc.other },
  ].filter((d) => d.value > 0);

  const radarData = [
    { subject: "Diversity", A: divScore },
    { subject: "Debt Coverage", A: Math.min(100, alloc.debt * 5) },
    { subject: "Intl Exposure", A: alternatives.hasInternational ? 70 : 20 },
    { subject: "Gold Hedge", A: alternatives.hasGold ? 80 : 15 },
    { subject: "Liquidity", A: alloc.debt > 15 ? 75 : 40 },
  ];

  return (
    <div className="page-enter grid-bg" style={{ minHeight: "100vh", padding: "100px 24px 80px", background: "var(--bg-primary)" }}>
      {/* Toast */}
      {toast && (
        <div
          className="toast"
          style={{
            borderColor: isMock ? "var(--accent-amber)" : "var(--accent-emerald)",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span>{isMock ? "⚠️" : "✅"}</span>
            <span style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)", fontWeight: 600 }}>{toast}</span>
          </div>
        </div>
      )}

      {/* Dashboard Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div className="section-label">PORTFOLIO INTELLIGENCE</div>
          <h1 style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
            {casData.investor_name}&apos;s Dashboard
          </h1>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{casData.as_of_date ? `As of ${casData.as_of_date}` : "Real-time CAS Analysis"}</span>
            {isMock && (
              <span className="badge badge-warning">
                DEMO DATA
              </span>
            )}
            <span
              className="badge"
              style={{
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid var(--border-bright)",
                color: "var(--accent-teal)",
                fontWeight: 700,
              }}
            >
              ⚡ GROQ AI ACTIVE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn-secondary"
            style={{ fontSize: "14px", padding: "10px 20px" }}
            onClick={() => router.push("/upload")}
          >
            ↑ Upload Another CAS
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: "14px", padding: "10px 20px" }}
            onClick={() => askAI()}
          >
            ✨ Run AI Intelligence
          </button>
          <button
            type="button"
            className="btn-invest"
            style={{ fontSize: "13px", padding: "10px 20px" }}
            onClick={fetchInvestmentSuggestions}
          >
            💰 Investment Suggestions
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        {[
          {
            label: "Total Portfolio Value",
            value: formatINR(totalValue),
            sub: `${casData.folios.length} Folios + ${casData.demat.length} Stocks`,
            color: "var(--accent-teal)",
            icon: "💼",
          },
          {
            label: "Crash Simulated Value",
            value: formatINR(crashValue),
            sub: crashPct === 0 ? "Drag slider below to test" : `At -${crashPct}% market drop`,
            color: crashPct > 20 ? "var(--accent-rose)" : "var(--accent-amber)",
            icon: "📉",
          },
          {
            label: "Diversification Score",
            value: `${divScore}/100`,
            sub: divScore < 50 ? "⚠ High concentration" : divScore < 70 ? "Moderate diversity" : "Well Diversified",
            color: divScore < 50 ? "var(--accent-rose)" : divScore < 70 ? "var(--accent-amber)" : "var(--accent-emerald)",
            icon: "📊",
          },
          {
            label: "Est. Tax Liability",
            value: formatINR(tax.totalTaxLiability),
            sub: `XIRR: ~${tax.xirrEstimate}% | LTCG + STCG`,
            color: "var(--accent-purple)",
            icon: "🧾",
          },
        ].map((stat) => (
          <TiltCard key={stat.label}>
            <div>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>{stat.icon}</div>
              <div className="section-label" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </div>
              <div
                className="mono"
                style={{ fontSize: "24px", fontWeight: 900, color: stat.color, marginTop: "4px" }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", fontWeight: 500 }}>
                {stat.sub}
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* ====== INVESTMENT SUGGESTIONS CTA BANNER ====== */}
      <div
        style={{
          marginBottom: "28px",
          background: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(244,63,94,0.07) 50%, rgba(129,140,248,0.10) 100%)",
          border: "1px solid rgba(245,158,11,0.35)",
          borderRadius: "18px",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "var(--accent-amber)", marginBottom: "6px" }}>🤖 GROQ AI · INVESTMENT INTELLIGENCE</div>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.3px", margin: 0 }}>
            Where Should You Invest Next?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "5px", fontWeight: 500, maxWidth: "480px" }}>
            Get AI-powered suggestions for <strong style={{ color: "var(--accent-teal)" }}>REITs</strong>, <strong style={{ color: "var(--accent-purple)" }}>InvITs</strong> &amp; <strong style={{ color: "var(--accent-emerald)" }}>Bonds</strong> — with exact amounts, return % calculations, tax benefits &amp; risk analysis tailored to your portfolio.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <span className="type-badge reit">🏢 REITs</span>
            <span className="type-badge invit">⚡ InvITs</span>
            <span className="type-badge bond">📄 Bonds</span>
          </div>
          <div
            className="invest-btn-wrapper"
            onClick={fetchInvestmentSuggestions}
            style={{ cursor: "pointer", position: "relative", zIndex: 10 }}
          >
            <button
              id="investment-suggestions-btn"
              type="button"
              className="btn-invest"
              onClick={(e) => {
                e.stopPropagation();
                fetchInvestmentSuggestions();
              }}
              disabled={loadingInvest}
              style={{
                pointerEvents: "auto",
                position: "relative",
                zIndex: 20,
                cursor: "pointer",
              }}
            >
              {loadingInvest ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "18px" }}>⟳</span>
                  Generating Suggestions...
                </>
              ) : (
                <>
                  💰 Get Investment Suggestions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Investment Panel Modal */}
      {showInvestPanel && (
        <InvestmentPanel
          suggestions={investSuggestions}
          loading={loadingInvest}
          provider={investProvider}
          onClose={() => setShowInvestPanel(false)}
          formatINR={formatINR}
          totalPortfolioValue={totalValue}
        />
      )}

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Card 1: Asset Allocation Pie */}
        <TiltCard>
          <div className="section-label">ASSET ALLOCATION</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Portfolio Breakdown
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--chart-tooltip-bg)",
                  color: "var(--chart-tooltip-text)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-card)",
                }}
                itemStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 700 }}
              />
            </PieChart>
            <div style={{ flex: 1 }}>
              {pieData.map((d, idx) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: COLORS[idx],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 600 }}>{d.name}</span>
                  </div>
                  <span
                    className="mono"
                    style={{ fontWeight: 800, fontSize: "15px", color: COLORS[idx] }}
                  >
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        {/* Card 2: Risk Indicators */}
        <TiltCard>
          <div className="section-label">RISK INDICATORS</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Portfolio Health Check
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {risks.map((r) => (
              <div
                key={r.label}
                style={{
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background:
                    r.level === "danger"
                      ? "var(--card-danger-bg)"
                      : r.level === "warning"
                      ? "var(--card-warning-bg)"
                      : "var(--card-safe-bg)",
                  border: `1px solid ${
                    r.level === "danger"
                      ? "var(--card-danger-border)"
                      : r.level === "warning"
                      ? "var(--card-warning-border)"
                      : "var(--card-safe-border)"
                  }`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary)" }}>{r.label}</span>
                  <span className={`badge badge-${r.level}`}>{r.value}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{r.description}</div>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* Card 3: Hidden Exposure */}
        <TiltCard>
          <div className="section-label">HIDDEN EXPOSURE</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "4px", color: "var(--text-primary)" }}>
            Where Your Money Really Goes
          </h3>
          <div style={{ fontSize: "13px", color: "var(--accent-teal)", fontWeight: 600, marginBottom: "16px" }}>
            Multi-fund hidden overlap breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {exposed.slice(0, 5).map((e) => (
              <div
                key={e.company}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: e.isHidden ? "var(--card-danger-bg)" : "var(--bg-card-subtle)",
                  border: e.isHidden ? "1px solid var(--card-danger-border)" : "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>{e.company}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px", fontWeight: 500 }}>
                    Via: <strong style={{ color: "var(--accent-sky)" }}>{e.sources.join(", ")}</strong>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    className="mono"
                    style={{
                      fontWeight: 900,
                      fontSize: "17px",
                      color: e.pct > 15 ? "var(--accent-rose)" : "var(--accent-teal)",
                    }}
                  >
                    {e.pct}%
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {formatINR(e.totalValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* Card 4: Fund Overlap / Duplicates */}
        <TiltCard>
          <div className="section-label">FUND OVERLAP DETECTION</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            X-Ray: Hover Funds to See Holdings
          </h3>
          {duplicates.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {duplicates.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "var(--card-danger-bg)",
                    border: "1px solid var(--card-danger-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <HoverXRay
                        scheme={d.pair[0]}
                        holdings={casData.folios.find((f) => f.scheme === d.pair[0])?.top_holdings || []}
                      />
                      <HoverXRay
                        scheme={d.pair[1]}
                        holdings={casData.folios.find((f) => f.scheme === d.pair[1])?.top_holdings || []}
                      />
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: "26px",
                        fontWeight: 900,
                        color: "var(--accent-rose)",
                        minWidth: "70px",
                        textAlign: "right",
                      }}
                    >
                      {d.overlapPct}%
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                    Common Stocks: <strong style={{ color: "var(--text-primary)" }}>{d.commonHoldings.join(", ")}</strong>
                  </div>
                  <div className="progress-bar" style={{ marginTop: "8px" }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${d.overlapPct}%`,
                        background: d.overlapPct > 60 ? "var(--accent-rose)" : "var(--accent-amber)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--accent-emerald)", fontSize: "14px", padding: "20px 0", textAlign: "center", fontWeight: 600 }}>
              ✅ No significant fund overlap detected
            </div>
          )}

          {/* All MF listings with X-Ray */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "12px", letterSpacing: "1px" }}>
              ALL SCHEMES — HOVER FOR X-RAY
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {casData.folios.map((f) => (
                <div
                  key={f.folio}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-card-subtle)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <HoverXRay scheme={f.scheme} holdings={f.top_holdings} />
                  <span
                    className="mono"
                    style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent-emerald)" }}
                  >
                    {formatINR(f.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        {/* Card 5: Crash Simulator */}
        <TiltCard>
          <div className="section-label" style={{ color: "var(--accent-rose)" }}>
            CRASH SIMULATOR
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Drag to Simulate Market Crash
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                alignItems: "baseline",
              }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600 }}>Market Crash Scenario</span>
              <span
                className="mono"
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  color: crashPct === 0 ? "var(--accent-teal)" : "var(--accent-rose)",
                }}
              >
                -{crashPct}%
              </span>
            </div>
            <input
              type="range"
              className="crash-slider"
              min={0}
              max={40}
              step={1}
              value={crashPct}
              onChange={(e) => setCrashPct(Number(e.target.value))}
            />
            <div
              style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 500 }}
            >
              <span>No crash (0%)</span>
              <span>-20% Correction</span>
              <span>-40% Bear Market</span>
            </div>
          </div>

          {/* Value comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "var(--card-safe-bg)",
                border: "1px solid var(--card-safe-border)",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-emerald)", marginBottom: "6px" }}>CURRENT VALUE</div>
              <div className="mono" style={{ fontSize: "19px", fontWeight: 900, color: "var(--text-primary)" }}>
                {formatINR(totalValue)}
              </div>
            </div>
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: crashPct > 0 ? "var(--card-danger-bg)" : "var(--bg-card-subtle)",
                border: `1px solid ${crashPct > 0 ? "var(--card-danger-border)" : "var(--border)"}`,
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: crashPct > 0 ? "var(--accent-rose)" : "var(--text-muted)", marginBottom: "6px" }}>
                SIMULATED VALUE
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "19px",
                  fontWeight: 900,
                  color: crashPct > 0 ? "var(--accent-rose)" : "var(--text-primary)",
                  transition: "color 0.3s ease",
                }}
              >
                {formatINR(crashValue)}
              </div>
            </div>
          </div>

          {crashPct > 0 && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "var(--card-danger-bg)",
                border: "1px solid var(--card-danger-border)",
                fontSize: "13px",
                color: "var(--accent-rose)",
                fontWeight: 600,
              }}
            >
              📉 Estimated Portfolio Loss: {formatINR(totalValue - crashValue)} ({crashPct}% drop)
            </div>
          )}
        </TiltCard>

        {/* Card 6: Sector Exposure */}
        <TiltCard>
          <div className="section-label">SECTOR EXPOSURE</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Concentration by Sector
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sectors.slice(0, 6)} layout="vertical">
              <XAxis type="number" hide />
              <YAxis
                dataKey="sector"
                type="category"
                width={120}
                tick={{ fill: "var(--chart-axis)", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--chart-tooltip-bg)",
                  color: "var(--chart-tooltip-text)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-card)",
                }}
                itemStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 700 }}
                formatter={(value) => [`${value}%`, "Allocation"]}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {sectors.slice(0, 6).map((s, idx) => (
                  <Cell key={idx} fill={s.isConcentrated ? "var(--accent-rose)" : COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: "12px", color: "var(--accent-rose)", marginTop: "10px", fontWeight: 600 }}>
            🔴 Red bars = sectors with &gt;15% concentration risk
          </div>
        </TiltCard>

        {/* Card 7: Portfolio Radar */}
        <TiltCard>
          <div className="section-label">PORTFOLIO HEALTH RADAR</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Multi-Dimensional Balance
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--chart-grid)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--chart-axis)", fontSize: 12, fontWeight: 600 }} />
              <Radar
                dataKey="A"
                stroke="var(--accent-teal)"
                fill="var(--accent-teal)"
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </TiltCard>

        {/* Card 8: Portfolio Gaps */}
        <TiltCard>
          <div className="section-label">PORTFOLIO GAPS</div>
          <h3 style={{ fontSize: "17px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)" }}>
            Asset Allocation Rebalancing
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {gaps.map((g) => (
              <div
                key={g.category}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)" }}>{g.category}</span>
                  <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                    <span style={{ color: "var(--accent-rose)", fontWeight: 700 }}>Now: {g.currentPct}%</span>
                    <span style={{ color: "var(--text-muted)" }}>→</span>
                    <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>Target: {g.recommendedPct}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(g.currentPct / g.recommendedPct) * 100}%`,
                      background: g.currentPct < g.recommendedPct ? "var(--accent-purple)" : "var(--accent-emerald)",
                      maxWidth: "100%",
                    }}
                  />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", fontWeight: 500 }}>
                  💡 {g.action}
                </div>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* AI Explanation Card - Full Width Powered by Groq */}
        <TiltCard style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div className="section-label">GROQ AI INTELLIGENCE ENGINE</div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--accent-teal)",
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid var(--border-bright)",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              ⚡ Llama 3.3 70B Versatile
            </span>
          </div>

          <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "8px", color: "var(--text-primary)" }}>
            ✨ Ask Anything About Your Portfolio
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px", fontWeight: 500 }}>
            Institutional-grade portfolio intelligence generated by Groq AI — strictly context-bound to your uploaded statement.
          </p>

          {/* Quick Prompts */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              "🔍 Explain my hidden stock overlaps",
              "⚠️ How risky is my sector concentration?",
              "💡 What are the best rebalancing steps?",
              "🧾 Explain my tax liability & XIRR",
            ].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setQuestion(p);
                  askAI(p);
                }}
                style={{
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-teal)";
                  e.currentTarget.style.color = "var(--accent-teal)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Query Input */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Ask: Why is HDFC Bank so heavy in my portfolio? Is my asset allocation safe?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              style={{
                fontWeight: 500,
              }}
            />
            <button
              className="btn-primary"
              onClick={() => askAI()}
              disabled={loadingAI}
              style={{ whiteSpace: "nowrap", minWidth: "150px" }}
            >
              {loadingAI ? "Analyzing..." : "✨ Ask Groq AI"}
            </button>
          </div>

          {/* AI Response Display */}
          {aiExplanation && (
            <div
              style={{
                padding: "24px",
                borderRadius: "14px",
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border)",
                fontSize: "15px",
                color: "var(--text-primary)",
                lineHeight: 1.8,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                <span style={{ fontWeight: 900, color: "var(--accent-teal)", fontSize: "14px", letterSpacing: "0.5px" }}>
                  🤖 INVESTIQ AI EXECUTIVE INTELLIGENCE
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                  Engine: {aiProvider}
                </span>
              </div>

              <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                <MarkdownRenderer content={aiExplanation} />
              </div>

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                ⚠️ Disclaimer: For informational purposes only. Consult a SEBI-registered advisor before executing financial decisions.
              </div>
            </div>
          )}
        </TiltCard>
      </div>
    </div>
  );
}
