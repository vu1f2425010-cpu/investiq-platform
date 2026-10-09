import { CASData } from "./mockCASDatabase";

export interface AssetAllocation {
  equity: number;
  debt: number;
  gold: number;
  other: number;
}

export interface SectorExposure {
  sector: string;
  value: number;
  pct: number;
  isConcentrated: boolean;
}

export interface CompanyExposure {
  company: string;
  totalValue: number;
  pct: number;
  sources: string[];
  isHidden: boolean;
}

export interface ConcentrationResult {
  items: { label: string; pct: number; isHigh: boolean }[];
  overallRisk: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
}

export interface DuplicateResult {
  pair: [string, string];
  overlapPct: number;
  commonHoldings: string[];
}

export interface RiskIndicator {
  label: string;
  value: string;
  level: "safe" | "warning" | "danger";
  description: string;
}

export interface PortfolioGap {
  category: string;
  currentPct: number;
  recommendedPct: number;
  action: string;
}

// 1. Asset Allocation
export function assetAllocation(data: CASData): AssetAllocation {
  const totalValue = data.total_portfolio_value;

  let equity = 0;
  let debt = 0;
  let gold = 0;

  data.folios.forEach((f) => {
    const type = f.type.toLowerCase();
    if (type.includes("debt") || type.includes("liquid") || type.includes("bond")) {
      debt += f.value;
    } else if (type.includes("gold")) {
      gold += f.value;
    } else {
      equity += f.value;
    }
  });

  // Add demat to equity
  data.demat.forEach((d) => {
    equity += d.value;
  });

  const other = totalValue - equity - debt - gold;

  return {
    equity: Math.round((equity / totalValue) * 100),
    debt: Math.round((debt / totalValue) * 100),
    gold: Math.round((gold / totalValue) * 100),
    other: Math.max(0, Math.round((other / totalValue) * 100)),
  };
}

// 2. Company Sector Exposure
export function companySectorExposure(data: CASData): SectorExposure[] {
  const sectorMap: Record<string, number> = {};
  const totalValue = data.total_portfolio_value;

  // From demat
  data.demat.forEach((d) => {
    sectorMap[d.sector] = (sectorMap[d.sector] || 0) + d.value;
  });

  // Estimate from MF types
  data.folios.forEach((f) => {
    const type = f.type.toLowerCase();
    if (type.includes("large cap") || type.includes("flexi cap") || type.includes("blue chip")) {
      sectorMap["Equity - Diversified"] = (sectorMap["Equity - Diversified"] || 0) + f.value * 0.4;
      sectorMap["Banking"] = (sectorMap["Banking"] || 0) + f.value * 0.2;
      sectorMap["IT"] = (sectorMap["IT"] || 0) + f.value * 0.15;
    } else if (type.includes("debt") || type.includes("liquid")) {
      sectorMap["Debt / Fixed Income"] = (sectorMap["Debt / Fixed Income"] || 0) + f.value;
    }
  });

  return Object.entries(sectorMap)
    .map(([sector, value]) => ({
      sector,
      value: Math.round(value),
      pct: Math.round((value / totalValue) * 100),
      isConcentrated: (value / totalValue) * 100 > 15,
    }))
    .sort((a, b) => b.value - a.value);
}

// 3. Concentration Analysis
export function concentrationAnalysis(data: CASData): ConcentrationResult {
  const totalValue = data.total_portfolio_value;

  const items = [
    ...data.folios.map((f) => ({
      label: f.scheme,
      pct: Math.round((f.value / totalValue) * 100),
      isHigh: (f.value / totalValue) * 100 > 15,
    })),
    ...data.demat.map((d) => ({
      label: d.company,
      pct: Math.round((d.value / totalValue) * 100),
      isHigh: (d.value / totalValue) * 100 > 15,
    })),
  ].sort((a, b) => b.pct - a.pct);

  const highCount = items.filter((i) => i.isHigh).length;
  const overallRisk =
    highCount >= 3
      ? "VERY_HIGH"
      : highCount >= 2
        ? "HIGH"
        : highCount === 1
          ? "MODERATE"
          : "LOW";

  return { items, overallRisk };
}

