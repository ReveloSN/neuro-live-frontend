import { cn } from "@/lib/utils";

type StatusTone = "normal" | "elevated" | "crisis" | "neutral";

type StatusBadgeProps = Readonly<{
  children: React.ReactNode;
  tone?: StatusTone;
}>;

const toneStyles: Record<StatusTone, string> = {
  normal: "bg-accent-50 text-alert-normal border border-accent-100",
  elevated: "bg-amber-50 text-alert-elevated border border-amber-200",
  crisis: "bg-rose-50 text-alert-crisis border border-rose-200",
  neutral: "bg-stone-100 text-muted border border-line"
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        toneStyles[tone]
      )}
    >
      {children}
    </span>
  );
}
