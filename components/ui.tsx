import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    default: "bg-ember text-white hover:bg-ember-dark disabled:opacity-50",
    outline: "border border-navy/25 bg-white hover:bg-mist disabled:opacity-50",
    ghost: "hover:bg-mist disabled:opacity-50",
    destructive: "border border-ember/60 bg-white text-brick hover:bg-ember/10 disabled:opacity-50",
  } as const;
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-6 text-base",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ember cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-navy/25 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-ember focus:ring-1 focus:ring-ember",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-navy/25 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-ember",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-navy/25 bg-white px-2 text-sm outline-none focus:border-ember",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium text-navy/70", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-navy/15 bg-white shadow-card", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "green" | "red" | "amber" | "blue" | "zinc";
}) {
  const tones = {
    default: "bg-ember text-white",
    green: "bg-navy text-white",
    red: "bg-ember/15 text-brick",
    amber: "bg-honey/20 text-amber-800 border border-honey",
    blue: "bg-navy/10 text-navy",
    zinc: "bg-mist text-slate",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
