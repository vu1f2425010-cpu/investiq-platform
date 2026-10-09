"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Upload File", "Enter Password", "Processing", "Complete"];

export default function UploadPage() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "warning" | "error" } | null>(null);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Magnetic button effect
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);

      if (dist < 100) {
        const strength = (100 - dist) / 100;
        setBtnPos({
          x: (e.clientX - cx) * strength * 0.4,
          y: (e.clientY - cy) * strength * 0.4,
        });
      } else {
        setBtnPos({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [step]);

  const showToast = (msg: string, type: "success" | "warning" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setStep(1);
    } else {
      showToast("Please upload a PDF file", "error");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep(1);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !consent) {
      showToast("Please upload a file and accept the terms", "error");
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (password) formData.append("password", password);

      const res = await fetch("/api/parse-cas", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      sessionStorage.setItem("casData", JSON.stringify(data));

      setStep(3);
      showToast(data.parse_message || "Analysis complete!", data.is_mock ? "warning" : "success");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch {
      showToast("Failed to process. Using demo data.", "warning");
      const mockRes = await fetch("/api/parse-cas", { method: "POST", body: new FormData() });
      const mockData = await mockRes.json();
      sessionStorage.setItem("casData", JSON.stringify(mockData));
      setStep(3);
      setTimeout(() => router.push("/dashboard"), 1200);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCAS = async () => {
    try {
      showToast("Generating sample CAS PDF...", "success");
      const res = await fetch("/api/generate-dummy-cas");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-cas-nsdl.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to generate sample CAS", "error");
    }
  };

  return (
    <div
      className="page-enter grid-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px 40px",
        position: "relative",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div className="section-label">STEP {step + 1} OF {STEPS.length}</div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-1px", marginTop: "8px", color: "var(--text-primary)" }}>
            {step === 0 && <>Upload Your <span className="glow-text">CAS</span></>}
            {step === 1 && <>Enter <span className="glow-text">PAN Password</span></>}
            {step === 2 && <>Analyzing Your <span className="glow-text">Portfolio</span></>}
            {step === 3 && <><span className="glow-text">Analysis Complete!</span> ✅</>}
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "15px" }}>
            {step === 0 && "Drag & drop your NSDL/CDSL CAS PDF or click to browse"}
            {step === 1 && "Most CAS files are password-protected with your PAN (e.g. ABCDE1234F)"}
            {step === 2 && "Parsing your CAS and computing insights with Groq AI..."}
            {step === 3 && "Redirecting to your dashboard..."}
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
          {STEPS.map((s, idx) => (
            <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "0 0 auto" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background:
                      idx <= step
                        ? "var(--gradient-teal)"
                        : "var(--bg-card)",
                    border: idx === step ? "2px solid var(--accent-teal)" : "2px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: idx <= step ? "#050B18" : "var(--text-muted)",
                    boxShadow: idx === step ? "0 0 15px var(--accent-teal)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {idx < step ? "✓" : idx + 1}
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    background: idx < step ? "var(--accent-teal)" : "var(--border)",
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div>
            {/* Drop Zone */}
            <div
              ref={dropRef}
              className={`upload-zone ${dragging ? "dragging" : ""}`}
              style={{
                padding: "60px 40px",
                textAlign: "center",
                borderRadius: "20px",
                cursor: "pointer",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                {dragging ? "📂" : "📄"}
              </div>

              <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
                {dragging ? "Release to upload" : "Drop your CAS PDF here"}
              </div>

              <div style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
                Supports NSDL · CDSL · CAMS · KFintech formats
              </div>

              <button className="btn-secondary" style={{ pointerEvents: "none" }}>
                Browse Files
              </button>
            </div>

            {/* Sample CAS download */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={downloadSampleCAS}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-teal)",
                  fontSize: "14px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                ↓ Download Sample CAS PDF to test
              </button>
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "16px 20px",
                background: "var(--card-safe-bg)",
                border: "1px solid var(--card-safe-border)",
                borderRadius: "12px",
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              🔒 <strong style={{ color: "var(--accent-emerald)" }}>Privacy Guaranteed:</strong> PDF parsing runs in-memory and
              is never stored in any database. Session ends = all data is purged.
            </div>
          </div>
        )}

        {step === 1 && file && (
          <div className="glass-card">
            {/* File info */}
            <div
              style={{
                padding: "16px 20px",
                background: "rgba(0, 212, 255, 0.08)",
                border: "1px solid var(--border-bright)",
                borderRadius: "10px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "24px" }}>📄</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{file.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div
                className="badge badge-safe"
                style={{ marginLeft: "auto" }}
              >
                Ready
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--text-secondary)" }}>
                PAN Password (optional — leave blank for demo)
              </label>
              <input
                type="password"
                placeholder="e.g. ABCDE1234F"
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                maxLength={10}
                style={{ textTransform: "uppercase", letterSpacing: "4px", fontFamily: "var(--font-mono)" }}
              />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Most CAS statements are locked with your PAN uppercase
              </div>
            </div>

            {/* Consent */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
                marginBottom: "24px",
                padding: "16px",
                background: "var(--bg-card-subtle)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--accent-teal)" }}
              />
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                I understand this is an AI-powered intelligence platform. Analysis is for informational purposes and not SEBI-registered financial advisory.
              </span>
            </label>

            {/* Submit button */}
            <button
              ref={btnRef}
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!consent || loading}
              style={{
                width: "100%",
                fontSize: "16px",
                padding: "16px",
                transform: `translate(${btnPos.x}px, ${btnPos.y}px)`,
                transition: "transform 0.1s ease, box-shadow 0.2s ease, opacity 0.2s",
                opacity: consent ? 1 : 0.5,
              }}
            >
              {loading ? "Processing..." : "🚀 Analyze Portfolio Now"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-card" style={{ textAlign: "center", padding: "48px 32px" }}>
            {/* Loading animation */}
            <div
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                border: "4px solid var(--border)",
                borderTop: "4px solid var(--accent-teal)",
                animation: "spin 1s linear infinite",
                margin: "0 auto 24px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>
              Extracting & Computing Intelligence...
            </div>

            {[
              "Parsing ISIN codes & fund folios...",
              "Computing hidden stock overlaps...",
              "Calculating sector concentration risks...",
              "Running Groq AI portfolio analysis...",
            ].map((msg, idx) => (
              <div
                key={msg}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--bg-card-subtle)",
                  border: "1px solid var(--border)",
                  marginTop: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  animation: `fadeIn 0.5s ease ${idx * 0.25}s both`,
                }}
              >
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
                ✦ {msg}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="glass-card" style={{ textAlign: "center", padding: "48px 32px" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "22px", fontWeight: 900, marginBottom: "8px" }}>
              <span className="glow-text">Analysis Complete!</span>
            </div>
            <div style={{ color: "var(--text-secondary)" }}>
              Loading interactive dashboard...
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="toast"
          style={{
            borderColor:
              toast.type === "success"
                ? "var(--accent-emerald)"
                : toast.type === "warning"
                ? "var(--accent-amber)"
                : "var(--accent-rose)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span>
              {toast.type === "success" ? "✅" : toast.type === "warning" ? "⚠️" : "❌"}
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {toast.msg}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
