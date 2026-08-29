import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300",
  secondary: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50 disabled:opacity-50",
  danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50",
  ghost: "text-stone-600 hover:bg-stone-100 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