// 4. Duplicate Detection
export function duplicateDetection(data: CASData): DuplicateResult[] {
  const results: DuplicateResult[] = [];

  for (let i = 0; i < data.folios.length; i++) {
    for (let j = i + 1; j < data.folios.length; j++) {
      const a = data.folios[i];
      const b = data.folios[j];

      if (!a.top_holdings || !b.top_holdings) continue;

      const aNames = a.top_holdings.map((h) => h.name);
      const bNames = b.top_holdings.map((h) => h.name);
      const common = aNames.filter((n) => bNames.includes(n));
      const overlapPct = Math.round((common.length / Math.min(aNames.length, bNames.length)) * 100);

      if (overlapPct > 30) {
        results.push({
          pair: [a.scheme, b.scheme],
          overlapPct,
          commonHoldings: common,
        });
      }
    }
  }

  return results.sort((a, b) => b.overlapPct - a.overlapPct);
}

// 5. Diversification Score
export function diversificationScore(data: CASData): number {
  const alloc = assetAllocation(data);
  const concentration = concentrationAnalysis(data);
  const duplicates = duplicateDetection(data);

  let score = 100;

  // Penalize concentration
  score -= concentration.items.filter((i) => i.isHigh).length * 10;

  // Penalize duplicates
  score -= duplicates.length * 8;

  // Penalize lack of international
  if (alloc.other < 5) score -= 5;

  // Penalize lack of debt
  if (alloc.debt < 10) score -= 8;

  // Penalize lack of gold
  if (alloc.gold < 3) score -= 5;

  return Math.max(0, Math.min(100, score));
}

// 6. Risk Indicators
export function riskIndicators(data: CASData): RiskIndicator[] {
  const alloc = assetAllocation(data);
  const concentration = concentrationAnalysis(data);
  const score = diversificationScore(data);

  return [
    {
      label: "Equity Exposure",
      value: `${alloc.equity}%`,
      level: alloc.equity > 80 ? "danger" : alloc.equity > 65 ? "warning" : "safe",
      description:
        alloc.equity > 80
          ? "High equity concentration - vulnerable to market crashes"
          : "Balanced equity exposure",
    },
    {
      label: "Concentration Risk",
      value: concentration.overallRisk,
      level:
        concentration.overallRisk === "VERY_HIGH"
          ? "danger"
          : concentration.overallRisk === "HIGH"
            ? "danger"
            : concentration.overallRisk === "MODERATE"
              ? "warning"
              : "safe",
      description: `${concentration.items.filter((i) => i.isHigh).length} holdings exceed 15% portfolio weight`,
    },
    {
      label: "Diversification Score",
      value: `${score}/100`,
      level: score < 50 ? "danger" : score < 70 ? "warning" : "safe",
      description: score < 50 ? "Poor diversification - major restructuring needed" : "Moderate diversification",
    },
    {
      label: "Debt Cushion",
      value: `${alloc.debt}%`,
      level: alloc.debt < 10 ? "warning" : "safe",
      description: alloc.debt < 10 ? "Low debt allocation - consider adding debt funds" : "Adequate debt allocation",
    },
  ];
}

// 7. Portfolio Gaps
export function portfolioGaps(data: CASData): PortfolioGap[] {
  const alloc = assetAllocation(data);

  const targets: PortfolioGap[] = [
    { category: "Equity", currentPct: alloc.equity, recommendedPct: 65, action: "Reduce equity, book some profits" },
    {
      category: "Debt / Fixed Income",
      currentPct: alloc.debt,
      recommendedPct: 20,
      action: "Add debt funds for stability",
    },
    { category: "Gold / Commodities", currentPct: alloc.gold, recommendedPct: 10, action: "Add Sovereign Gold Bonds" },
    {
      category: "International",
      currentPct: alloc.other,
      recommendedPct: 10,
      action: "Add US/Global index fund exposure",
    },
    {
      category: "Real Estate (REIT)",
      currentPct: 0,
      recommendedPct: 5,
      action: "Consider REIT for real estate exposure",
    },
  ];

  return targets.filter((t) => Math.abs(t.currentPct - t.recommendedPct) > 3);
}

