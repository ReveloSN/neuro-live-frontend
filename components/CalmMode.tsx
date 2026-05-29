"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SAMQuestionnaire from "@/components/SAMQuestionnaire";

interface CalmModeProps {
  onExit: () => void;
  onSAMComplete?: (valence: number, arousal: number, dominance: number) => void;
  userToken?: string;
  activeCrisisId?: number;
}

type BreathPhase = "inhale" | "hold" | "exhale";

const PHASE_DURATION = 4000; // 4 seconds per phase

const PHASE_CONFIG: Record<BreathPhase, { label: string; next: BreathPhase }> = {
  inhale: { label: "Inhala...", next: "hold" },
  hold:   { label: "Sostén...", next: "exhale" },
  exhale: { label: "Exhala...", next: "inhale" },
};

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 3 + (i % 4),
  delay: (i * 0.7) % 6,
  duration: 8 + (i % 5),
  x: 5 + ((i * 53) % 90),
  amplitude: 30 + (i % 40),
}));

export default function CalmMode({ onExit, onSAMComplete, userToken, activeCrisisId }: CalmModeProps) {
  const [countdown, setCountdown] = useState(3);
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [cycles, setCycles] = useState(0);
  const [showSAM, setShowSAM] = useState(false);
  const phaseRef = useRef<BreathPhase>("inhale");
  phaseRef.current = phase;
  const breathingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExitClick = useCallback(() => {
    // Stop the interval immediately so cycles stays at the value shown on screen
    if (breathingIntervalRef.current !== null) {
      clearInterval(breathingIntervalRef.current);
      breathingIntervalRef.current = null;
    }
    setShowSAM(true);
  }, []);

  function handleSAMComplete(valence: number, arousal: number, dominance: number) {
    onSAMComplete?.(valence, arousal, dominance);
    onExit();
  }

  function handleSAMSkip() {
    onExit();
  }

  // Decrement countdown once per second until it reaches 0
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Start breathing cycle only after countdown finishes
  const breathingActive = countdown === 0;
  useEffect(() => {
    if (!breathingActive) return;
    const tick = setInterval(() => {
      const current = phaseRef.current;
      const next = PHASE_CONFIG[current].next;
      if (current === "exhale") setCycles((c) => c + 1);
      setPhase(next);
    }, PHASE_DURATION);
    breathingIntervalRef.current = tick;
    return () => { clearInterval(tick); breathingIntervalRef.current = null; };
  }, [breathingActive]);

  const circleScale = phase === "inhale" ? "scale(1.55)" : phase === "hold" ? "scale(1.55)" : "scale(1)";
  const circleTransition =
    phase === "inhale"
      ? `transform ${PHASE_DURATION}ms cubic-bezier(0.45, 0, 0.55, 1)`
      : phase === "hold"
      ? "transform 0.1s ease"
      : `transform ${PHASE_DURATION}ms cubic-bezier(0.45, 0, 0.55, 1)`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo Calma"
      className="calm-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "48px 24px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(100vh) scale(0.6); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.35; }
          50%  { transform: scale(1.12); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.35; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes countdownPop {
          0%   { opacity: 0; transform: scale(0.65); }
          18%  { opacity: 1; transform: scale(1.08); }
          35%  { opacity: 1; transform: scale(1); }
          72%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.82); }
        }
        @keyframes breathFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (max-width: 640px) {
          .calm-breathing-circle { width: 120px !important; height: 120px !important; }
          .calm-container { padding: 16px !important; }
          .calm-title { font-size: 18px !important; }
          .calm-subtitle { font-size: 13px !important; }
          .calm-exit-btn { position: fixed !important; bottom: 24px !important; left: 50% !important; transform: translateX(-50%) !important; }
        }
      `}</style>

      {/* Ambient particles */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              bottom: "-10px",
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#4A7FA5",
              opacity: 0,
              animation: `floatUp ${p.duration}s ${p.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", animation: "fadeInDown 0.8s ease forwards", zIndex: 1 }}>
        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#6BA3C8",
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          NeuroLive
        </p>
        <h1
          className="calm-title"
          style={{
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 700,
            color: "#D6E8F5",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Modo Calma activado
        </h1>
        <p
          className="calm-subtitle"
          style={{
            marginTop: "8px",
            fontSize: "13px",
            color: "#7AAAC8",
            maxWidth: "320px",
            lineHeight: 1.5,
          }}
        >
          Sigue el ritmo de la animación para regular tu respiración
        </p>
      </div>

      {/* Center stage: countdown or breathing circle */}
      <div
        className="calm-stage"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          flexShrink: 0,
          minHeight: 220,
          minWidth: 220,
        }}
      >
        {!breathingActive ? (
          /* ── Countdown screen ── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#7AAAC8",
                margin: 0,
                letterSpacing: "0.01em",
                textAlign: "center",
                maxWidth: "240px",
                lineHeight: 1.5,
              }}
            >
              La respiración guiada comenzará en
            </p>

            {/* The number — remounts on each tick to re-trigger the animation */}
            <div
              key={countdown}
              aria-live="polite"
              aria-atomic="true"
              style={{
                fontSize: "96px",
                fontWeight: 700,
                color: "#D6E8F5",
                lineHeight: 1,
                textShadow: "0 0 40px rgba(74,127,165,0.6)",
                animation: "countdownPop 900ms ease forwards",
                userSelect: "none",
              }}
            >
              {countdown}
            </div>
          </div>
        ) : (
          /* ── Breathing circle ── */
          <div
            style={{ animation: "breathFadeIn 0.8s ease forwards" }}
          >
            {/* Outer pulsing ring */}
            <div
              aria-hidden="true"
              className="calm-circle-outer"
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 220,
                height: 220,
                borderRadius: "50%",
                border: "1.5px solid #4A7FA5",
                animation: "pulseRing 3s ease-in-out infinite",
              }}
            />

            {/* Main breathing circle */}
            <div
              className="calm-breathing-circle"
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 38%, #6BAFD4, #4A7FA5)",
                boxShadow: "0 0 60px rgba(74,127,165,0.45), 0 0 120px rgba(74,127,165,0.2)",
                transform: circleScale,
                transition: circleTransition,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                willChange: "transform",
                position: "relative",
              }}
              aria-live="polite"
              aria-atomic="true"
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#D6E8F5",
                  letterSpacing: "0.02em",
                  userSelect: "none",
                }}
              >
                {PHASE_CONFIG[phase].label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cycle counter + exit button */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          animation: "fadeInUp 0.8s ease forwards",
          zIndex: 1,
        }}
      >
        {/* Cycle counter */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#5A8FAD", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            Ciclos completados
          </p>
          <p
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#D6E8F5",
              margin: "4px 0 0",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {cycles}
          </p>
        </div>

        {/* Exit button */}
        <button
          onClick={handleExitClick}
          className="calm-exit-btn"
          style={{
            background: "transparent",
            border: "1px solid rgba(74,127,165,0.45)",
            borderRadius: "10px",
            padding: "10px 28px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#7AAAC8",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s, background 0.2s",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#4A7FA5";
            (e.currentTarget as HTMLButtonElement).style.color = "#D6E8F5";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(74,127,165,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(74,127,165,0.45)";
            (e.currentTarget as HTMLButtonElement).style.color = "#7AAAC8";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Salir del Modo Calma
        </button>
      </div>

      {/* SAM questionnaire shown after user clicks exit */}
      {showSAM && (
        <SAMQuestionnaire
          onComplete={handleSAMComplete}
          onSkip={handleSAMSkip}
          breathingCycles={cycles}
          userToken={userToken}
          crisisId={activeCrisisId}
        />
      )}
    </div>
  );
}
