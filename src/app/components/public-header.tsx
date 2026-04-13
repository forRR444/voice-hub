import Image from "next/image";
import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-[20px]">
      <div className="flex items-center justify-between max-w-5xl mx-auto px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-[-0.022em]">
          <Image src="/logo-icon.png" alt="" width={1047} height={1267} priority className="h-8 sm:h-11 w-auto" />
          VoiceHub
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-6 text-base text-[var(--slate)]">
            <a href="#features" className="hover:text-[var(--ink)] transition-colors">
              機能
            </a>
            <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">
              料金
            </a>
            <a href="#faq" className="hover:text-[var(--ink)] transition-colors">
              よくある質問
            </a>
          </nav>
          <Link
            href="/login"
            className="px-4 py-2 text-base font-medium text-[var(--slate)] rounded-lg hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    </header>
  );
}
