import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-gray-100 bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          VoiceHub
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">
              機能
            </a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">
              料金
            </a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">
              よくある質問
            </a>
          </nav>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}
