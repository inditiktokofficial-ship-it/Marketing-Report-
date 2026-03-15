import { useState, useRef } from "react";

const ACCENT = "#00FFB2";
const DARK = "#0A0E1A";
const CARD = "#111827";
const BORDER = "#1E2D40";

const styles = {
  "@import": "url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap')",
};

// ── helpers ──────────────────────────────────────────────────────────────────

async function callClaude(prompt, systemPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

function parseJSON(raw) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ── PDF generator (pure browser, no external lib) ────────────────────────────

function generatePDF(report, url) {
  // Build an HTML page then print-to-PDF via window.print()
  const win = window.open("", "_blank");
  const scoreColor = (s) => s >= 75 ? "#00FFB2" : s >= 50 ? "#FACC15" : "#F87171";
  const barHtml = (label, value, color) => `
    <div style="margin:10px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:13px;color:#CBD5E1">${label}</span>
        <span style="font-size:13px;font-weight:700;color:${color}">${value}/100</span>
      </div>
      <div style="background:#1E2D40;border-radius:4px;height:8px">
        <div style="width:${value}%;background:${color};height:8px;border-radius:4px;transition:width .4s"></div>
      </div>
    </div>`;

  const issueRows = (items) => items.map(i => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#E2E8F0">${i.issue}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40">
        <span style="padding:2px 10px;border-radius:20px;font-size:11px;background:${i.severity==="High"?"#7F1D1D":i.severity==="Medium"?"#78350F":"#14532D"};color:${i.severity==="High"?"#FCA5A5":i.severity==="Medium"?"#FDE68A":"#86EFAC"}">${i.severity}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#94A3B8;font-size:12px">${i.recommendation}</td>
    </tr>`).join("");

  const compRows = (comps) => comps.map(c => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#E2E8F0;font-weight:600">${c.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#94A3B8;font-size:12px">${c.strengths}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#94A3B8;font-size:12px">${c.weaknesses}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #1E2D40;color:#94A3B8;font-size:12px">${c.opportunity}</td>
    </tr>`).join("");

  win.document.write(`<!DOCTYPE html><html><head>
    <title>Marketing Report — ${url}</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#0A0E1A;color:#E2E8F0;font-family:'DM Sans',sans-serif;font-size:14px;padding:0}
      h1,h2,h3{font-family:'Syne',sans-serif}
      @media print{
        body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
        .no-print{display:none}
        .page-break{page-break-before:always}
      }
    </style>
  </head><body>
    <!-- COVER -->
    <div style="min-height:100vh;background:linear-gradient(135deg,#0A0E1A 0%,#0F1C2E 60%,#0A1628 100%);display:flex;flex-direction:column;justify-content:center;padding:80px 60px;position:relative;overflow:hidden">
      <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;background:radial-gradient(circle,rgba(0,255,178,0.08) 0%,transparent 70%);border-radius:50%"></div>
      <div style="position:absolute;bottom:-50px;left:-50px;width:300px;height:300px;background:radial-gradient(circle,rgba(0,120,255,0.06) 0%,transparent 70%);border-radius:50%"></div>
      <div style="position:relative;z-index:1">
        <div style="display:inline-block;background:rgba(0,255,178,0.1);border:1px solid rgba(0,255,178,0.3);padding:6px 18px;border-radius:20px;margin-bottom:32px">
          <span style="color:#00FFB2;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:'Syne',sans-serif">AI Marketing Intelligence</span>
        </div>
        <h1 style="font-size:52px;font-weight:800;line-height:1.1;margin-bottom:16px;background:linear-gradient(135deg,#ffffff 0%,#94A3B8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
          Marketing Audit<br>& Competitor<br>Analysis
        </h1>
        <div style="width:60px;height:3px;background:#00FFB2;margin:24px 0"></div>
        <p style="font-size:16px;color:#64748B;margin-bottom:8px">Website Analyzed</p>
        <p style="font-size:20px;color:#00FFB2;font-family:'Syne',sans-serif;font-weight:600">${url}</p>
        <p style="margin-top:48px;color:#334155;font-size:13px">${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
      </div>
    </div>

    <!-- SCORES -->
    <div class="page-break" style="padding:60px;background:#0A0E1A">
      <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">Overall Score</h2>
      <div style="width:40px;height:3px;background:#00FFB2;margin-bottom:40px"></div>
      <div style="display:flex;align-items:center;gap:48px;margin-bottom:48px">
        <div style="text-align:center">
          <div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${scoreColor(report.audit.overallScore)} ${report.audit.overallScore*3.6}deg,#1E2D40 0deg);display:flex;align-items:center;justify-content:center;position:relative">
            <div style="width:90px;height:90px;border-radius:50%;background:#0A0E1A;display:flex;align-items:center;justify-content:center">
              <span style="font-size:28px;font-weight:800;font-family:'Syne',sans-serif;color:${scoreColor(report.audit.overallScore)}">${report.audit.overallScore}</span>
            </div>
          </div>
          <p style="margin-top:8px;color:#64748B;font-size:12px">Overall Score</p>
        </div>
        <div style="flex:1">
          ${barHtml("SEO", report.audit.scores.seo, scoreColor(report.audit.scores.seo))}
          ${barHtml("Performance", report.audit.scores.performance, scoreColor(report.audit.scores.performance))}
          ${barHtml("Content Quality", report.audit.scores.content, scoreColor(report.audit.scores.content))}
          ${barHtml("UX / Conversion", report.audit.scores.ux, scoreColor(report.audit.scores.ux))}
        </div>
      </div>

      <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Executive Summary</h2>
      <div style="width:40px;height:3px;background:#00FFB2;margin-bottom:20px"></div>
      <p style="color:#94A3B8;line-height:1.8;font-size:14px">${report.audit.summary}</p>
    </div>

    <!-- ISSUES -->
    <div class="page-break" style="padding:60px;background:#0A0E1A">
      <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">Issues & Recommendations</h2>
      <div style="width:40px;height:3px;background:#00FFB2;margin-bottom:40px"></div>
      <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#1E2D40">
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Issue</th>
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Severity</th>
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Recommendation</th>
          </tr>
        </thead>
        <tbody>${issueRows(report.audit.issues)}</tbody>
      </table>
    </div>

    <!-- COMPETITORS -->
    <div class="page-break" style="padding:60px;background:#0A0E1A">
      <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">Competitor Analysis</h2>
      <div style="width:40px;height:3px;background:#00FFB2;margin-bottom:16px"></div>
      <p style="color:#94A3B8;margin-bottom:40px;line-height:1.7">${report.competitors.overview}</p>
      <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#1E2D40">
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Competitor</th>
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Strengths</th>
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Weaknesses</th>
            <th style="padding:14px;text-align:left;font-family:'Syne',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748B">Your Opportunity</th>
          </tr>
        </thead>
        <tbody>${compRows(report.competitors.list)}</tbody>
      </table>
    </div>

    <!-- STRATEGY -->
    <div class="page-break" style="padding:60px;background:#0A0E1A">
      <h2 style="font-size:28px;font-weight:700;margin-bottom:8px">90-Day Growth Strategy</h2>
      <div style="width:40px;height:3px;background:#00FFB2;margin-bottom:40px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px">
        ${["month1","month2","month3"].map((m,i)=>`
        <div style="background:#111827;border:1px solid #1E2D40;border-radius:12px;padding:24px">
          <div style="color:#00FFB2;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Month ${i+1}</div>
          <h3 style="font-size:16px;font-weight:700;margin-bottom:12px">${report.strategy[m].title}</h3>
          <ul style="padding-left:0;list-style:none">
            ${report.strategy[m].actions.map(a=>`<li style="display:flex;gap:8px;margin-bottom:8px;font-size:13px;color:#94A3B8"><span style="color:#00FFB2;flex-shrink:0">→</span>${a}</li>`).join("")}
          </ul>
        </div>`).join("")}
      </div>
      <div style="margin-top:48px;background:#111827;border:1px solid rgba(0,255,178,0.2);border-radius:12px;padding:32px">
        <h3 style="font-size:18px;font-weight:700;margin-bottom:16px">Quick Wins <span style="font-size:13px;color:#00FFB2">(Start Today)</span></h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${report.strategy.quickWins.map(w=>`<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;color:#94A3B8"><span style="color:#00FFB2;font-size:16px;line-height:1.3">✦</span>${w}</div>`).join("")}
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="padding:40px 60px;background:#060910;border-top:1px solid #1E2D40;text-align:center">
      <p style="color:#334155;font-size:12px">Generated by AI Marketing Agency Tool · ${new Date().toLocaleDateString()} · Powered by Claude AI</p>
    </div>

    <script>window.onload=()=>{window.print()}</script>
  </body></html>`);
  win.document.close();
}

// ── UI Components ─────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }) {
  const color = score >= 75 ? ACCENT : score >= 50 ? "#FACC15" : "#F87171";
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2D40" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: `rotate(90deg) translate(0px, -${size/2*2}px)`, fontSize: size/4, fontWeight: 800, fill: color, fontFamily: "Syne, sans-serif" }}
        transform={`rotate(90, ${size/2}, ${size/2})`}>
        {score}
      </text>
    </svg>
  );
}

function Bar({ label, value }) {
  const color = value >= 75 ? ACCENT : value >= 50 ? "#FACC15" : "#F87171";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "Syne, sans-serif" }}>{value}</span>
      </div>
      <div style={{ background: BORDER, borderRadius: 4, height: 6 }}>
        <div style={{ width: `${value}%`, background: color, height: 6, borderRadius: 4, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

const severityStyle = { High: { bg: "#7F1D1D", color: "#FCA5A5" }, Medium: { bg: "#78350F", color: "#FDE68A" }, Low: { bg: "#14532D", color: "#86EFAC" } };

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [url, setUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("audit");
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    if (!url.trim()) { setError("Please enter a website URL"); return; }
    setError("");
    setLoading(true);
    setReport(null);

    const SYSTEM = `You are an expert marketing analyst. Always respond ONLY with valid JSON, no markdown, no explanation.`;

    try {
      // Step 1: Audit
      setStep("Running website audit…");
      const auditRaw = await callClaude(
        `Analyze the website: ${url}${industry ? ` in the ${industry} industry` : ""}.
Return ONLY this JSON structure (fill realistic values, no placeholders):
{
  "overallScore": <number 0-100>,
  "scores": { "seo": <0-100>, "performance": <0-100>, "content": <0-100>, "ux": <0-100> },
  "summary": "<2-3 sentence executive summary>",
  "issues": [
    { "issue": "<specific issue>", "severity": "High|Medium|Low", "recommendation": "<action to fix>" },
    ... (6-8 issues total)
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}`, SYSTEM);

      const audit = parseJSON(auditRaw);
      if (!audit) throw new Error("Failed to parse audit data");

      // Step 2: Competitors
      setStep("Analyzing competitors…");
      const compRaw = await callClaude(
        `For website: ${url}${industry ? ` in the ${industry} industry` : ""}, identify 4 realistic competitors and analyze them.
Return ONLY this JSON:
{
  "overview": "<2 sentence overview of competitive landscape>",
  "list": [
    { "name": "<competitor name>", "strengths": "<key strengths>", "weaknesses": "<key weaknesses>", "opportunity": "<how to outperform them>" },
    ... (4 competitors)
  ]
}`, SYSTEM);

      const competitors = parseJSON(compRaw);
      if (!competitors) throw new Error("Failed to parse competitor data");

      // Step 3: Strategy
      setStep("Building 90-day strategy…");
      const stratRaw = await callClaude(
        `Create a 90-day marketing growth strategy for: ${url}${industry ? ` in the ${industry} industry` : ""}.
Return ONLY this JSON:
{
  "month1": { "title": "<month 1 focus>", "actions": ["<action>","<action>","<action>","<action>"] },
  "month2": { "title": "<month 2 focus>", "actions": ["<action>","<action>","<action>","<action>"] },
  "month3": { "title": "<month 3 focus>", "actions": ["<action>","<action>","<action>","<action>"] },
  "quickWins": ["<quick win 1>","<quick win 2>","<quick win 3>","<quick win 4>","<quick win 5>","<quick win 6>"]
}`, SYSTEM);

      const strategy = parseJSON(stratRaw);
      if (!strategy) throw new Error("Failed to parse strategy data");

      setReport({ audit, competitors, strategy });
      setTab("audit");
    } catch (e) {
      setError("Analysis failed: " + e.message);
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  const tabStyle = (t) => ({
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.5,
    background: tab === t ? ACCENT : "transparent",
    color: tab === t ? DARK : "#64748B",
    transition: "all .2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#E2E8F0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input { outline: none; }
        input::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #0A0E1A; }
        ::-webkit-scrollbar-thumb { background: #1E2D40; border-radius: 3px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .fade-in { animation: fadeIn .6s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${ACCENT}, #00A8FF)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>MARKETAI</div>
            <div style={{ fontSize: 11, color: "#334155", letterSpacing: 1, textTransform: "uppercase" }}>Agency Intelligence</div>
          </div>
        </div>
        {report && (
          <button onClick={() => generatePDF(report, url)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: ACCENT, color: DARK, border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: 0.5 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            Export PDF
          </button>
        )}
      </div>

      {/* Hero / Input */}
      {!report && !loading && (
        <div style={{ maxWidth: 760, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(0,255,178,0.08)", border: "1px solid rgba(0,255,178,0.2)", padding: "5px 16px", borderRadius: 20, marginBottom: 28 }}>
      