import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          お探しの項目が見つかりません
        </h1>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