// 8. Alternative Asset Analysis
export function alternativeAssetAnalysis(data: CASData): {
  hasGold: boolean;
  hasREIT: boolean;
  hasInternational: boolean;
  suggestions: string[];
} {
  const hasGold = data.folios.some((f) => f.type.toLowerCase().includes("gold"));
  const hasREIT = data.folios.some((f) => f.type.toLowerCase().includes("reit"));
  const hasInternational = data.folios.some(
    (f) => f.scheme.toLowerCase().includes("international") || f.scheme.toLowerCase().includes("global")
  );

  const suggestions: string[] = [];
  if (!hasGold) suggestions.push("Add 5-10% Sovereign Gold Bond or Gold ETF");
  if (!hasREIT) suggestions.push("Consider 5% REIT allocation for inflation hedge");
  if (!hasInternational) suggestions.push("Add 10% US/Global index fund for geographic diversification");

  return { hasGold, hasREIT, hasInternational, suggestions };
}

// 9. Tax & XIRR Estimates
export function taxAndXIRR(data: CASData): {
  ltcgEstimate: number;
  stcgEstimate: number;
  totalTaxLiability: number;
  xirrEstimate: number;
} {
  const totalEquity = data.folios
    .filter((f) => !f.type.toLowerCase().includes("debt"))
    .reduce((sum, f) => sum + f.value, 0);

  const gains = totalEquity * 0.12; // Assume 12% gains
  const ltcg = gains > 100000 ? (gains - 100000) * 0.1 : 0; // 10% above 1L
  const stcg = totalEquity * 0.05 * 0.15; // 15% on short-term gains estimate

  return {
    ltcgEstimate: Math.round(ltcg),
    stcgEstimate: Math.round(stcg),
    totalTaxLiability: Math.round(ltcg + stcg),
    xirrEstimate: 14.2, // Estimated XIRR
  };
}

// 10. Hidden Exposure
export function hiddenExposure(data: CASData): CompanyExposure[] {
  const companyMap: Record<string, { totalValue: number; sources: string[] }> = {};
  const totalValue = data.total_portfolio_value;

  // Direct demat stocks
  data.demat.forEach((d) => {
    if (!companyMap[d.company]) companyMap[d.company] = { totalValue: 0, sources: [] };
    companyMap[d.company].totalValue += d.value;
    companyMap[d.company].sources.push("Direct Stock");
  });

  // Indirect via MFs
  data.folios.forEach((f) => {
    if (!f.top_holdings) return;
    f.top_holdings.forEach((h) => {
      const indirectValue = (h.pct / 100) * f.value;
      if (!companyMap[h.name]) companyMap[h.name] = { totalValue: 0, sources: [] };
      companyMap[h.name].totalValue += indirectValue;
      companyMap[h.name].sources.push(f.amc);
    });
  });

  return Object.entries(companyMap)
    .map(([company, data]) => ({
      company,
      totalValue: Math.round(data.totalValue),
      pct: Math.round((data.totalValue / totalValue) * 100),
      sources: [...new Set(data.sources)],
      isHidden: data.sources.length > 1,
    }))
    .filter((c) => c.pct > 1)
    .sort((a, b) => b.totalValue - a.totalValue);
}

// Crash Simulator
export function simulateCrash(data: CASData, crashPct: number): number {
  const totalValue = data.total_portfolio_value;
  const alloc = assetAllocation(data);

  // Equity loses more in crash, debt relatively stable
  const equityLoss = (alloc.equity / 100) * totalValue * (crashPct / 100);
  const debtLoss = (alloc.debt / 100) * totalValue * (crashPct / 100) * 0.1;
  const goldGain = (alloc.gold / 100) * totalValue * Math.abs(crashPct / 100) * 0.3; // Gold rises in crash

  return Math.round(totalValue - equityLoss - debtLoss + goldGain);
}
