import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Link href="/" className="text-xl font-bold text-gray-900">
            VoiceHub
          </Link>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-12">
        {children}
      </div>
    </div>
  );
}
