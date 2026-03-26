import { cn } from "@/lib/utils";

type CardProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return <div className={cn("surface rounded-[1.75rem] p-5", className)}>{children}</div>;
}
