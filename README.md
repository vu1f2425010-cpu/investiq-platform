# 🚀 InvestIQ — AI-Powered Unified Investment Intelligence Platform

[![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq%20AI-Llama%203.3%2070B-orange?style=for-the-badge)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

**InvestIQ** is an institutional-grade, AI-powered investment intelligence platform that parses **ANY CAS (Consolidated Account Statement) PDF** from **NSDL, CDSL, CAMS, or KFintech** in real-time, completely in-memory with zero data retention.

It exposes hidden single-stock concentration across mutual funds, calculates cross-fund portfolio overlaps, simulates market crash drawdowns, and delivers guardrailed executive insights powered by **Groq Llama 3.3 70B**.

---

## 🌟 Key Features

### 1. 📂 Universal CAS PDF Parser
- Accepts password-protected (PAN) CAS statements from **NSDL**, **CDSL**, **CAMS**, and **KFintech**.
- In-memory regex and ISIN code normalization without database dependencies.
- Automatic fallback demo dataset so presentations and testing never break.
- **100% Privacy**: Client files are parsed in RAM and purged upon session termination.

### 2. 🔍 Hidden Stock Exposure & Overlap Diagnosis
- Discovers secretly multiplied equity risk where multiple mutual funds simultaneously hold identical underlying stocks (e.g. HDFC Bank, Reliance).
- Real-time **X-Ray Hover** tooltips revealing deep holdings inside individual mutual fund folios.

### 3. 💥 Interactive Crash Stress Tester
- Real-time slider from 0% to 40% market corrections.
- Computes exact rupee loss across asset classes (Equity, Fixed Income, Gold hedges).

### 4. ⚡ Groq AI Executive Intelligence Engine
- Powered by ultra-fast **Groq Llama 3.3 70B Versatile**.
- Structured multi-paragraph diagnostic reports and quick prompt buttons.
- Strict context-bound analysis to eliminate hallucinations.

### 5. 🌓 Dual-Theme System
- **Dark Black Theme** (Default): Futuristic glassmorphism with cyan and violet accents.
- **Off-White Theme**: Clean, high-contrast light mode.
- 1-click instant theme toggle in the navigation bar with `localStorage` persistence.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router, Turbopack)
- **Language**: TypeScript
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`)
- **Data Visualizations**: Recharts
- **PDF Engine**: PDF-Parse in-memory buffer processing
- **Styling**: Vanilla CSS Design System with CSS Variables

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/vu1f2425010-cpu/investiq-platform.git
cd investiq-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

InvestIQ is designed with a **zero-retention policy**:
- **No Database**: Statements are parsed in server memory and discarded immediately.
- **Client-Side Session Storage**: Parsed insights remain on your machine for the duration of the browser tab.

---

## 📄 Disclaimer

*InvestIQ is for analytical and educational purposes only. It does not provide SEBI-registered financial advisory services. Consult a qualified advisor before making investment decisions.*
