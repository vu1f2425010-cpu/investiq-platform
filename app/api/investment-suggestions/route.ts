import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getGroqApiKey(): string {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GROQ_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {}
  return process.env.GROQ_API_KEY || "";
}

export async function POST(request: NextRequest) {
  let totalValue = 2450000;
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body, proceed with defaults
    }
    const { portfolioSummary, assetAllocation } = body || {};
    if (typeof body?.totalValue === "number" && body.totalValue > 0) {
      totalValue = body.totalValue;
    }

    const systemPrompt = `You are InvestIQ Investment Advisor, an elite SEBI-registered portfolio strategist specializing in alternative investments for Indian investors. 
You MUST respond ONLY with a valid JSON object with a "suggestions" array containing EXACTLY 9 investment suggestions: 3 REITs, 3 InvITs, and 3 Bonds/Fixed Income.

Each object in the suggestions array must have EXACTLY these fields:
{
  "id": "unique_string_id",
  "type": "REIT" or "InvIT" or "Bond",
  "name": "Exact instrument name",
  "issuer": "Company/Trust name",
  "ticker": "NSE/BSE ticker or ISIN",
  "category": "sub-category description",
  "minInvestment": number (in INR integer),
  "recommendedAmount": number (in INR integer),
  "tenureMonths": number (integer months),
  "expectedReturnPct": number (annual percentage e.g. 8.5),
  "distributionYield": number (annual distribution yield % e.g. 6.2),
  "riskLevel": "Low" or "Moderate" or "High",
  "riskScore": number (1-10),
  "projectedValue": number (projected total value after tenure in INR),
  "totalReturn": number (total absolute return in INR),
  "totalReturnPct": number (total % return over tenure),
  "annualIncome": number (estimated annual income in INR),
  "taxBenefit": "brief tax note",
  "liquidity": "High" or "Moderate" or "Low",
  "exchangeListed": true or false,
  "rating": "credit rating like AAA or AA+",
  "whyRecommended": "2-3 sentences explaining suitability",
  "keyRisks": ["risk1", "risk2", "risk3"],
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "allocationPct": number (% of total portfolio to allocate e.g. 5)
}

Use REAL Indian instruments from 2024-2025:
REITs: Embassy Office Parks REIT, Mindspace Business Parks REIT, Brookfield India Real Estate Trust, Nexus Select Trust
InvITs: IRB InvIT Fund, IndiGrid, PowerGrid InvIT, India Infrastructure Trust, NHAI InvIT  
Bonds: REC Limited Bonds, NHAI Bonds, NABARD Bonds, PFC Bonds, SBI Bonds, Government Securities, Sovereign Gold Bonds

Calculate projectedValue = recommendedAmount * (1 + expectedReturnPct/100) ^ (tenureMonths/12)
Calculate totalReturn = projectedValue - recommendedAmount`;

    const userPrompt = `Generate personalized REIT, InvIT, and Bond suggestions for this investor:

Portfolio Summary:
- Total Portfolio Value: Rs ${totalValue?.toLocaleString("en-IN") || "24,50,000"}
- Asset Allocation: ${JSON.stringify(assetAllocation || { equity: 71, debt: 17, gold: 12, other: 0 })}
- Investor Profile: ${JSON.stringify(portfolioSummary || {})}

Rules:
1. recommendedAmount should be ~5-8% of total portfolio value per instrument for REITs/InvITs, ~3-5% for bonds
2. Scale all amounts proportionally to the total portfolio value
3. Provide EXACTLY 3 REITs, 3 InvITs, 3 Bonds in that order
4. Return JSON object with "suggestions" array`;

    // Call Groq API with candidate models
    const candidateModels = ["llama-3.3-70b-versatile", "qwen/qwen3.8-27b", "openai/gpt-oss-120b"];
    for (const model of candidateModels) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getGroqApiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;

          if (content) {
            try {
              const parsed = JSON.parse(content);
              let suggestions;

              if (Array.isArray(parsed)) {
                suggestions = parsed;
              } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                suggestions = parsed.suggestions;
              } else if (parsed.investments && Array.isArray(parsed.investments)) {
                suggestions = parsed.investments;
              } else {
                const keys = Object.keys(parsed);
                for (const key of keys) {
                  if (Array.isArray(parsed[key])) {
                    suggestions = parsed[key];
                    break;
                  }
                }
              }

              if (suggestions && suggestions.length > 0) {
                const sanitized = suggestions.map((s: any, idx: number) => {
                  const recAmt = Number(s.recommendedAmount) || Math.round(totalValue * (s.allocationPct ? s.allocationPct / 100 : 0.05));
                  const retPct = Number(s.expectedReturnPct) || 10.5;
                  const tenure = Number(s.tenureMonths) || 36;
                  const projVal = Number(s.projectedValue) || Math.round(recAmt * Math.pow(1 + retPct / 100, tenure / 12));
                  const totRet = Number(s.totalReturn) || (projVal - recAmt);
                  return {
                    id: s.id || `sug-${idx}`,
                    type: s.type || (idx < 3 ? "REIT" : idx < 6 ? "InvIT" : "Bond"),
                    name: s.name || `Instrument ${idx + 1}`,
                    issuer: s.issuer || "Top Indian Issuer",
                    ticker: s.ticker || "NSE/BSE",
                    category: s.category || `${s.type || "Alternative"} Asset`,
                    minInvestment: Number(s.minInvestment) || 10000,
                    recommendedAmount: recAmt,
                    tenureMonths: tenure,
                    expectedReturnPct: retPct,
                    distributionYield: Number(s.distributionYield) || 7.0,
                    riskLevel: s.riskLevel || (s.type === "Bond" ? "Low" : "Moderate"),
                    riskScore: Number(s.riskScore) || (s.type === "Bond" ? 2 : 4),
                    projectedValue: projVal,
                    totalReturn: totRet,
                    totalReturnPct: Number(s.totalReturnPct) || parseFloat(((totRet / recAmt) * 100).toFixed(1)),
                    annualIncome: Number(s.annualIncome) || Math.round(recAmt * ((Number(s.distributionYield) || 7.0) / 100)),
                    taxBenefit: s.taxBenefit || "Tax efficient distribution structure",
                    liquidity: s.liquidity || "High",
                    exchangeListed: s.exchangeListed !== undefined ? s.exchangeListed : true,
                    rating: s.rating || "AAA (CRISIL)",
                    whyRecommended: s.whyRecommended || s.rationale || "Strong fundamentals with predictable cash flows and portfolio risk mitigation.",
                    keyRisks: Array.isArray(s.keyRisks) ? s.keyRisks : ["Market risk", "Interest rate fluctuation", "Sector specific risk"],
                    highlights: Array.isArray(s.highlights) ? s.highlights : ["Regulated Indian instrument", "Quarterly distribution", "SEBI governed"],
                    allocationPct: Number(s.allocationPct) || Math.round((recAmt / totalValue) * 100),
                  };
                });

                // Ensure balanced representation: 3 REITs, 3 InvITs, 3 Bonds
                const fallbacks = generateFallbackSuggestions(totalValue);
                const reits = sanitized.filter((s: any) => s.type === "REIT");
                const invits = sanitized.filter((s: any) => s.type === "InvIT");
                const bonds = sanitized.filter((s: any) => s.type === "Bond");

                const balancedList = [
                  ...reits,
                  ...fallbacks.filter((f: any) => f.type === "REIT").slice(reits.length, 3),
                  ...invits,
                  ...fallbacks.filter((f: any) => f.type === "InvIT").slice(invits.length, 3),
                  ...bonds,
                  ...fallbacks.filter((f: any) => f.type === "Bond").slice(bonds.length, 3),
                ];

                return NextResponse.json({
                  success: true,
                  suggestions: balancedList.length > 0 ? balancedList : sanitized,
                  provider: `Groq AI (${model})`,
                  generatedAt: new Date().toISOString(),
                });
              }
            } catch (parseErr) {
              console.error("JSON parse error:", parseErr);
            }
          }
        } else {
          const errText = await groqRes.text();
          console.error(`Groq error for ${model}:`, errText);
        }
      } catch (modelErr) {
        console.error(`Error attempting ${model}:`, modelErr);
      }
    }

    // Fallback hardcoded suggestions
    const fallbackSuggestions = generateFallbackSuggestions(totalValue || 2450000);
    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions,
      provider: "InvestIQ Rule Engine (Fallback)",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Investment suggestions endpoint error:", error);
    return NextResponse.json({
      success: true,
      suggestions: generateFallbackSuggestions(totalValue),
      provider: "InvestIQ Rule Engine (Fallback)",
      generatedAt: new Date().toISOString(),
    });
  }
}

