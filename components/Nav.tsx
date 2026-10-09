"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("investiq_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("investiq_theme", nextTheme);
  };

  return (
    <nav className="nav">
      <div className="nav-logo">
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <span className="glow-text" style={{ fontSize: "20px" }}>Invest</span>
          <span style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 800 }}>IQ</span>
          <span
            style={{
              marginLeft: "8px",
              fontSize: "10px",
              background: "rgba(0, 212, 255, 0.12)",
              border: "1px solid var(--border-bright)",
              color: "var(--accent-teal)",
              padding: "2px 8px",
              borderRadius: "6px",
              letterSpacing: "1px",
              fontWeight: 800,
            }}
          >
            GROQ AI
          </span>
        </Link>
      </div>

      <ul className="nav-links">
        <li>
          <Link
            href="/"
            style={{
              color: pathname === "/" ? "var(--accent-teal)" : undefined,
              fontWeight: pathname === "/" ? 800 : 500,
            }}
          >
            Platform
          </Link>
        </li>
        <li>
          <Link
            href="/upload"
            style={{
              color: pathname === "/upload" ? "var(--accent-teal)" : undefined,
              fontWeight: pathname === "/upload" ? 800 : 500,
            }}
          >
            Upload CAS
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard"
            style={{
              color: pathname === "/dashboard" ? "var(--accent-teal)" : undefined,
              fontWeight: pathname === "/dashboard" ? 800 : 500,
            }}
          >
            Dashboard
          </Link>
        </li>
      </ul>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {/* Theme Toggle Button */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle theme"
          >
            <span>{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
          </button>
        )}

        <Link
          href="/upload"
          className="btn-primary"
          style={{ padding: "8px 18px", fontSize: "13px", textDecoration: "none" }}
        >
          Analyze Portfolio →
        </Link>
      </div>
    </nav>
  );
}
