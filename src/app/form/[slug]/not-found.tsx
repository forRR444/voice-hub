import Image from "next/image";
import Link from "next/link";

export default function FormNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
          <Image src="/logo-icon.png" alt="" width={1047} height={1267} className="h-5 w-auto" />
          VoiceHub
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          フォームが見つかりません
        </h1>
        <p className="mt-2 text-gray-600">
          このフォームは存在しないか、削除された可能性があります。
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
