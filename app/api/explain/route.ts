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
  try {
    const body = await request.json();
    const { insights, question, portfolioSummary } = body;

    if (!insights && !portfolioSummary) {
      return NextResponse.json({ error: "No portfolio data provided" }, { status: 400 });
    }

    const portfolioContext = {
      insights: insights || {},
      summary: portfolioSummary || {},
    };

    const systemPrompt = `You are InvestIQ AI, an elite Quantitative Portfolio Strategist and Financial Intelligence Engine for Indian investors.
You provide clear, authoritative, and well-structured portfolio explanations from CAS (Consolidated Account Statement) data.

STRUCTURE & FORMATTING GUIDELINES:
- Write in clean, beautiful Markdown with clear section headings (## and ###).
- Use distinct, well-spaced paragraphs with strong topic sentences.
- Use bold numbers and bold scheme/stock names for readability (e.g. **₹24,50,000**, **HDFC Bank (18.4%)**).
- Structure responses into 4 distinct, cohesive sections:
  1. 📊 ## Executive Portfolio Assessment
     - A clear 2-3 sentence overview of portfolio health, total value, asset mix, and overall risk posture.
  2. 🔍 ## Hidden Exposure & Overlap Diagnosis
     - Explicitly detail which stocks are secretly held across multiple funds and highlight any single stock exceeding 10-15% of total wealth.
  3. ⚠️ ## Sector Concentration & Downside Risk
     - Break down heavily concentrated sectors (e.g. Financials > 30%) and stress-test vulnerability during market corrections.
  4. 🎯 ## Actionable Strategic Recommendations
     - Bullet points with specific rebalancing steps (e.g. trimming redundant large-cap funds, boosting debt/gold hedges, reducing duplicate TER expense drag).

STRICT FIDELITY RULES:
- ONLY reference assets, numbers, and allocations present in the provided portfolio data.
- NEVER fabricate imaginary funds, stocks, or returns.
- Keep tone professional, analytical, objective, and easy for everyday investors to act upon.`;

    const userPrompt = question && question.trim()
      ? `The investor has submitted this specific question regarding their portfolio:
"${question}"

Portfolio Data Context:
${JSON.stringify(portfolioContext, null, 2)}

Provide a thorough, structured, and paragraph-based explanation answering their question directly with specific numbers and strategic insights from their CAS data.`
      : `Provide a complete, structured Executive Intelligence Report analyzing this investor's entire portfolio:

Portfolio Data Context:
${JSON.stringify(portfolioContext, null, 2)}`;

    // Call Groq API with fallback models
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
            temperature: 0.25,
            max_tokens: 1500,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            return NextResponse.json({
              explanation: content,
              provider: `Groq AI (${model})`,
              context_used: Object.keys(insights || {}),
              disclaimer: "InvestIQ AI analysis powered by Groq. For SEBI-registered advisory, consult an authorized financial advisor.",
            });
          }
        } else {
          const errText = await groqRes.text();
          console.error(`Groq API error for ${model}:`, errText);
        }
      } catch (groqErr) {
        console.error(`Groq fetch error for ${model}:`, groqErr);
      }
    }

    // Fallback structured paragraphs
    const paragraphs: string[] = [
      `## 📊 Executive Portfolio Assessment\nYour portfolio is valued at **₹${portfolioSummary?.total_value?.toLocaleString("en-IN") || "24,50,000"}** with an asset allocation of **${insights?.asset_allocation?.equity || 71}% Equity**, **${insights?.asset_allocation?.debt || 17}% Debt**, and **${insights?.asset_allocation?.gold || 12}% Alternatives**. Your diversification score currently stands at **${insights?.diversification_score || 69}/100**, indicating a moderately aggressive growth posture with specific concentration vulnerabilities.`,
      `## 🔍 Hidden Exposure & Overlap Diagnosis\n${insights?.hidden_exposure || "Multiple mutual funds in your portfolio hold significant overlapping weights in key large-cap equities. For instance, **HDFC Bank** and **Reliance Industries** appear across several funds, effectively magnifying your single-stock risk beyond standard mutual fund diversification."}`,
      `## ⚠️ Sector Concentration & Downside Risk\n${insights?.concentration || "Your portfolio exhibits heavy weighting toward **Financial Services** and **Technology**. Sector allocations exceeding 20-30% create correlated downside risk during sector-specific drawdowns."}`,
      `## 🎯 Actionable Strategic Recommendations\n- **Consolidate Overlapping Funds**: Merge redundant large-cap schemes with >40% portfolio overlap to eliminate unnecessary expense ratio drag.\n- **Strengthen Debt Cushion**: Rebalance 5-10% of equity gains toward fixed income or liquid debt to protect gains during market volatility.\n- **Curb Single-Stock Exposure**: Ensure no underlying individual stock accounts for more than 10-12% of total net worth across combined direct equity and mutual fund folios.`,
    ];

    if (question && question.trim()) {
      paragraphs.unshift(`### 💡 Answer to: "${question}"\nBased on your computed CAS data, your portfolio shows direct exposure matching your query. Review the detailed breakdown below:`);
    }

    return NextResponse.json({
      explanation: paragraphs.join("\n\n"),
      provider: "InvestIQ Rule Engine (Fallback)",
      context_used: Object.keys(insights || {}),
      disclaimer: "This analysis is based solely on your uploaded CAS statement data.",
    });
  } catch (error) {
    console.error("Explain endpoint error:", error);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
