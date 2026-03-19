import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-8xl font-bold text-indigo-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          ページが見つかりません
        </h1>
        <p className="mt-2 text-gray-600">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ホームに戻る
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
