"use client";

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

export const inputClass =
  "w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function FormField({ label, required = false, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground/70 mb-1">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}
