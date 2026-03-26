import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary";
};

const baseStyles =
  "focus-ring inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition";

const variantStyles = {
  primary: "bg-ink text-white hover:bg-black/85",
  secondary: "border border-line bg-white/70 text-ink hover:bg-canvas"
};

export function Button({
  children,
  className,
  href,
  variant = "primary"
}: ButtonProps) {
  const styles = cn(baseStyles, variantStyles[variant], className);

  if (href) {
    return (
      <Link className={styles} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={styles} type="button">{children}</button>;
}
