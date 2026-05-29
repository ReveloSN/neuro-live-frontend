"use client";

import { useState, useEffect } from "react";

interface SAMQuestionnaireProps {
  onComplete: (valence: number, arousal: number, dominance: number) => void;
  onSkip: () => void;
  userToken?: string;
  breathingCycles?: number;
  crisisId?: number;
}

type Step = "intro" | 1 | 2 | 3;

// ── Flow cloud SVG base shape ─────────────────────────────────────────────────
// All paths use a fixed 100×100 viewBox; the size prop sets rendered px dimensions.

function FlowCloud({
  size = 64,
  children,
  style,
}: {
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={style}
      aria-hidden="true"
    >
      {/* Cloud silhouette — smooth cubic bezier with 3 top bumps and flat bottom */}
      <path
        d="M 20,72 C 8,72 6,60 12,54 C 6,46 10,34 22,34 C 18,20 32,14 44,20 C 46,6 62,6 66,20 C 76,12 86,18 86,30 C 94,32 96,46 90,54 C 94,64 88,72 80,72 Z"
        fill="#FFFFFF"
        stroke="#2d5a7a"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 2px 3px rgba(45,90,122,0.18))" }}
      />
      {/* Green accent dot */}
      <circle cx="57" cy="57" r="3.5" fill="#4ADE80" />
      {children}
    </svg>
  );
}

// ── Expression helpers ────────────────────────────────────────────────────────

function Eyes({ open = true }: { open?: boolean }) {
  if (!open) {
    return (
      <>
        <path d="M 34,48 Q 38,43 42,48" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 58,48 Q 62,43 66,48" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx="38" cy="48" r="3.5" fill="#2d5a7a" />
      <circle cx="62" cy="48" r="3.5" fill="#2d5a7a" />
    </>
  );
}

function Mouth({ type }: { type: "very-sad" | "sad" | "neutral" | "happy" | "very-happy" }) {
  if (type === "very-sad") {
    return <path d="M 40,65 Q 50,56 60,65" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />;
  }
  if (type === "sad") {
    return <path d="M 40,63 Q 50,57 60,63" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />;
  }
  if (type === "neutral") {
    return <line x1="40" y1="62" x2="60" y2="62" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />;
  }
  if (type === "happy") {
    return <path d="M 40,60 Q 50,68 60,60" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />;
  }
  return <path d="M 38,59 Q 50,70 62,59" fill="none" stroke="#2d5a7a" strokeWidth="2.5" strokeLinecap="round" />;
}

// ── Intro waving Flow ─────────────────────────────────────────────────────────

function FlowWaving({ size = 80 }: { size?: number }) {
  return (
    <FlowCloud size={size}>
      <Eyes />
      <Mouth type="happy" />
      <path
        d="M 79,56 Q 92,45 87,32"
        fill="none"
        stroke="#2d5a7a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </FlowCloud>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

const VALENCE_OPTIONS = [
  { value: 1, label: "Muy triste",   emoji: "😢" },
  { value: 2, label: "Triste",       emoji: "😕" },
  { value: 3, label: "Neutral",      emoji: "😐" },
  { value: 4, label: "Contento",     emoji: "🙂" },
  { value: 5, label: "Muy contento", emoji: "😄" },
];

const AROUSAL_OPTIONS = [
  { value: 1, label: "Sin energía", emoji: "😴" },
  { value: 2, label: "Calmado",     emoji: "😌" },
  { value: 3, label: "Neutral",     emoji: "😐" },
  { value: 4, label: "Activo",      emoji: "⚡" },
  { value: 5, label: "Muy activo",  emoji: "🔥" },
];

const DOMINANCE_OPTIONS = [
  { value: 1, label: "Sin control",   emoji: "😰" },
  { value: 2, label: "Poco control",  emoji: "😟" },
  { value: 3, label: "Normal",        emoji: "😐" },
  { value: 4, label: "Con control",   emoji: "💪" },
  { value: 5, label: "En paz",        emoji: "🧘" },
];

const STEP_CONFIG = {
  1: { title: "Valencia",    question: "¿Cómo es tu ánimo ahora?" },
  2: { title: "Activación",  question: "¿Qué tanta energía sientes?" },
  3: { title: "Dominancia",  question: "¿Sientes que tienes el control?" },
} as const;

// ── Main component ────────────────────────────────────────────────────────────

export default function SAMQuestionnaire({ onComplete, onSkip, userToken, breathingCycles, crisisId }: SAMQuestionnaireProps) {
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
      const v = valence ?? 3;
      const a = arousal ?? 3;
      const d = dominance ?? 3;
      if (userToken) {
        try {
          const storageKey = `nl_historial_${userToken}`;
          const existing: unknown[] = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
          const now = new Date();
          const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
          const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
          const status =
            v <= 2 || a <= 2 || d <= 2 ? "Crisis" :
            v === 3 || a === 3 || d === 3 ? "Riesgo" :
            "Normal";
          const newSession = {
            id: `s_${Date.now()}`,
            date: dateStr,
            duration: "Modo Calma",
            breathingCycles: breathingCycles ?? 0,
            valence: v,
            arousal: a,
            dominance: d,
            interventionType: "Modo Calma",
            status,
            ...(crisisId != null && { crisisId }),
          };
          localStorage.setItem(storageKey, JSON.stringify([...existing, newSession]));
        } catch {
          // localStorage unavailable or full — continue without saving
        }
      }
      onComplete(v, a, d);
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
      className="sam-overlay"
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
        @media (max-width: 640px) {
          .sam-overlay { padding: 0 !important; align-items: flex-start !important; }
          .sam-card { border-radius: 0 !important; width: 100vw !important; min-height: 100dvh !important; margin: 0 !important; padding: 20px 16px 0 !important; }
          .sam-options { display: flex !important; overflow-x: auto !important; gap: 8px !important; padding-bottom: 8px !important; justify-content: flex-start !important; scrollbar-width: none; -ms-overflow-style: none; }
          .sam-options::-webkit-scrollbar { display: none; }
          .sam-option { min-width: 75px !important; flex-shrink: 0 !important; }
          .sam-buttons { position: sticky !important; bottom: 0 !important; background: #F5F0E8 !important; padding: 12px !important; margin-left: -16px !important; margin-right: -16px !important; }
        }
      `}</style>

      {/* Card */}
      <div
        className="sam-card"
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
      <div style={{ fontSize: "72px", lineHeight: 1 }}>💙</div>
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

  const options =
    step === 1 ? VALENCE_OPTIONS :
    step === 2 ? AROUSAL_OPTIONS :
    DOMINANCE_OPTIONS;

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
      <div className="sam-options" style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "nowrap" }}>
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={selected === opt.value}
            onClick={() => setSelected(opt.value)}
          >
            <span style={{ fontSize: "48px", lineHeight: 1 }}>{opt.emoji}</span>
          </OptionCard>
        ))}
      </div>

      {/* Next + skip buttons — sticky on mobile */}
      <div className="sam-buttons" style={{ marginTop: "24px" }}>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          style={{
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
      </div>
    </>
  );
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  children,
  label,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="sam-card-hover sam-option"
      style={{
        flex: "1 1 0",
        minWidth: "90px",
        border: selected ? "2px solid #4A7FA5" : "2px solid #E2E8F0",
        borderRadius: "12px",
        backgroundColor: selected ? "#DBEAFE" : "#ffffff",
        padding: "12px 4px 10px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        transition: "border-color 0.15s, background-color 0.15s, transform 0.15s",
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
