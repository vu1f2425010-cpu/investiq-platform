"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Animated counter
  useEffect(() => {
    const target = 1845320;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCounter(target);
        clearInterval(timer);
      } else {
        setCounter(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  // Parallax offset - safe for SSR
  const px = (mousePos.x / (typeof window !== "undefined" ? window.innerWidth : 1440) - 0.5) * 20;
  const py = (mousePos.y / (typeof window !== "undefined" ? window.innerHeight : 900) - 0.5) * 20;

  return (
    <div className="page-enter grid-bg" style={{ minHeight: "100vh", paddingTop: "60px" }}>
      {/* Hero Section */}
      <section
        ref={heroRef}
        style={{
          minHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            width: "650px",
            height: "650px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, rgba(129,140,248,0.06) 45%, transparent 70%)",
            top: "45%",
            left: "50%",
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
            transition: "transform 0.1s ease",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "24px",
            padding: "8px 20px",
            fontSize: "12px",
            color: "var(--accent-teal)",
            fontWeight: 800,
            letterSpacing: "1px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              background: "var(--accent-emerald)",
              borderRadius: "50%",
              display: "inline-block",
              boxShadow: "0 0 10px var(--accent-emerald)",
            }}
          />
          UNIVERSAL CAS ANALYSIS PLATFORM · POWERED BY GROQ AI
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 76px)",
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            maxWidth: "920px",
            marginBottom: "24px",
            color: "var(--text-primary)",
          }}
        >
          Your Portfolio's{" "}
          <span className="glow-text">Hidden Truths</span>
          <br />
          Revealed in Seconds
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            textAlign: "center",
            maxWidth: "640px",
            lineHeight: 1.7,
            marginBottom: "40px",
          }}
        >
          Upload any NSDL/CDSL CAS PDF — we parse, compute, and reveal what 37% sector concentration, 62% fund overlap,
          and hidden stock exposure mean for your wealth.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "60px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/upload"
            className="btn-primary"
            style={{
              fontSize: "16px",
              padding: "16px 40px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            Upload CAS PDF
            <span style={{ fontSize: "18px" }}>→</span>
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary"
            style={{
              fontSize: "16px",
              padding: "16px 40px",
              textDecoration: "none",
            }}
          >
            View Demo Dashboard
          </Link>
        </div>

        {/* Live counter metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            maxWidth: "960px",
            width: "100%",
          }}
        >
          {[
            { label: "Demo Portfolio Value", value: `₹${counter.toLocaleString("en-IN")}`, color: "var(--accent-teal)" },
            { label: "Risk Indicators", value: "4 Active", color: "var(--accent-amber)" },
            { label: "Hidden Exposures", value: "3 Found", color: "var(--accent-rose)" },
            { label: "Overlap Detected", value: "62%", color: "var(--accent-purple)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card"
              style={{
                textAlign: "center",
                padding: "20px",
              }}
            >
              <div
                className="mono"
                style={{ fontSize: "28px", fontWeight: 800, color: stat.color, marginBottom: "6px" }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="section-label">PLATFORM CAPABILITIES</div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              color: "var(--text-primary)",
            }}
          >
            Comprehensive Portfolio Intelligence
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "10px", fontSize: "16px" }}>
            Instant parsing and institutional-grade analytics for any CAS statement
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          <div className="glass-card">
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
              Hidden Overlap & Concentration
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              Discovers secretly multiplied exposure across multiple mutual funds holding identical underlying stocks like HDFC Bank and Reliance.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
              Groq Llama 3.3 70B AI Engine
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              Ultra-fast AI explanations bound strictly to your computed numbers — providing expert rebalancing guidance without hallucinations.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>💥</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
              Real-Time Crash Stress Test
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              Simulate market corrections from 5% to 50% with an interactive slider and see exact rupee impact across asset classes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            marginBottom: "16px",
            color: "var(--text-primary)",
          }}
        >
          Ready to see what's{" "}
          <span className="glow-text">really</span> in your portfolio?
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "36px" }}>
          Upload your CAS from NSDL or CDSL portal. Takes 30 seconds.
        </p>
        <Link
          href="/upload"
          className="btn-primary"
          style={{
            fontSize: "17px",
            padding: "16px 48px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🚀 Upload CAS & Analyze
        </Link>
        <div style={{ marginTop: "18px", fontSize: "13px", color: "var(--text-muted)" }}>
          100% In-Memory Processing · No Data Stored · Free & Private
        </div>
      </section>
    </div>
  );
}
