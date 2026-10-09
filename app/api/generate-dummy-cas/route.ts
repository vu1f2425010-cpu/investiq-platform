import { NextResponse } from "next/server";
import { MOCK_CAS_DATABASE } from "@/lib/mockCASDatabase";

export async function GET() {
  try {
    // Generate a dummy CAS PDF using jsPDF
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CONSOLIDATED ACCOUNT STATEMENT", 105, 15, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("NSDL | CDSL | CAMS | KFINTECH", 105, 25, { align: "center" });
    doc.text("Period: 01-Apr-2023 to 31-Mar-2024", 105, 33, { align: "center" });

    // Investor Info
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INVESTOR INFORMATION", 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Name: ${MOCK_CAS_DATABASE.investor_name.toUpperCase()}`, 15, 60);
    doc.text(`PAN: ${MOCK_CAS_DATABASE.pan}`, 15, 67);
    doc.text(`Email: demo@investor.in`, 15, 74);
    doc.text(`Mobile: XXXXXXX890`, 100, 60);
    doc.text(`Address: 123, Sample Street, Mumbai - 400001`, 100, 67);

    // Divider
    doc.setDrawColor(100, 116, 139);
    doc.line(15, 78, 195, 78);

    // Summary
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("PORTFOLIO SUMMARY", 15, 87);

    doc.setFillColor(248, 250, 252);
    doc.rect(15, 91, 180, 20, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total Portfolio Value: INR ${MOCK_CAS_DATABASE.total_portfolio_value.toLocaleString("en-IN")}`, 20, 99);
    doc.text(`Mutual Fund Value: INR ${MOCK_CAS_DATABASE.folios.reduce((s, f) => s + f.value, 0).toLocaleString("en-IN")}`, 20, 106);
    doc.text(`Demat Holdings Value: INR ${MOCK_CAS_DATABASE.demat.reduce((s, d) => s + d.value, 0).toLocaleString("en-IN")}`, 120, 99);
    doc.text(`Number of Folios: ${MOCK_CAS_DATABASE.folios.length}`, 120, 106);

    // Mutual Funds Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MUTUAL FUND HOLDINGS", 15, 122);
    doc.line(15, 124, 195, 124);

    let yPos = 130;

    // Table headers
    doc.setFillColor(15, 23, 42);
    doc.rect(15, yPos - 5, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Folio No.", 17, yPos);
    doc.text("ISIN", 45, yPos);
    doc.text("Scheme", 75, yPos);
    doc.text("Units", 140, yPos);
    doc.text("NAV", 160, yPos);
    doc.text("Value (INR)", 175, yPos);

    yPos += 8;

    MOCK_CAS_DATABASE.folios.forEach((folio, idx) => {
      // Alternate row colors
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos - 5, 180, 8, "F");
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.text(folio.folio, 17, yPos);
      doc.text(folio.isin, 45, yPos);

      // Truncate scheme name
      const schemeName = folio.scheme.length > 25 ? folio.scheme.substring(0, 25) + "..." : folio.scheme;
      doc.text(schemeName, 75, yPos);
      doc.text(folio.units.toFixed(3), 140, yPos);
      doc.text(folio.nav.toFixed(2), 160, yPos);
      doc.text(folio.value.toLocaleString("en-IN"), 175, yPos);

      yPos += 8;
    });

    yPos += 10;

    // Demat Holdings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("DEMAT HOLDINGS (NSDL/CDSL)", 15, yPos);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 8;

    // Demat table headers
    doc.setFillColor(15, 23, 42);
    doc.rect(15, yPos - 5, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("ISIN", 17, yPos);
    doc.text("Company", 55, yPos);
    doc.text("Sector", 120, yPos);
    doc.text("Qty", 155, yPos);
    doc.text("Value (INR)", 170, yPos);

    yPos += 8;

    MOCK_CAS_DATABASE.demat.forEach((holding, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos - 5, 180, 8, "F");
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.text(holding.isin, 17, yPos);
      doc.text(holding.company, 55, yPos);
      doc.text(holding.sector, 120, yPos);
      doc.text(holding.qty.toString(), 155, yPos);
      doc.text(holding.value.toLocaleString("en-IN"), 170, yPos);

      yPos += 8;
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 20, 210, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(
      "This is a sample CAS generated for demo purposes. For real CAS, login to NSDL/CDSL portal.",
      105,
      pageHeight - 12,
      { align: "center" }
    );
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 105, pageHeight - 7, { align: "center" });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="sample-cas-nsdl.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
