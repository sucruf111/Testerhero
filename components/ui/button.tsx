import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-coral-500 text-white shadow-glow hover:bg-coral-600 active:bg-coral-700 disabled:bg-coral-300 disabled:shadow-none",
  secondary: "bg-white text-ink ring-1 ring-line shadow-soft hover:ring-ink/20 hover:bg-white",
  dark: "bg-ink text-white hover:bg-ink-soft",
  ghost: "text-ink-soft hover:bg-sand hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline: "ring-1 ring-ink/15 text-ink hover:bg-ink hover:text-white hover:ring-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-all duration-200 select-none disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:size-[1.1em]",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
