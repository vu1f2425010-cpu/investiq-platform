const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

function createCASPDF(data, outputPath) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Header Banner
  doc.setFillColor(5, 11, 24);
  doc.rect(0, 0, 210, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CONSOLIDATED ACCOUNT STATEMENT (CAS)", 105, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 212, 255);
  doc.text("NSDL · CDSL · CAMS · KFINTECH UNIFIED STATEMENT", 105, 25, { align: "center" });
  doc.setTextColor(200, 210, 230);
  doc.setFontSize(9);
  doc.text(`Statement Period: ${data.period} | Generated on: ${data.asOfDate}`, 105, 33, { align: "center" });

  // Investor Details Card
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("1. INVESTOR DEMOGRAPHIC DETAILS", 15, 52);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 56, 180, 24, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Investor Name : ${data.investorName.toUpperCase()}`, 18, 63);
  doc.text(`PAN Number    : ${data.pan}`, 18, 70);
  doc.text(`Email Address : ${data.email}`, 18, 77);

  doc.text(`Mobile No.  : ${data.mobile}`, 115, 63);
  doc.text(`KYC Status  : VERIFIED (CVL/NDML)`, 115, 70);
  doc.text(`City / State: ${data.city}`, 115, 77);

  // Portfolio Valuation Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. CONSOLIDATED PORTFOLIO VALUATION", 15, 90);

  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.rect(15, 94, 180, 20, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text(`Total Portfolio Value: INR ${data.totalValue.toLocaleString("en-IN")}`, 20, 103);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Mutual Funds: INR ${data.mfValue.toLocaleString("en-IN")}`, 20, 110);
  doc.text(`Equities / Demat: INR ${data.dematValue.toLocaleString("en-IN")}`, 90, 110);
  doc.text(`Folios Count: ${data.folios.length} | Stocks: ${data.demat.length}`, 145, 110);

  // Mutual Funds Section
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. MUTUAL FUND FOLIOS & HOLDINGS", 15, 124);

  let y = 129;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(15, y, 180, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Folio No.", 18, y + 5);
  doc.text("ISIN", 48, y + 5);
  doc.text("Scheme Name", 80, y + 5);
  doc.text("Units", 138, y + 5);
  doc.text("NAV (INR)", 158, y + 5);
  doc.text("Value (INR)", 175, y + 5);

  y += 7;

  data.folios.forEach((f, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 7, "F");
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(`Folio No: ${f.folio}`, 18, y + 5);
    doc.text(`ISIN: ${f.isin}`, 48, y + 5);
    doc.text(`Scheme: ${f.scheme.substring(0, 26)}`, 80, y + 5);
    doc.text(f.units.toFixed(2), 138, y + 5);
    doc.text(f.nav.toFixed(2), 158, y + 5);
    doc.text(f.value.toLocaleString("en-IN"), 175, y + 5);

    y += 7;
  });

  y += 6;

  // Demat Holdings Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("4. DEMAT ACCOUNT HOLDINGS (EQUITIES / ETF)", 15, y);

  y += 5;

  doc.setFillColor(15, 23, 42);
  doc.rect(15, y, 180, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("ISIN", 18, y + 5);
  doc.text("Company / Security Name", 55, y + 5);
  doc.text("Sector", 120, y + 5);
  doc.text("Qty", 155, y + 5);
  doc.text("Value (INR)", 175, y + 5);

  y += 7;

  data.demat.forEach((d, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 7, "F");
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(`ISIN: ${d.isin}`, 18, y + 5);
    doc.text(d.company, 55, y + 5);
    doc.text(d.sector, 120, y + 5);
    doc.text(d.qty.toString(), 155, y + 5);
    doc.text(d.value.toLocaleString("en-IN"), 175, y + 5);

    y += 7;
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(5, 11, 24);
  doc.rect(0, pageHeight - 16, 210, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(
    "CONFIDENTIAL · Consolidated Account Statement for personal wealth analysis · InvestIQ Intelligence Platform",
    105,
    pageHeight - 9,
    { align: "center" }
  );
  doc.text(`Password Protected PDF · Default Password is PAN: ${data.pan}`, 105, pageHeight - 4, { align: "center" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${buffer.length} bytes)`);
}

// Ensure output directories exist
const publicSamplesDir = path.join(__dirname, "..", "public", "samples");
if (!fs.existsSync(publicSamplesDir)) {
  fs.mkdirSync(publicSamplesDir, { recursive: true });
}

// Portfolio 1: High Tech & Financial Overlap (Priya Patel)
const portfolio1 = {
  investorName: "Priya Patel",
  pan: "ABCDE1234F",
  email: "priya.patel@investor.in",
  mobile: "XXXXXX7812",
  city: "Ahmedabad, Gujarat",
  period: "01-Apr-2023 to 31-Mar-2024",
  asOfDate: "31-Mar-2024",
  totalValue: 3840000,
  mfValue: 2480000,
  dematValue: 1360000,
  folios: [
    {
      folio: "12345/67",
      isin: "INF879O01019",
      scheme: "Parag Parikh Flexi Cap Fund - Direct Growth",
      units: 1420.55,
      nav: 72.4,
      value: 780000,
    },
    {
      folio: "45678/90",
      isin: "INF179K01BE2",
      scheme: "HDFC Flexi Cap Fund - Direct Plan - Growth",
      units: 450.2,
      nav: 1650.8,
      value: 720000,
    },
    {
      folio: "78901/23",
      isin: "INF769K01169",
      scheme: "Mirae Asset Large Cap Fund - Direct Growth",
      units: 4850.1,
      nav: 110.2,
      value: 580000,
    },
    {
      folio: "32109/87",
      isin: "INF109K01BE8",
      scheme: "ICICI Prudential Bluechip Fund - Direct Growth",
      units: 3800.0,
      nav: 105.2,
      value: 400000,
    },
  ],
  demat: [
    { isin: "INE002A01018", company: "Reliance Industries Ltd", sector: "Energy", qty: 250, value: 450000 },
    { isin: "INE040A01034", company: "HDFC Bank Ltd", sector: "Financial Services", qty: 280, value: 420000 },
    { isin: "INE009A01021", company: "Infosys Ltd", sector: "Technology", qty: 150, value: 240000 },
    { isin: "INE154A01025", company: "ITC Ltd", sector: "Consumer Goods", qty: 400, value: 160000 },
    { isin: "INE018A01030", company: "Larsen & Toubro Ltd", sector: "Capital Goods", qty: 25, value: 90000 },
  ],
};

// Portfolio 2: Balanced Growth & Gold Hedge (Vikramaditya Verma)
const portfolio2 = {
  investorName: "Vikramaditya Verma",
  pan: "XYZPA9876K",
  email: "vikram.verma@investor.in",
  mobile: "XXXXXX9045",
  city: "Bengaluru, Karnataka",
  period: "01-Apr-2023 to 31-Mar-2024",
  asOfDate: "31-Mar-2024",
  totalValue: 5210000,
  mfValue: 3450000,
  dematValue: 1760000,
  folios: [
    {
      folio: "99881/22",
      isin: "INF966L01AA3",
      scheme: "Quant Active Fund - Direct Plan - Growth",
      units: 1850.4,
      nav: 620.5,
      value: 1150000,
    },
    {
      folio: "77665/44",
      isin: "INF204K01704",
      scheme: "Nippon India Small Cap Fund - Growth",
      units: 6800.0,
      nav: 140.2,
      value: 950000,
    },
    {
      folio: "33445/11",
      isin: "INF200K01042",
      scheme: "SBI Magnum Gilt Fund - Direct Growth",
      units: 12500.0,
      nav: 68.0,
      value: 850000,
    },
    {
      folio: "55443/88",
      isin: "INF179KB1EU3",
      scheme: "HDFC Gold ETF Fund of Fund - Direct Growth",
      units: 25000.0,
      nav: 20.0,
      value: 500000,
    },
  ],
  demat: [
    { isin: "INE155A01022", company: "Tata Motors Ltd", sector: "Automobile", qty: 600, value: 540000 },
    { isin: "INE044A01036", company: "Sun Pharmaceutical Ind", sector: "Healthcare", qty: 320, value: 480000 },
    { isin: "INE397D01024", company: "Bharti Airtel Ltd", sector: "Telecommunication", qty: 350, value: 420000 },
    { isin: "INE062A01020", company: "State Bank of India", sector: "Financial Services", qty: 260, value: 180000 },
    { isin: "INE021A01026", company: "Asian Paints Ltd", sector: "Consumer Goods", qty: 50, value: 140000 },
  ],
};

// Generate files in root and in public/samples/
createCASPDF(portfolio1, path.join(__dirname, "..", "sample_cas_priya_patel.pdf"));
createCASPDF(portfolio1, path.join(publicSamplesDir, "sample_cas_priya_patel.pdf"));

createCASPDF(portfolio2, path.join(__dirname, "..", "sample_cas_vikram_verma.pdf"));
createCASPDF(portfolio2, path.join(publicSamplesDir, "sample_cas_vikram_verma.pdf"));

console.log("All sample CAS PDF files generated successfully!");
