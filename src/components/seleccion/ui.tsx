import type { ReactNode } from "react";

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow block text-xs text-taupe-dark">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-forest/50">{hint}</span>}
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-taupe/40 bg-white px-3 py-2 text-sm text-forest shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={5} {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-light text-forest">{title}</h2>
      <p className="mt-1 text-sm text-forest/70">{description}</p>
    </div>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
) {
  const { loading, children, disabled, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className="eyebrow inline-flex items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Guardando…" : children}
    </button>
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="eyebrow inline-flex items-center justify-center rounded-full border border-taupe/50 bg-white px-6 py-2.5 text-xs text-forest transition hover:bg-sand/40 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
