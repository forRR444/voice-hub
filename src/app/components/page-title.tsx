"use client";

export default function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xl sm:text-2xl font-semibold"
      style={{ color: "#1A1F36", letterSpacing: "-0.022em" }}
    >
      {children}
    </h2>
  );
}
