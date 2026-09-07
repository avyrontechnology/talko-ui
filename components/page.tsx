import { AlertTriangle, Inbox } from "lucide-react";

export { SectionCard } from "./primitives";

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-honey shadow-card">
            <Icon size={19} />
          </div>
        )}
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-navy">{title}</h1>
          {subtitle && <p className="mt-0.5 font-mono text-[11px] text-slate/70">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-ember/30 bg-ember/[0.07] p-3.5 text-sm text-brick">
      <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-0.5 break-words opacity-90">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-1.5 font-semibold underline underline-offset-2 cursor-pointer">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-navy/20 bg-white/60 px-6 py-10 text-center">
      <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-mist text-slate">
        <Inbox size={20} />
      </div>
      <p className="text-sm font-semibold text-navy">{message}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-slate/70">{hint}</p>}
    </div>
  );
}
