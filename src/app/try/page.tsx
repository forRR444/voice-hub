import type { Metadata } from "next";
import TryClient from "./try-client";

export const metadata: Metadata = {
  title: "フォームを試す — VoiceHub",
  description: "登録なしでお客様の声の収集フォームを作成・プレビューできます。",
  robots: { index: false, follow: false },
};

export default function TryPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <TryClient />
      </div>
    </div>
  );
}
