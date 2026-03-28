"use client";

import { InputHTMLAttributes } from "react";

type AuthInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "placeholder" | "value" | "onChange" | "autoComplete"
>;

export default function AuthInput(props: AuthInputProps) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}
