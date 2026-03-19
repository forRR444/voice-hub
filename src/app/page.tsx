import Link from "next/link";
import PublicHeader from "./components/public-header";
import TestimonialToast from "./components/testimonial-toast";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <TestimonialToast />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          お客様の声を集めて、
          <br />
          ホームページに自動で表示
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto">
          フォームURLを送るだけ。集まった声がウィジェットで自動的にあなたのWebサイトに表示されます。コピペ作業はもう不要です。
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            無料で始める
          </Link>
          <Link
            href="/form/tanaka-coaching"
            className="px-6 py-3 text-base font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            デモを見る
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          クレジットカード不要 / Googleアカウントで即開始
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          3ステップで完了
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              1
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">フォームURLを送る</h3>
            <p className="mt-2 text-sm text-gray-600">
              お客様にフォームURLを送るだけ。ステップ形式で簡単に回答できます。
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              2
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">声を承認する</h3>
            <p className="mt-2 text-sm text-gray-600">
              届いた声をダッシュボードで確認。ワンクリックで承認するだけ。
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
              3
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">自動でホームページに表示</h3>
            <p className="mt-2 text-sm text-gray-600">
              埋め込みコードをホームページに1回貼るだけ。新しい声は自動的に反映されます。
            </p>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            こんなお悩みありませんか？
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                before: "LINEやDMで個別に感想をお願いしている",
                after: "フォームURLを1つ送るだけ",
              },
              {
                before: "もらった声がLINE・メール・DMに散在",
                after: "1つのダッシュボードで一元管理",
              },
              {
                before: "ホームページにテキストをコピペ＋写真配置が面倒",
                after: "ウィジェットが自動表示",
              },
              {
                before: "一度載せたら更新されない",
                after: "新しい声が自動的に反映",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-sm text-red-500 line-through">{item.before}</p>
                <p className="mt-2 text-sm font-medium text-gray-900">→ {item.after}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
          主な機能
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "収集フォーム",
              desc: "星評価、Before/After、写真アップロード。ステップ形式でお客様が答えやすい。",
            },
            {
              title: "管理ダッシュボード",
              desc: "承認/非承認、タグ付け、検索。お客様の声を一元管理。",
            },
            {
              title: "埋め込みウィジェット",
              desc: "カルーセル・グリッド・マーキーの3タイプ。コードをコピペするだけ。",
            },
            {
              title: "手動追加",
              desc: "過去にもらった声も手動で追加OK。既存の声をまとめて移行できます。",
            },
            {
              title: "ペライチ・WordPress対応",
              desc: "主要なホームページ作成ツールに対応。iframe版も用意。",
            },
            {
              title: "レスポンシブ対応",
              desc: "スマホでもPCでも美しく表示。Shadow DOMでデザイン崩れなし。",
            },
          ].map((feature, i) => (
            <div key={i}>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            データが証明する「お客様の声」の効果
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-bold text-indigo-600">97%</p>
              <p className="mt-2 text-sm text-gray-600">の消費者がレビューを参考にする</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">+34%</p>
              <p className="mt-2 text-sm text-gray-600">お客様の声掲載でCVR向上</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">5分</p>
              <p className="mt-2 text-sm text-gray-600">でセットアップ完了</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          今すぐ、お客様の声を集めませんか？
        </h2>
        <p className="mt-4 text-gray-600">
          無料で始められます。クレジットカードは不要です。
        </p>
        <Link
          href="/login"
          className="inline-block mt-8 px-8 py-3 text-base font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          無料で始める
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-400">
          &copy; 2026 VoiceHub. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
