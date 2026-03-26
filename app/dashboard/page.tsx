import Link from "next/link";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";

const wellbeingStates = [
  {
    label: "Normal",
    tone: "normal" as const,
    summary: "Baseline signals are stable and no urgent interventions are suggested."
  },
  {
    label: "Elevated",
    tone: "elevated" as const,
    summary: "Noticeable stress markers suggest a softer environment and guided support."
  },
  {
    label: "Active crisis",
    tone: "crisis" as const,
    summary: "Escalation support may be needed and the interface should stay low-stimulation."
  }
];

const activityItems = [
  "Breathing exercise completed 4 minutes ago",
  "Calm mode enabled for the shared room",
  "Wellbeing state reviewed by support staff",
  "Daily note synced with the monitoring service"
];

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <div className="container-width py-6 sm:py-8">
        <div className="surface rounded-[2rem] p-3 shadow-soft">
          <header className="flex flex-col gap-4 rounded-[1.5rem] border border-line/80 bg-white/90 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                NeuroLive dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Support preview
              </h1>
            </div>
            <nav aria-label="Dashboard navigation" className="flex flex-wrap gap-2 text-sm">
              <Link className="focus-ring rounded-full px-4 py-2 text-muted hover:bg-canvas" href="/">
                Home
              </Link>
              <span className="rounded-full bg-canvas px-4 py-2 font-medium text-ink">
                Dashboard
              </span>
              <span className="rounded-full px-4 py-2 text-muted">Insights</span>
              <span className="rounded-full px-4 py-2 text-muted">Settings</span>
            </nav>
          </header>

          <div className="mt-3 grid gap-3 lg:grid-cols-[260px_1fr]">
            <aside className="surface rounded-[1.75rem] p-4 lg:min-h-[720px]">
              <div className="rounded-[1.4rem] bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Environment
                </p>
                <p className="mt-3 text-lg font-semibold text-ink">Calm response mode</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  A focused workspace for sensory monitoring, low-friction actions, and
                  guided care routines.
                </p>
              </div>

              <div className="mt-6 space-y-2">
                {["Overview", "Wellbeing monitor", "Guided sessions", "Recent activity"].map(
                  (item, index) => (
                    <button
                      key={item}
                      className={`focus-ring flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ${
                        index === 0
                          ? "bg-accent-50 font-semibold text-ink"
                          : "text-muted hover:bg-canvas"
                      }`}
                      type="button"
                    >
                      <span>{item}</span>
                      <span aria-hidden="true">{index === 0 ? "•" : ""}</span>
                    </button>
                  )
                )}
              </div>
            </aside>

            <section className="grid gap-3">
              <Card className="rounded-[1.75rem] p-6 sm:p-8">
                <SectionHeader
                  eyebrow="Welcome back"
                  title="A calm overview for today's support flow."
                  description="This preview uses mock data to show how monitoring, grounding tools, recent events, and future backend integration can live in the same workspace."
                />
              </Card>

              <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-[1.75rem] p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Wellbeing status</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Clear visual states help support teams scan the situation quickly.
                      </p>
                    </div>
                    <StatusBadge tone="elevated">Elevated</StatusBadge>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {wellbeingStates.map((state) => (
                      <div
                        key={state.label}
                        className="rounded-[1.4rem] border border-line/80 bg-canvas/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-ink">{state.label}</p>
                          <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted">{state.summary}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid gap-3">
                  <Card className="rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold text-ink">Guided breathing</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Use a gentle four-step rhythm designed for low cognitive load.
                    </p>
                    <div className="mt-6 rounded-[1.5rem] bg-accent-50 p-5">
                      <div className="flex h-28 items-center justify-center rounded-full border border-accent-100 bg-white text-center">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-muted">Cycle</p>
                          <p className="mt-2 text-2xl font-semibold text-ink">Inhale 4s</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-muted">
                        Continue with hold, exhale, and pause for a one-minute grounding loop.
                      </p>
                    </div>
                  </Card>

                  <Card className="rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold text-ink">Calm mode</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Reduce interface noise and prioritize the next safest action.
                    </p>
                    <div className="mt-6 flex items-center justify-between rounded-[1.4rem] border border-line/80 bg-canvas/80 p-4">
                      <div>
                        <p className="font-medium text-ink">Soft palette enabled</p>
                        <p className="mt-1 text-sm text-muted">Minimal contrast spikes and fewer competing elements.</p>
                      </div>
                      <StatusBadge tone="normal">Enabled</StatusBadge>
                    </div>
                  </Card>

                  <Card className="rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold text-ink">Integration readiness</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Next.js server routes are prepared to proxy the real backend endpoints for
                      health, login, register, and current user profile.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <StatusBadge tone="normal">/api/health</StatusBadge>
                      <StatusBadge tone="normal">/api/auth/login</StatusBadge>
                      <StatusBadge tone="normal">/api/auth/register</StatusBadge>
                      <StatusBadge tone="normal">/api/users/me</StatusBadge>
                    </div>
                  </Card>
                </div>
              </div>

              <Card className="rounded-[1.75rem] p-6">
                <p className="text-sm font-semibold text-ink">Recent activity</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activityItems.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-[1.4rem] border border-line/80 bg-canvas/80 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        Event {index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
