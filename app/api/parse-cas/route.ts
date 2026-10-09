import { NextRequest, NextResponse } from "next/server";
import { MOCK_CAS_DATABASE } from "@/lib/mockCASDatabase";

interface ParsedCASData {
  investor_name: string;
  pan?: string;
  total_portfolio_value: number;
  as_of_date: string;
  folios: typeof MOCK_CAS_DATABASE.folios;
  demat: typeof MOCK_CAS_DATABASE.demat;
  computed_insights: typeof MOCK_CAS_DATABASE.computed_insights;
  is_mock: boolean;
  parse_message: string;
}

async function extractTextFromPDF(buffer: Buffer, password?: string): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (await import("pdf-parse" as any)).default as (b: Buffer, o?: Record<string, unknown>) => Promise<{text: string}>;
    const options = password ? { password } : {};
    const data = await pdfParse(buffer, options);
    return data.text || "";
  } catch {
    // Try without password
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = (await import("pdf-parse" as any)).default as (b: Buffer) => Promise<{text: string}>;
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch {
      return "";
    }
  }
}

function parseCASText(text: string): Partial<ParsedCASData> | null {
  // Check if it's a CAS file
  const isCAS =
    /consolidated account statement/i.test(text) ||
    /NSDL|CDSL/i.test(text) ||
    /CAMS|KFINTECH|Karvy/i.test(text);

  if (!isCAS) return null;

  // Extract investor name
  const nameMatch = text.match(/(?:Name|Investor Name)\s*[:\-]\s*([A-Z\s]+)/i);
  const investor_name = nameMatch ? nameMatch[1].trim() : "Unknown Investor";

  // Extract PAN
  const panMatch = text.match(/PAN\s*[:\-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i);
  const pan = panMatch ? panMatch[1] : undefined;

  // Extract folios using regex patterns
  const folios: typeof MOCK_CAS_DATABASE.folios = [];

  const folioRegex = /Folio No[:\s]+(\d+\/\d+)/gi;
  const isinRegex = /ISIN[:\s]+([A-Z0-9]{12})/gi;
  const unitsRegex = /Units?[:\s]+([\d,]+\.?\d*)/gi;
  const navRegex = /NAV[:\s]+(?:INR\s*)?([\d,]+\.?\d*)/gi;

  const folioMatches = [...text.matchAll(folioRegex)];
  const isinMatches = [...text.matchAll(isinRegex)];

  if (isinMatches.length === 0) return null;

  // Try to pair folios with ISINs and values
  folioMatches.forEach((folioMatch, idx) => {
    const isin = isinMatches[idx]?.[1] || "";
    const unitMatch = unitsRegex.exec(text);
    const navMatch = navRegex.exec(text);

    const units = unitMatch ? parseFloat(unitMatch[1].replace(/,/g, "")) : 0;
    const nav = navMatch ? parseFloat(navMatch[1].replace(/,/g, "")) : 0;
    const value = units * nav;

    if (isin && units > 0) {
      folios.push({
        folio: folioMatch[1],
        scheme: `Fund ${isin}`,
        isin,
        type: "Equity",
        units,
        nav,
        value: Math.round(value),
        amc: "Unknown AMC",
        top_holdings: [],
      });
    }
  });

  if (folios.length === 0) return null;

  const total_portfolio_value = folios.reduce((sum, f) => sum + f.value, 0);

  return {
    investor_name,
    pan,
    total_portfolio_value,
    as_of_date: new Date().toISOString().split("T")[0],
    folios,
    demat: [],
    computed_insights: MOCK_CAS_DATABASE.computed_insights,
    is_mock: false,
    parse_message: `Successfully parsed ${folios.length} folios from your CAS`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Try to extract text from PDF
    const text = await extractTextFromPDF(buffer, password || undefined);

    if (text) {
      // Try CAS parsing
      const parsed = parseCASText(text);

      if (parsed && parsed.folios && parsed.folios.length > 0) {
        return NextResponse.json({
          ...parsed,
          is_mock: false,
          parse_message: `✅ Real CAS parsed! Found ${parsed.folios.length} folios`,
        });
      }

      // Check if it contains any ISIN
      const isinCount = (text.match(/INF\w{9}|INE\w{9}/g) || []).length;
      if (isinCount === 0) {
        // Not a CAS - use mock
        return NextResponse.json({
          ...MOCK_CAS_DATABASE,
          is_mock: true,
          parse_message: "⚠️ Demo CAS loaded - Upload real NSDL/CDSL CAS for your actual analysis",
        });
      }
    }

    // Fallback to mock data
    return NextResponse.json({
      ...MOCK_CAS_DATABASE,
      is_mock: true,
      parse_message: text
        ? "⚠️ Demo CAS loaded - Could not parse this file. Try NSDL/CDSL CAS PDF"
        : "⚠️ Demo CAS loaded - Password protected or unreadable. Try with your PAN as password",
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({
      ...MOCK_CAS_DATABASE,
      is_mock: true,
      parse_message: "⚠️ Demo CAS loaded - Upload real NSDL CAS for your actual analysis",
    });
  }
}
