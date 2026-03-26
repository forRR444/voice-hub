import Link from "next/link";
import PublicHeader from "./components/public-header";
import TestimonialToast from "./components/testimonial-toast";
import FaqItem from "./components/faq-item";
import {
  MessageSquareText,
  LayoutDashboard,
  Code2,
  PenLine,
  Smartphone,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";
import WidgetDemo from "./components/widget-demo";
import { WIDGET_TYPES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <TestimonialToast />

      {/* Hero */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        {/* Blob backgrounds */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-200 rounded-full opacity-40 blur-[128px] pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-[350px] h-[350px] bg-violet-200 rounded-full opacity-30 blur-[128px] pointer-events-none" />
        <div className="absolute top-1/4 -right-20 w-[300px] h-[300px] bg-sky-200 rounded-full opacity-30 blur-[128px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 text-center">
        <a href="#pricing" className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 hover:bg-indigo-100 transition-colors cursor-pointer">
          <Star size={14} />
          先着10名は正式リリース後もずっと無料
        </a>
        <h1 className="text-[1.65rem] sm:text-5xl md:text-6xl font-bold text-gray-900 leading-[1.15] tracking-tight">
          お客様の声を集めて、
          <br />
          ホームページに<span className="text-indigo-600">自動で表示。</span>
        </h1>
        <div className="mt-6 sm:mt-8 flex justify-center gap-6 sm:gap-12">
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-indigo-50 rounded-full flex items-center justify-center">
              <MessageSquareText size={18} className="text-indigo-600 sm:hidden" />
              <MessageSquareText size={22} className="text-indigo-600 hidden sm:block" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-600">フォームで収集</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-indigo-50 rounded-full flex items-center justify-center">
              <LayoutDashboard size={18} className="text-indigo-600 sm:hidden" />
              <LayoutDashboard size={22} className="text-indigo-600 hidden sm:block" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-600">一元管理</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-indigo-50 rounded-full flex items-center justify-center">
              <Code2 size={18} className="text-indigo-600 sm:hidden" />
              <Code2 size={22} className="text-indigo-600 hidden sm:block" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-600">HPに自動表示</span>
          </div>
        </div>
        <p className="mt-6 sm:mt-8 text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          お客様にフォームURLを送って、届いた声を承認するだけ。
          <br className="hidden md:block" />
          あとはホームページに自動反映。
        </p>
        <div className="mt-8 sm:mt-10">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            無料で始める
            <ArrowRight size={18} />
          </Link>
        </div>
        <p className="mt-5 text-sm text-gray-400">
          クレジットカード不要 / Googleアカウントで10秒登録
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-gray-400">
          <span>10秒で登録</span>
          <span>→</span>
          <span>30秒でフォーム完成</span>
          <span>→</span>
          <span>URLを送るだけ</span>
        </div>
        <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
          <img
            src="/Dashboard.png"
            alt="VoiceHub ダッシュボード画面"
            className="w-full rounded-2xl shadow-2xl border border-gray-200"
          />
        </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-16">
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-indigo-600">97%</p>
              <p className="mt-1 text-[11px] sm:text-sm text-gray-500">の消費者がレビューを参考にする<sup className="text-gray-400">※1</sup></p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-indigo-600">+34%</p>
              <p className="mt-1 text-[11px] sm:text-sm text-gray-500">お客様の声で成約率が向上<sup className="text-gray-400">※2</sup></p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-indigo-600">5分</p>
              <p className="mt-1 text-[11px] sm:text-sm text-gray-500">でセットアップ完了</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-x-6 gap-y-1 text-[11px] text-gray-400">
            <span>※1 BrightLocal「Local Consumer Review Survey 2023」</span>
            <span>※2 Spiegel Research Center調べ</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            あなたがやることは、<span className="text-indigo-600">2つだけ。</span>
          </h2>
          <p className="text-center text-gray-500 mb-10 sm:mb-14">
            それ以外は全部、VoiceHubがやります。
          </p>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg font-bold mb-2.5 sm:mb-4">
                1
              </div>
              <h3 className="text-[15px] sm:text-lg font-bold text-gray-900">フォームURLを送る</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                お客様にURLを送るだけ。LINEでもメールでもOK。ステップ形式で、お客様も迷わず回答できます。
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                <CheckCircle2 size={10} className="sm:hidden" />
                <CheckCircle2 size={12} className="hidden sm:block" />
                コピペで送るだけ
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center text-sm sm:text-lg font-bold mb-2.5 sm:mb-4">
                2
              </div>
              <h3 className="text-[15px] sm:text-lg font-bold text-gray-900">届いた声を承認する</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                ダッシュボードに届いた声を確認。「承認」ボタンを押すだけ。内容を見て選べるので安心です。
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                <CheckCircle2 size={10} className="sm:hidden" />
                <CheckCircle2 size={12} className="hidden sm:block" />
                ワンクリック
              </div>
            </div>
          </div>
          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
            ※ ホームページへの埋め込みコードは初回に一度貼るだけ。以降は承認するたびに自動で反映されます。
          </p>
        </div>
      </section>

      {/* Before/After transformation */}
      <section className="bg-gray-50 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10 sm:mb-14">
            導入するだけで、こう変わります。
          </h2>
          <div className="space-y-3 sm:space-y-5">
            {[
              {
                before: "LINEで個別にお願い → スクショ保存 → トリミング",
                after: (<><span className="text-indigo-600 font-semibold">URL1つ</span>送るだけ。自動で収集・整理される</>),
              },
              {
                before: "感想がLINE・メール・DMにバラバラ",
                after: (<>すべて<span className="text-indigo-600 font-semibold">ダッシュボードに集約</span>。検索もタグ付けもできる</>),
              },
              {
                before: "HP更新のたびにコピペ → 画像配置 → 公開",
                after: (<><span className="text-indigo-600 font-semibold">承認ボタンを押すだけ</span>で自動反映</>),
              },
              {
                before: "声を集めるのが申し訳なくて頼めない",
                after: "プロ仕様のフォームだから、お客様も気持ちよく書ける",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row items-stretch rounded-2xl overflow-hidden border border-gray-200"
              >
                <div className="flex-1 bg-gray-50 px-3 py-3 sm:px-6 sm:py-5">
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-2">Before</p>
                  <p className="text-xs sm:text-base text-gray-500">{item.before}</p>
                </div>
                <div className="hidden sm:flex items-center justify-center px-4 bg-white">
                  <ArrowRight size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 bg-white px-3 py-3 sm:px-6 sm:py-5">
                  <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 sm:mb-2">After</p>
                  <p className="text-xs sm:text-base text-gray-900 font-medium">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product screenshots */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            実際の画面をご覧ください。
          </h2>
          <p className="text-center text-gray-500 mb-8">
            お客様が回答するフォームと、ホームページに表示されるウィジェット。
          </p>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-16">
          {/* Form screenshot */}
          <div>
            <img
              src="/Form.png"
              alt="お客様が回答する収集フォーム"
              className="w-full rounded-2xl shadow-lg border border-gray-200"
            />
            <p className="mt-4 text-sm text-gray-500 text-center">お客様が回答するフォーム画面</p>
            <div className="mt-3 text-center">
              <Link
                href="/form/demo"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                収集フォームを試す →
              </Link>
            </div>
          </div>
          {/* Dashboard screenshot */}
          <div>
            <img
              src="/Dashboard.png"
              alt="届いた声を管理するダッシュボード"
              className="w-full rounded-2xl shadow-lg border border-gray-200"
            />
            <p className="mt-4 text-sm text-gray-500 text-center">届いた声を管理するダッシュボード</p>
          </div>
          </div>

          {/* Widget demo */}
          <h3 className="text-lg sm:text-xl font-bold text-center text-gray-900 mb-2">
            ホームページへの表示タイプ
          </h3>
          <p className="text-center text-sm text-gray-500 mb-8">
            {WIDGET_TYPES.length}種類から選べます。
          </p>
          <WidgetDemo />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            シンプルだけど、必要な機能は全部入り。
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mt-10 sm:mt-14">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <MessageSquareText size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">お客様の声 収集フォーム</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">星評価、Before/After、写真アップロード。ステップ形式でお客様が答えやすいから回答率が上がります。</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <LayoutDashboard size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">管理ダッシュボード</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">承認・タグ付け・検索をひとつの画面で。もう「あの声どこだっけ？」と探し回る必要はありません。</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Code2 size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">埋め込みウィジェット</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">{`${WIDGET_TYPES.length}タイプのウィジェット。コードをコピペするだけで完成。`}</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <PenLine size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">手動追加もOK</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">過去にLINEやメールでもらった声もまとめて登録できます。</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Smartphone size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">どのデバイスでも綺麗</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">スマホでもPCでも美しく表示。ペライチ・WordPress・Wixなど主要ツールに対応。</p>
            </div>
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">5分でセットアップ完了</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">Googleアカウントでログイン → フォーム作成 → URL送信。ITが苦手でも迷いません。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            こんな方におすすめです。
          </h2>
          <p className="text-center text-gray-500 mb-8 sm:mb-12">
            「お客様の声」が売上に直結する仕事をしている方にぴったりです。
          </p>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">コーチ・コンサルタント</p>
                <p className="text-xs sm:text-sm text-gray-500">受講生の声が次の集客につながる</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">オンライン講座の運営者</p>
                <p className="text-xs sm:text-sm text-gray-500">受講後の変化を可視化したい</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">セラピスト・カウンセラー</p>
                <p className="text-xs sm:text-sm text-gray-500">口コミが信頼構築の生命線</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">ヨガ・フィットネス講師</p>
                <p className="text-xs sm:text-sm text-gray-500">生徒さんの声で新規集客を加速</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">フリーランス</p>
                <p className="text-xs sm:text-sm text-gray-500">実績の証明としてポートフォリオに</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white">
              <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">スモールビジネスオーナー</p>
                <p className="text-xs sm:text-sm text-gray-500">お客様の生の声が最強の営業マン</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="bg-gray-50 py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            今なら、ベータ版で全機能が<span className="text-indigo-600">無料。</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 leading-relaxed">
            VoiceHubは現在ベータ版です。
            <br />
            すべての機能を無料でお使いいただけます。
            <br />
            <span className="font-medium text-gray-800">正式リリース後も、ベータユーザーには特別価格をご用意しています。</span>
          </p>
          <div className="bg-white rounded-2xl border-2 border-indigo-600 p-6 sm:p-8 max-w-sm mx-auto">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
              <Star size={12} />
              ベータ限定
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900">¥0</p>
            <p className="text-sm text-gray-500 mt-1">全機能が無料で使い放題</p>
            <ul className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-left">
              {[
                "お客様の声フォーム 無制限",
                "お客様の声の登録数 無制限",
                "埋め込みウィジェット 無制限",
                `${WIDGET_TYPES.length}種類のウィジェットデザイン`,
                "手動追加OK",
                "ペライチ・WordPress対応",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block mt-6 sm:mt-8 w-full px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-center"
            >
              無料で始める
            </Link>
            <p className="mt-3 text-xs text-gray-400">
              クレジットカード不要
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-20 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
            よくある質問
          </h2>
          <div className="space-y-3">
            <FaqItem
              q="本当に無料ですか？"
              a="はい。ベータ期間中はすべての機能を無料でお使いいただけます。正式リリース後に有料プランを用意しますが、ベータユーザーには特別割引を適用します。"
            />
            <FaqItem
              q="ITが苦手でも使えますか？"
              a="はい、使えます。Googleアカウントでログインして、フォームを作って、URLを送るだけ。パソコンが苦手な方でも5分で始められるように設計しています。"
            />
            <FaqItem
              q="ペライチやWordPressに対応していますか？"
              a="はい。埋め込みコード（スクリプトタグ）をコピペするだけで表示されます。iframe版もあるので、ほぼすべてのホームページ作成ツールに対応しています。"
            />
            <FaqItem
              q="お客様の声が少なくても使えますか？"
              a="もちろんです。まずは1件から始めましょう。過去にLINEやメールでもらった声を手動で追加することもできます。"
            />
            <FaqItem
              q="お客様の声はどのようにホームページに表示されますか？"
              a={`${WIDGET_TYPES.length}タイプから選べます。カルーセル・グリッド・マーキー・デュアルマーキーなど多彩なデザイン。どれもスマホ対応で、デザイン崩れの心配はありません。`}
            />
            <FaqItem
              q="届いたレビューは全て表示されるのですか？"
              a="いいえ。ご自身でダッシュボードから確認し、承認したレビューだけがホームページに表示されます。載せたくない声は非承認にすればOKです。"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
            お客様の声は、あなたの代わりに
            <br />
            24時間、営業してくれます。
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-indigo-100">
            まだ手動で声を集めて、手動で載せますか？
            <br />
            VoiceHubなら、今日から変えられます。
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 mt-8 sm:mt-10 px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg font-semibold bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            無料で始める
            <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-sm text-indigo-200">
            Googleアカウントで10秒登録 / クレジットカード不要
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-indigo-300">
            <span>10秒で登録</span>
            <span>→</span>
            <span>30秒でフォーム完成</span>
            <span>→</span>
            <span>URLを送るだけ</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>&copy; 2026 VoiceHub. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
