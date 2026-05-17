import { cn } from "@/lib/cn";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "strong";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
};

const variantClass = {
  default: "glass",
  elevated: "glass-elevated",
  strong: "glass-strong"
};

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6"
};

export default function GlassCard({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick
}: GlassCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(variantClass[variant], paddingClass[padding], onClick && "text-start transition active:scale-[0.99]", className)}
    >
      {children}
    </Tag>
  );
}
