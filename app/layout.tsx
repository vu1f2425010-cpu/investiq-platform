import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "InvestIQ - AI-Powered Unified Investment Intelligence Platform",
  description:
    "Upload your CAS (Consolidated Account Statement) and get deep AI-powered insights into your investment portfolio. Hidden exposure, concentration risk, and more.",
  keywords: "CAS, NSDL, CDSL, mutual funds, portfolio analysis, investment intelligence, XIRR",
  openGraph: {
    title: "InvestIQ - AI Investment Intelligence",
    description: "Upload CAS → Get AI-powered portfolio insights instantly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="grid-bg">
        <CustomCursor />
        <Nav />
        <main style={{ paddingTop: "70px" }}>{children}</main>
      </body>
    </html>
  );
}
