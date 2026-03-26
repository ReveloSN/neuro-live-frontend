type SectionHeaderProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-muted sm:text-base">{description}</p>
    </div>
  );
}
