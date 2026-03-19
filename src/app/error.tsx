"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error available via error.digest for tracking services
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          エラーが発生しました
        </h1>
        <p className="mt-2 text-gray-600">
          問題が発生しました。もう一度お試しください。
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            再試行
          </button>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
