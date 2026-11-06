import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass =
  "block w-full rounded-2xl border-0 bg-white px-4 py-3 text-[15px] text-ink shadow-soft ring-1 ring-line transition placeholder:text-muted/60 focus:ring-2 focus:ring-coral-400 focus:outline-none aria-[invalid=true]:ring-red-400 disabled:bg-sand disabled:text-muted";

/** Kompakte Felder für Tabellenzeilen (z. B. Sendungsnummer) */
export const compactInputClass =
  "h-9 rounded-full border-0 bg-white px-3.5 text-sm text-ink shadow-soft ring-1 ring-line transition placeholder:text-muted/60 focus:ring-2 focus:ring-coral-400 focus:outline-none";

type FieldProps = {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  error?: string[];
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, name, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted">optional</span>}
      </label>
      {children}
      {error?.length ? (
        <p id={`${name}-error`} className="text-sm text-red-600">
          {error[0]}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { error?: string[] };

export function Input({ className, error, name, id, ...props }: InputProps) {
  return (
    <input
      id={id ?? name}
      name={name}
      aria-invalid={error?.length ? true : undefined}
      aria-describedby={error?.length ? `${name}-error` : undefined}
      className={cn(inputClass, className)}
      {...props}
    />
  );
}

type TextareaProps = ComponentProps<"textarea"> & { error?: string[] };

export function Textarea({ className, error, name, id, ...props }: TextareaProps) {
  return (
    <textarea
      id={id ?? name}
      name={name}
      aria-invalid={error?.length ? true : undefined}
      className={cn(inputClass, "min-h-28 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select"> & { error?: string[] };

export function Select({ className, error, name, id, children, ...props }: SelectProps) {
  return (
    <select
      id={id ?? name}
      name={name}
      aria-invalid={error?.length ? true : undefined}
      className={cn(inputClass, "select-chevron pr-10", className)}
      {...props}
    >
      {children}
    </select>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode };

export function Checkbox({ label, description, className, id, name, ...props }: CheckboxProps) {
  const inputId = id ?? `${name}-${String(props.value ?? "on")}`;
  return (
    <label htmlFor={inputId} className={cn("group flex cursor-pointer items-start gap-3", className)}>
      <input
        id={inputId}
        name={name}
        type="checkbox"
        className="checkbox-check peer mt-0.5 size-5 shrink-0 cursor-pointer rounded-md bg-white ring-1 ring-line transition checked:bg-coral-500 checked:ring-coral-500"
        {...props}
      />
      <span className="text-[15px] leading-snug text-ink-soft">
        {label}
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Auswahl-Chip (Checkbox als Pille) */
export function Chip({ label, className, name, value, ...props }: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  const id = `${name}-${String(value)}`;
  return (
    <label htmlFor={id} className={cn("cursor-pointer", className)}>
      <input id={id} type="checkbox" name={name} value={value} className="peer sr-only" {...props} />
      <span className="inline-flex items-center rounded-full bg-white px-3.5 py-2 text-sm font-medium text-ink-soft ring-1 ring-line transition peer-checked:bg-ink peer-checked:text-white peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral-500 hover:ring-ink/30">
        {label}
      </span>
    </label>
  );
}

type AlertProps = { tone?: "success" | "error" | "info"; title?: ReactNode; children?: ReactNode; className?: string };

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const styles = {
    success: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    error: "bg-red-50 text-red-900 ring-red-200",
    info: "bg-lilac-50 text-ink ring-lilac-100",
  }[tone];
  const Icon = { success: CircleCheck, error: CircleAlert, info: Info }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl px-4 py-3.5 ring-1", styles, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="text-[15px] leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string; ok?: boolean } }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.ok && state.message) return <Alert tone="success">{state.message}</Alert>;
  return null;
}
