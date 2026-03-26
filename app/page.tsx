import Link from "next/link";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { getBackendHealth } from "@/lib/api";

export const revalidate = 0;

export default async function LandingPage() {
  const backendHealth = await getBackendHealth();

  return (
    <main className="page-shell">
      <div className="container-width flex min-h-screen flex-col py-6 sm:py-8">
        <header className="surface mb-12 flex items-center justify-between rounded-full px-5 py-3 shadow-soft">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
              NeuroLive
            </p>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-2 text-sm text-muted">
            <Link className="focus-ring rounded-full px-3 py-2 hover:bg-canvas" href="#status">
              System status
            </Link>
            <Link className="focus-ring rounded-full px-3 py-2 hover:bg-canvas" href="/dashboard">
              Dashboard preview
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-10 pb-12 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="max-w-3xl">
            <StatusBadge tone="normal">Frontend MVP</StatusBadge>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
              Sensory wellbeing support designed to feel calm, clear, and ready to grow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              NeuroLive is a sensory wellbeing and monitoring platform for neurodivergent
              users, caregivers, and academic teams who need a simple interface that stays
              grounded under pressure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/dashboard">Open dashboard preview</Button>
              <Button href="#status" variant="secondary">
                View platform status
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Accessible by default",
                  description: "High contrast, keyboard focus states, and restrained motion."
                },
                {
                  title: "Ready for API integration",
                  description: "Environment-based backend connection with safe fallback messaging."
                },
                {
                  title: "Built for continuity",
                  description: "Simple App Router structure that is easy to extend with auth later."
                }
              ].map((item) => (
                <Card key={item.title} className="h-full">
                  <h2 className="text-base font-semibold text-ink">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="rounded-4xl p-6 sm:p-8">
            <SectionHeader
              eyebrow="Live overview"
              title="A lightweight interface for calm response."
              description="The MVP keeps system trust visible from the first screen."
            />

            <div id="status" className="mt-8 grid gap-4">
              <Card className="bg-canvas/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Frontend status</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      The public interface is online and ready for deployment on Vercel.
                    </p>
                  </div>
                  <StatusBadge tone="normal">Online</StatusBadge>
                </div>
              </Card>

              <Card className="bg-canvas/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Backend connectivity</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {backendHealth.description}
                    </p>
                    {backendHealth.apiUrl ? (
                      <p className="mt-3 break-all text-xs uppercase tracking-[0.2em] text-muted">
                        {backendHealth.apiUrl}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge tone={backendHealth.tone}>{backendHealth.label}</StatusBadge>
                </div>
              </Card>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
