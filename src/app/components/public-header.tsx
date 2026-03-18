import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          VoiceHub
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          無料で始める
        </Link>
      </div>
    </header>
  );
}