function generateFallbackSuggestions(totalValue: number) {
  return [
    {
      id: "embassy-reit",
      type: "REIT",
      name: "Embassy Office Parks REIT",
      issuer: "Embassy Group & Blackstone",
      ticker: "EMBASSYPPK",
      category: "Commercial Office REIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.06),
      tenureMonths: 36,
      expectedReturnPct: 11.5,
      distributionYield: 6.8,
      riskLevel: "Moderate",
      riskScore: 5,
      projectedValue: Math.round(totalValue * 0.06 * Math.pow(1.115, 3)),
      totalReturn: Math.round(totalValue * 0.06 * (Math.pow(1.115, 3) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.115, 3) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.06 * 0.068),
      taxBenefit: "Distributions taxed as per investor slab; SPV dividends exempt",
      liquidity: "High",
      exchangeListed: true,
      rating: "AAA (CRISIL)",
      whyRecommended: "India's largest office REIT with 45 MSF Grade-A properties across 7 cities. Provides steady rental income from blue-chip MNC tenants like Google, JP Morgan, and IBM. Excellent diversification from equity.",
      keyRisks: ["Office space demand slowdown", "Interest rate sensitivity", "Tenant concentration risk"],
      highlights: ["45 MSF portfolio across 7 cities", "95%+ occupancy rate", "AAA rated by CRISIL"],
      allocationPct: 6,
    },
    {
      id: "mindspace-reit",
      type: "REIT",
      name: "Mindspace Business Parks REIT",
      issuer: "K Raheja Corp & Blackstone",
      ticker: "MINDSPACE",
      category: "Commercial Office REIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.05),
      tenureMonths: 24,
      expectedReturnPct: 10.8,
      distributionYield: 6.5,
      riskLevel: "Moderate",
      riskScore: 4,
      projectedValue: Math.round(totalValue * 0.05 * Math.pow(1.108, 2)),
      totalReturn: Math.round(totalValue * 0.05 * (Math.pow(1.108, 2) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.108, 2) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.05 * 0.065),
      taxBenefit: "Quarterly distributions; no DDT at REIT level",
      liquidity: "High",
      exchangeListed: true,
      rating: "AAA (ICRA)",
      whyRecommended: "Strong presence in IT hubs — Hyderabad, Pune, Mumbai, Chennai. High-quality MNC tenants provide consistent cash flows. Lower volatility compared to direct equity investment.",
      keyRisks: ["WFH trend reducing office demand", "Market price volatility", "Geo-concentration risk"],
      highlights: ["32 MSF across 4 major IT hubs", "91% committed occupancy", "Quarterly dividend distributions"],
      allocationPct: 5,
    },
    {
      id: "nexus-reit",
      type: "REIT",
      name: "Nexus Select Trust REIT",
      issuer: "Nexus Malls & Blackstone",
      ticker: "NEXUSSELECT",
      category: "Retail Mall REIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.05),
      tenureMonths: 36,
      expectedReturnPct: 12.2,
      distributionYield: 7.1,
      riskLevel: "Moderate",
      riskScore: 5,
      projectedValue: Math.round(totalValue * 0.05 * Math.pow(1.122, 3)),
      totalReturn: Math.round(totalValue * 0.05 * (Math.pow(1.122, 3) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.122, 3) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.05 * 0.071),
      taxBenefit: "Retail REIT distributions partially tax-exempt",
      liquidity: "High",
      exchangeListed: true,
      rating: "AA+ (CRISIL)",
      whyRecommended: "India's only listed retail REIT with 17 operational malls across 14 cities. Retail consumption growth story plays perfectly for long-term wealth creation with regular income.",
      keyRisks: ["E-commerce competition", "Consumer spending slowdown", "Mall-specific operational risks"],
      highlights: ["17 malls across 14 major cities", "97% occupancy rate", "7%+ distribution yield"],
      allocationPct: 5,
    },
    {
      id: "powergrid-invit",
      type: "InvIT",
      name: "PowerGrid Infrastructure Investment Trust",
      issuer: "Power Grid Corporation of India",
      ticker: "POWERGRID INVIT",
      category: "Power Transmission InvIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.06),
      tenureMonths: 36,
      expectedReturnPct: 10.5,
      distributionYield: 8.2,
      riskLevel: "Low",
      riskScore: 3,
      projectedValue: Math.round(totalValue * 0.06 * Math.pow(1.105, 3)),
      totalReturn: Math.round(totalValue * 0.06 * (Math.pow(1.105, 3) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.105, 3) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.06 * 0.082),
      taxBenefit: "InvIT distributions: interest portion taxable; return of capital exempt",
      liquidity: "Moderate",
      exchangeListed: true,
      rating: "AAA (CRISIL)",
      whyRecommended: "Government-backed power transmission infrastructure with regulated tariffs and guaranteed returns. Ideal for conservative investors seeking stable infrastructure income with sovereign-like security.",
      keyRisks: ["Regulatory tariff changes", "Interest rate risk", "Limited asset growth potential"],
      highlights: ["Govt-backed PSU InvIT", "Regulated transmission assets", "8.2% distribution yield"],
      allocationPct: 6,
    },
    {
      id: "indigrid-invit",
      type: "InvIT",
      name: "India Grid Trust (IndiGrid)",
      issuer: "Sterlite Power Grid Ventures",
      ticker: "INDIGRID",
      category: "Power Transmission InvIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.05),
      tenureMonths: 48,
      expectedReturnPct: 11.2,
      distributionYield: 8.8,
      riskLevel: "Moderate",
      riskScore: 4,
      projectedValue: Math.round(totalValue * 0.05 * Math.pow(1.112, 4)),
      totalReturn: Math.round(totalValue * 0.05 * (Math.pow(1.112, 4) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.112, 4) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.05 * 0.088),
      taxBenefit: "Quarterly distributions; interest income taxed at slab rate",
      liquidity: "Moderate",
      exchangeListed: true,
      rating: "AA+ (ICRA)",
      whyRecommended: "One of India's largest private power transmission InvITs with 41 transmission lines. High distribution yield makes it attractive for income-seeking investors with moderate risk appetite.",
      keyRisks: ["Counterparty risk from DISCOMs", "Asset concentration in power sector", "Regulatory risk"],
      highlights: ["41 transmission lines portfolio", "8.8% distribution yield", "Long-term PPAs for stability"],
      allocationPct: 5,
    },
    {
      id: "irb-invit",
      type: "InvIT",
      name: "IRB Infrastructure Trust",
      issuer: "IRB Infrastructure Developers",
      ticker: "IRBINVIT",
      category: "Road & Highway InvIT",
      minInvestment: 50000,
      recommendedAmount: Math.round(totalValue * 0.04),
      tenureMonths: 36,
      expectedReturnPct: 12.5,
      distributionYield: 9.2,
      riskLevel: "Moderate",
      riskScore: 5,
      projectedValue: Math.round(totalValue * 0.04 * Math.pow(1.125, 3)),
      totalReturn: Math.round(totalValue * 0.04 * (Math.pow(1.125, 3) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.125, 3) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.04 * 0.092),
      taxBenefit: "Toll revenue distributions partially tax-deferred",
      liquidity: "Moderate",
      exchangeListed: true,
      rating: "AA (CRISIL)",
      whyRecommended: "Exposure to India's booming road infrastructure sector. Toll collection revenues provide inflation-indexed income as traffic volumes grow with economic development.",
      keyRisks: ["Traffic volume risk", "Toll revision regulatory risk", "Concession expiry risk"],
      highlights: ["16 BOT toll road assets", "9.2% distribution yield", "Inflation-linked toll increases"],
      allocationPct: 4,
    },
    {
      id: "rec-bonds",
      type: "Bond",
      name: "REC Limited Tax-Free Bonds",
      issuer: "REC Limited (Power Finance PSU)",
      ticker: "REC54EC",
      category: "Tax-Free Infrastructure Bond",
      minInvestment: 10000,
      recommendedAmount: Math.round(totalValue * 0.04),
      tenureMonths: 120,
      expectedReturnPct: 7.35,
      distributionYield: 7.35,
      riskLevel: "Low",
      riskScore: 2,
      projectedValue: Math.round(totalValue * 0.04 * Math.pow(1.0735, 10)),
      totalReturn: Math.round(totalValue * 0.04 * (Math.pow(1.0735, 10) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.0735, 10) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.04 * 0.0735),
      taxBenefit: "Interest FULLY TAX-FREE under Section 10(15)(iv)(h) — saves 30%+ tax for HNIs",
      liquidity: "Moderate",
      exchangeListed: true,
      rating: "AAA (CRISIL)",
      whyRecommended: "AAA-rated government-backed bonds with fully tax-free interest — effective yield for 30% slab investors is equivalent to 10.5%+ FD. Ideal fixed income anchor for the portfolio.",
      keyRisks: ["Interest rate risk (bond price falls if rates rise)", "10-year lock-in reduces liquidity", "Reinvestment risk"],
      highlights: ["Interest FULLY tax-free", "Govt-owned PSU backing", "AAA CRISIL rating"],
      allocationPct: 4,
    },
    {
      id: "nhai-bonds",
      type: "Bond",
      name: "NHAI Capital Gain Bonds (54EC)",
      issuer: "National Highways Authority of India",
      ticker: "NHAI54EC",
      category: "Capital Gains Exemption Bond",
      minInvestment: 20000,
      recommendedAmount: Math.round(totalValue * 0.03),
      tenureMonths: 60,
      expectedReturnPct: 5.25,
      distributionYield: 5.25,
      riskLevel: "Low",
      riskScore: 1,
      projectedValue: Math.round(totalValue * 0.03 * Math.pow(1.0525, 5)),
      totalReturn: Math.round(totalValue * 0.03 * (Math.pow(1.0525, 5) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.0525, 5) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.03 * 0.0525),
      taxBenefit: "Invest LTCG within 6 months to save up to Rs 1.5Cr capital gains tax (Sec 54EC)",
      liquidity: "Low",
      exchangeListed: false,
      rating: "Sovereign (Govt Guarantee)",
      whyRecommended: "Sovereign-backed bonds to save Long Term Capital Gains tax. If you have sold property or equity, investing LTCG proceeds in NHAI 54EC bonds saves 20% LTCG tax — potentially saving lakhs.",
      keyRisks: ["5-year lock-in (no early exit)", "Relatively lower coupon rate", "Inflation erosion risk"],
      highlights: ["Save LTCG tax up to Rs 1.5 Cr", "Sovereign government guarantee", "Zero credit risk"],
      allocationPct: 3,
    },
    {
      id: "sgb-bonds",
      type: "Bond",
      name: "Sovereign Gold Bond (SGB) Series",
      issuer: "Reserve Bank of India (RBI)",
      ticker: "SGB2024-25",
      category: "Sovereign Gold Bond",
      minInvestment: 5000,
      recommendedAmount: Math.round(totalValue * 0.05),
      tenureMonths: 96,
      expectedReturnPct: 13.5,
      distributionYield: 2.5,
      riskLevel: "Moderate",
      riskScore: 4,
      projectedValue: Math.round(totalValue * 0.05 * Math.pow(1.135, 8)),
      totalReturn: Math.round(totalValue * 0.05 * (Math.pow(1.135, 8) - 1)),
      totalReturnPct: parseFloat(((Math.pow(1.135, 8) - 1) * 100).toFixed(1)),
      annualIncome: Math.round(totalValue * 0.05 * 0.025),
      taxBenefit: "Capital gains at maturity FULLY EXEMPT from tax; 2.5% annual interest taxable at slab",
      liquidity: "Moderate",
      exchangeListed: true,
      rating: "Sovereign (RBI)",
      whyRecommended: "RBI-issued gold bonds combining 2.5% annual interest + gold price appreciation. Zero storage risk, no making charges, and capital gains at maturity are 100% tax-free — far superior to physical gold.",
      keyRisks: ["Gold price volatility", "8-year maturity (though tradable on exchange)", "No guaranteed return on principal"],
      highlights: ["2.5% annual interest + gold returns", "Capital gains tax-exempt at maturity", "RBI sovereign guarantee"],
      allocationPct: 5,
    },
  ];
}
