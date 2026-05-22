"use client";

import { useState, useEffect } from "react";

interface SAMQuestionnaireProps {
  onComplete: (valence: number, arousal: number, dominance: number) => void;
  onSkip: () => void;
}

type Step = "intro" | 1 | 2 | 3;

// ── Flow cloud SVG base shape helpers ────────────────────────────────────────

function FlowCloud({
  size = 64,
  children,
  style,
}: {
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  const r2 = s * 0.17;
  const r3 = s * 0.19;
  const r4 = s * 0.16;
  const r5 = s * 0.14;

  return (
    <svg
      viewBox={`0 0 ${s} ${s}`}
      width={s}
      height={s}
      style={style}
      aria-hidden="true"
    >
      {/* Cloud bumps */}
      <circle cx={cx} cy={cy - r1 * 0.55} r={r1} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      <circle cx={cx - r1 * 0.88} cy={cy} r={r2} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      <circle cx={cx + r1 * 0.88} cy={cy} r={r3} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      <circle cx={cx - r1 * 0.35} cy={cy - r1 * 0.95} r={r4} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      <circle cx={cx + r1 * 0.35} cy={cy - r1 * 0.95} r={r5} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      {/* Cloud base ellipse to fill bottom gaps */}
      <ellipse cx={cx} cy={cy + r1 * 0.1} rx={r1 * 1.55} ry={r1 * 0.75} fill="white" stroke="#2d5a7a" strokeWidth={s * 0.025} />
      {/* Green accent dot */}
      <circle cx={cx + r1 * 1.1} cy={cy - r1 * 0.7} r={s * 0.045} fill="#4ADE80" />
      {/* Children (expressions) rendered on top */}
      {children}
    </svg>
  );
}

// ── Expression layers per variant ────────────────────────────────────────────

function Eyes({ s, open = true }: { s: number; open?: boolean }) {
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  const ey = cy - r1 * 0.08;
  const ex = r1 * 0.38;
  if (!open) {
    return (
      <>
        <path d={`M${cx - ex - r1 * 0.12},${ey} Q${cx - ex},${ey - r1 * 0.18} ${cx - ex + r1 * 0.12},${ey}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />
        <path d={`M${cx + ex - r1 * 0.12},${ey} Q${cx + ex},${ey - r1 * 0.18} ${cx + ex + r1 * 0.12},${ey}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx={cx - ex} cy={ey} r={r1 * 0.11} fill="#2d5a7a" />
      <circle cx={cx + ex} cy={ey} r={r1 * 0.11} fill="#2d5a7a" />
    </>
  );
}

function Mouth({ s, type }: { s: number; type: "very-sad" | "sad" | "neutral" | "happy" | "very-happy" }) {
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  const my = cy + r1 * 0.38;
  const mx = r1 * 0.38;

  if (type === "very-sad") {
    return <path d={`M${cx - mx},${my + r1 * 0.15} Q${cx},${my - r1 * 0.28} ${cx + mx},${my + r1 * 0.15}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />;
  }
  if (type === "sad") {
    return <path d={`M${cx - mx},${my + r1 * 0.06} Q${cx},${my - r1 * 0.12} ${cx + mx},${my + r1 * 0.06}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />;
  }
  if (type === "neutral") {
    return <line x1={cx - mx} y1={my} x2={cx + mx} y2={my} stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />;
  }
  if (type === "happy") {
    return <path d={`M${cx - mx},${my - r1 * 0.06} Q${cx},${my + r1 * 0.18} ${cx + mx},${my - r1 * 0.06}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />;
  }
  // very-happy
  return <path d={`M${cx - mx},${my - r1 * 0.08} Q${cx},${my + r1 * 0.28} ${cx + mx},${my - r1 * 0.08}`} fill="none" stroke="#2d5a7a" strokeWidth={s * 0.03} strokeLinecap="round" />;
}

// ── Valence variants ──────────────────────────────────────────────────────────

function FlowVerySad({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="very-sad" />
      {/* Tear drops */}
      <ellipse cx={cx - r1 * 0.35} cy={cy + r1 * 0.28} rx={s * 0.028} ry={s * 0.05} fill="#93C5FD" />
      <ellipse cx={cx + r1 * 0.42} cy={cy + r1 * 0.38} rx={s * 0.028} ry={s * 0.05} fill="#93C5FD" />
    </FlowCloud>
  );
}

function FlowSad({ size = 64 }: { size?: number }) {
  const s = size;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="sad" />
    </FlowCloud>
  );
}

function FlowNeutral({ size = 64 }: { size?: number }) {
  const s = size;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="neutral" />
    </FlowCloud>
  );
}

function FlowHappy({ size = 64 }: { size?: number }) {
  const s = size;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="happy" />
    </FlowCloud>
  );
}

function FlowVeryHappy({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="very-happy" />
      {/* Stars */}
      <text x={cx - r1 * 1.55} y={s * 0.22} fontSize={s * 0.13} fill="#FBBF24" textAnchor="middle">★</text>
      <text x={cx + r1 * 1.6} y={s * 0.28} fontSize={s * 0.1} fill="#FBBF24" textAnchor="middle">★</text>
      <text x={cx} y={s * 0.1} fontSize={s * 0.09} fill="#FBBF24" textAnchor="middle">★</text>
    </FlowCloud>
  );
}

// ── Arousal variants ──────────────────────────────────────────────────────────

function FlowAsleep({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} open={false} />
      <Mouth s={s} type="neutral" />
      {/* Zzz */}
      <text x={cx + s * 0.28} y={s * 0.18} fontSize={s * 0.12} fill="#94A3B8" fontWeight="bold">z</text>
      <text x={cx + s * 0.36} y={s * 0.1} fontSize={s * 0.1} fill="#94A3B8" fontWeight="bold">z</text>
      <text x={cx + s * 0.43} y={s * 0.04} fontSize={s * 0.08} fill="#94A3B8" fontWeight="bold">z</text>
    </FlowCloud>
  );
}

function FlowCalm({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="neutral" />
      {/* Slow wave below */}
      <path
        d={`M${cx - s * 0.28},${s * 0.88} Q${cx - s * 0.14},${s * 0.82} ${cx},${s * 0.88} Q${cx + s * 0.14},${s * 0.94} ${cx + s * 0.28},${s * 0.88}`}
        fill="none"
        stroke="#93C5FD"
        strokeWidth={s * 0.03}
        strokeLinecap="round"
      />
    </FlowCloud>
  );
}

function FlowActive({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="happy" />
      {/* Small lightning bolts */}
      <path d={`M${cx - r1 * 1.5},${cy - r1 * 0.3} l${s * 0.06},-${s * 0.08} l-${s * 0.03},0 l${s * 0.06},-${s * 0.07}`} fill="none" stroke="#FBBF24" strokeWidth={s * 0.03} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${cx + r1 * 1.3},${cy - r1 * 0.4} l${s * 0.06},-${s * 0.08} l-${s * 0.03},0 l${s * 0.06},-${s * 0.07}`} fill="none" stroke="#FBBF24" strokeWidth={s * 0.03} strokeLinecap="round" strokeLinejoin="round" />
    </FlowCloud>
  );
}

function FlowVeryActive({ size = 64 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="very-happy" />
      {/* Large lightning bolts */}
      <path d={`M${cx - r1 * 1.65},${cy - r1 * 0.1} l${s * 0.09},-${s * 0.14} l-${s * 0.04},0 l${s * 0.09},-${s * 0.12}`} fill="none" stroke="#F59E0B" strokeWidth={s * 0.035} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${cx + r1 * 1.38},${cy - r1 * 0.2} l${s * 0.09},-${s * 0.14} l-${s * 0.04},0 l${s * 0.09},-${s * 0.12}`} fill="none" stroke="#F59E0B" strokeWidth={s * 0.035} strokeLinecap="round" strokeLinejoin="round" />
      {/* Vibration lines */}
      <line x1={cx - r1 * 1.85} y1={cy + r1 * 0.15} x2={cx - r1 * 2.1} y2={cy + r1 * 0.15} stroke="#FDE68A" strokeWidth={s * 0.025} strokeLinecap="round" />
      <line x1={cx + r1 * 1.6} y1={cy + r1 * 0.15} x2={cx + r1 * 1.85} y2={cy + r1 * 0.15} stroke="#FDE68A" strokeWidth={s * 0.025} strokeLinecap="round" />
    </FlowCloud>
  );
}

// ── Dominance variants (size progression) ────────────────────────────────────

function FlowDominance({ size = 64, cape = false }: { size?: number; cape?: boolean }) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type={size > 55 ? "very-happy" : size > 40 ? "happy" : "neutral"} />
      {cape && (
        <path
          d={`M${cx - r1 * 0.6},${cy + r1 * 0.55} Q${cx},${cy + r1 * 1.2} ${cx + r1 * 0.6},${cy + r1 * 0.55} Q${cx + r1 * 0.1},${cy + r1 * 0.85} ${cx - r1 * 0.1},${cy + r1 * 0.85} Z`}
          fill="#EF4444"
          stroke="#991B1B"
          strokeWidth={s * 0.02}
        />
      )}
    </FlowCloud>
  );
}

// ── Intro waving Flow ─────────────────────────────────────────────────────────

function FlowWaving({ size = 80 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s * 0.56;
  const r1 = s * 0.22;
  return (
    <FlowCloud size={s}>
      <Eyes s={s} />
      <Mouth s={s} type="happy" />
      {/* Waving arm */}
      <path
        d={`M${cx + r1 * 1.3},${cy} Q${cx + r1 * 1.9},${cy - r1 * 0.5} ${cx + r1 * 1.7},${cy - r1 * 1.1}`}
        fill="none"
        stroke="#2d5a7a"
        strokeWidth={s * 0.04}
        strokeLinecap="round"
      />
    </FlowCloud>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

const VALENCE_OPTIONS = [
  { value: 1, label: "Muy triste",   node: (s: number) => <FlowVerySad size={s} /> },
  { value: 2, label: "Triste",       node: (s: number) => <FlowSad size={s} /> },
  { value: 3, label: "Neutral",      node: (s: number) => <FlowNeutral size={s} /> },
  { value: 4, label: "Contento",     node: (s: number) => <FlowHappy size={s} /> },
  { value: 5, label: "Muy contento", node: (s: number) => <FlowVeryHappy size={s} /> },
];

const AROUSAL_OPTIONS = [
  { value: 1, label: "Dormido",         node: (s: number) => <FlowAsleep size={s} /> },
  { value: 2, label: "Tranquilo",       node: (s: number) => <FlowCalm size={s} /> },
  { value: 3, label: "Normal",          node: (s: number) => <FlowNeutral size={s} /> },
  { value: 4, label: "Activo",          node: (s: number) => <FlowActive size={s} /> },
  { value: 5, label: "Muy activo",      node: (s: number) => <FlowVeryActive size={s} /> },
];

const DOMINANCE_SIZES = [28, 38, 52, 62, 72];
const DOMINANCE_OPTIONS = [
  { value: 1, label: "Sin control",      size: DOMINANCE_SIZES[0], cape: false },
  { value: 2, label: "Poco control",     size: DOMINANCE_SIZES[1], cape: false },
  { value: 3, label: "Normal",           size: DOMINANCE_SIZES[2], cape: false },
  { value: 4, label: "Con control",      size: DOMINANCE_SIZES[3], cape: false },
  { value: 5, label: "Total control",    size: DOMINANCE_SIZES[4], cape: true  },
];

const STEP_CONFIG = {
  1: { title: "Valencia",    question: "¿Cómo es tu ánimo ahora?" },
  2: { title: "Activación",  question: "¿Qué tanta energía sientes?" },
  3: { title: "Dominancia",  question: "¿Sientes que tienes el control?" },
} as const;

// ── Main component ────────────────────────────────────────────────────────────

export default function SAMQuestionnaire({ onComplete, onSkip }: SAMQuestionnaireProps) {
  const [step, setStep] = useState<Step>("intro");
  const [visible, setVisible] = useState(false);
  const [valence, setValence] = useState<number | null>(null);
  const [arousal, setArousal] = useState<number | null>(null);
  const [dominance, setDominance] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  function fadeToStep(next: Step) {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, 280);
  }

  function handleNext() {
    if (step === "intro") { fadeToStep(1); return; }
    if (step === 1) { fadeToStep(2); return; }
    if (step === 2) { fadeToStep(3); return; }
    if (step === 3) {
      onComplete(valence ?? 3, arousal ?? 3, dominance ?? 3);
    }
  }

  function currentSelection(): number | null {
    if (step === 1) return valence;
    if (step === 2) return arousal;
    if (step === 3) return dominance;
    return null;
  }

  const canAdvance = step === "intro" || currentSelection() !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cuestionario SAM"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0,0,0,0.80)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <style>{`
        @keyframes samFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes samWave {
          0%, 100% { transform: rotate(-8deg); }
          50%       { transform: rotate(8deg); }
        }
        .sam-card-hover:hover {
          border-color: #4A7FA5 !important;
          background: #EFF6FF !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* Card */}
      <div
        style={{
          backgroundColor: "#F5F0E8",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "600px",
          padding: "32px 28px 24px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        {step === "intro" ? (
          <IntroStep onNext={handleNext} onSkip={onSkip} />
        ) : (
          <QuestionStep
            step={step as 1 | 2 | 3}
            valence={valence}
            arousal={arousal}
            dominance={dominance}
            setValence={setValence}
            setArousal={setArousal}
            setDominance={setDominance}
            canAdvance={canAdvance}
            onNext={handleNext}
            onSkip={onSkip}
          />
        )}
      </div>
    </div>
  );
}

// ── Intro step ────────────────────────────────────────────────────────────────

function IntroStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-block", animation: "samWave 1.4s ease-in-out infinite", transformOrigin: "70% 80%" }}>
        <FlowWaving size={88} />
      </div>
      <h2 style={{ marginTop: "16px", fontSize: "22px", fontWeight: 700, color: "#1e3a4f", letterSpacing: "-0.01em" }}>
        ¿Cómo te sientes ahora?
      </h2>
      <p style={{ marginTop: "8px", fontSize: "14px", color: "#5A7A8A", lineHeight: 1.6, maxWidth: "380px", margin: "8px auto 0" }}>
        Tomémonos un momento para registrar tu estado emocional. Son solo 3 preguntas rápidas.
      </p>

      <button
        onClick={onNext}
        style={{
          marginTop: "28px",
          backgroundColor: "#4A7FA5",
          color: "white",
          border: "none",
          borderRadius: "12px",
          padding: "12px 36px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "opacity 0.15s",
          display: "block",
          width: "100%",
          maxWidth: "260px",
          margin: "28px auto 0",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        Comenzar
      </button>

      <button
        onClick={onSkip}
        style={{
          marginTop: "14px",
          background: "none",
          border: "none",
          fontSize: "13px",
          color: "#94A3B8",
          cursor: "pointer",
          textDecoration: "underline",
          display: "block",
          margin: "14px auto 0",
        }}
      >
        Omitir
      </button>
    </div>
  );
}

// ── Question step ─────────────────────────────────────────────────────────────

function QuestionStep({
  step,
  valence, arousal, dominance,
  setValence, setArousal, setDominance,
  canAdvance, onNext, onSkip,
}: {
  step: 1 | 2 | 3;
  valence: number | null;
  arousal: number | null;
  dominance: number | null;
  setValence: (v: number) => void;
  setArousal: (v: number) => void;
  setDominance: (v: number) => void;
  canAdvance: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const cfg = STEP_CONFIG[step];
  const selected = step === 1 ? valence : step === 2 ? arousal : dominance;
  const setSelected = step === 1 ? setValence : step === 2 ? setArousal : setDominance;

  const options = step === 1 ? VALENCE_OPTIONS : step === 2 ? AROUSAL_OPTIONS : null;
  const domOptions = step === 3 ? DOMINANCE_OPTIONS : null;

  const isLastStep = step === 3;

  return (
    <>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Paso {step} de 3
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                width: "28px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: n <= step ? "#4A7FA5" : "#D1D5DB",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e3a4f", marginBottom: "8px", letterSpacing: "-0.01em" }}>
        {cfg.title}
      </h2>
      <p style={{ fontSize: "14px", color: "#5A7A8A", marginBottom: "24px" }}>
        {cfg.question}
      </p>

      {/* Options row */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "nowrap" }}>
        {options && options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
          >
            {opt.node(54)}
          </OptionCard>
        ))}
        {domOptions && domOptions.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
            minHeight={90}
          >
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", height: "78px" }}>
              <FlowDominance size={opt.size} cape={opt.cape} />
            </div>
          </OptionCard>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canAdvance}
        style={{
          marginTop: "24px",
          backgroundColor: canAdvance ? "#4A7FA5" : "#CBD5E1",
          color: "white",
          border: "none",
          borderRadius: "12px",
          padding: "12px 0",
          fontSize: "15px",
          fontWeight: 600,
          cursor: canAdvance ? "pointer" : "not-allowed",
          transition: "background-color 0.2s, opacity 0.15s",
          display: "block",
          width: "100%",
        }}
        onMouseEnter={(e) => { if (canAdvance) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        {isLastStep ? "Finalizar" : "Siguiente"}
      </button>

      <button
        onClick={onSkip}
        style={{
          marginTop: "12px",
          background: "none",
          border: "none",
          fontSize: "13px",
          color: "#94A3B8",
          cursor: "pointer",
          textDecoration: "underline",
          display: "block",
          margin: "12px auto 0",
        }}
      >
        Omitir
      </button>
    </>
  );
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  children,
  label,
  selected,
  onClick,
  minHeight = 80,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  minHeight?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="sam-card-hover"
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: selected ? "2px solid #4A7FA5" : "2px solid #E2E8F0",
        borderRadius: "12px",
        backgroundColor: selected ? "#DBEAFE" : "#ffffff",
        padding: "10px 4px 8px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        transition: "border-color 0.15s, background-color 0.15s, transform 0.15s",
        minHeight,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        {children}
      </div>
      <span
        style={{
          fontSize: "10px",
          fontWeight: selected ? 600 : 500,
          color: selected ? "#1e3a4f" : "#6B7280",
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </button>
  );
}
