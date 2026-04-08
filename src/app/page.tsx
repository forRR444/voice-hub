"use client";

import Link from "next/link";
import PublicHeader from "./components/public-header";
import TestimonialToast from "./components/testimonial-toast";
import FaqItem from "./components/faq-item";
import {
  MessageSquareText,
  LayoutDashboard,
  Code,
  PenLine,
  Smartphone,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  MessageCircle,
  QrCode,
  Instagram,
  ImageIcon,
  MapPin,
  Circle,
} from "lucide-react";
import WidgetDemo from "./components/widget-demo";
import { WIDGET_TYPES } from "@/lib/constants";


export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <PublicHeader />
      <TestimonialToast />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-indigo-200 rounded-full opacity-40 blur-[100px] sm:blur-[128px] pointer-events-none" />
        <div className="absolute top-1/3 -left-10 sm:-left-20 w-[200px] sm:w-[350px] h-[200px] sm:h-[350px] bg-violet-200 rounded-full opacity-30 blur-[80px] sm:blur-[128px] pointer-events-none" />
        <div className="absolute top-1/4 -right-10 sm:-right-20 w-[180px] sm:w-[300px] h-[180px] sm:h-[300px] bg-sky-200 rounded-full opacity-30 blur-[80px] sm:blur-[128px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 text-center">
          <a href="#pricing" className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 hover:bg-indigo-100 transition-colors cursor-pointer">
            <Star size={14} />
            先着10名は正式リリース後もずっと無料
          </a>
          <h1 className="text-[1.65rem] sm:text-5xl md:text-6xl font-bold text-[var(--ink)] leading-[1.15] tracking-[-0.022em]">
            お客様の声を集めて、
            <br />
            <span className="text-[var(--brand)]">HPにもSNSにも。</span>
          </h1>
          <div className="mt-6 sm:mt-8 flex justify-center gap-6 sm:gap-12">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-50 rounded-full flex items-center justify-center">
                <MapPin size={22} className="text-[var(--brand)] sm:hidden" />
                <MapPin size={28} className="text-[var(--brand)] hidden sm:block" />
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">Google口コミ取込</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-50 rounded-full flex items-center justify-center">
                <MessageSquareText size={22} className="text-[var(--brand)] sm:hidden" />
                <MessageSquareText size={28} className="text-[var(--brand)] hidden sm:block" />
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">フォームで収集</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-50 rounded-full flex items-center justify-center">
                <Code size={22} className="text-[var(--brand)] sm:hidden" />
                <Code size={28} className="text-[var(--brand)] hidden sm:block" />
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">HPに自動表示</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-50 rounded-full flex items-center justify-center">
                <Instagram size={22} className="text-[var(--brand)] sm:hidden" />
                <Instagram size={28} className="text-[var(--brand)] hidden sm:block" />
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">SNS投稿画像を作成</span>
            </div>
          </div>
          <p className="mt-6 sm:mt-8 text-base sm:text-xl text-[var(--slate)] max-w-2xl mx-auto leading-relaxed">
            お客様にフォームURLを送って、届いた声を承認するだけ。
            <br className="hidden md:block" />
            ホームページに自動反映。SNS用の投稿画像もワンクリックで。
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold bg-[var(--brand)] text-white rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition"
            >
              無料で試してみる
              <ArrowRight size={16} />
            </Link>
            <span className="text-xs text-[var(--slate)]">登録不要・30秒で体験</span>
          </div>
          <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
            <img
              src="/Dashboard.png"
              alt="VoiceHub ダッシュボード画面"
              className="w-full rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-[var(--plate)] py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 sm:gap-16">
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-[var(--brand)] tabular-nums">97%</p>
              <p className="mt-1.5 text-[11px] sm:text-sm text-[var(--slate)]">の消費者がレビューを参考にする</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-[var(--brand)] tabular-nums">+34%</p>
              <p className="mt-1.5 text-[11px] sm:text-sm text-[var(--slate)]">お客様の声で成約率が向上</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-4xl font-bold text-[var(--brand)] tabular-nums">5分</p>
              <p className="mt-1.5 text-[11px] sm:text-sm text-[var(--slate)]">でセットアップ完了</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-x-6 gap-y-1 text-[11px] text-[var(--slate)] opacity-60">
            <span>※1 BrightLocal「Local Consumer Review Survey 2023」</span>
            <span>※2 Spiegel Research Center調べ</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-[2rem] font-bold text-center text-[var(--ink)] tracking-[-0.022em] mb-4">
            <span className="text-[var(--brand)]">2ステップ</span>で完了
          </h2>
          <p className="text-center text-[var(--slate)] mb-12 sm:mb-16">
            あとはホームページに自動反映。SNS投稿画像もすぐ作れます。
          </p>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-[var(--plate)] rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--brand)] tracking-[-0.022em]">1</span>
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <QrCode size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                </div>
              </div>
              <h3 className="mt-3 text-base sm:text-lg font-semibold text-[var(--ink)] tracking-[-0.011em]">フォームURLを送る</h3>
              <p className="mt-2 text-sm text-[var(--slate)] leading-relaxed">
                お客様に<span className="text-[var(--brand)] font-semibold">URL</span>を送るだけ。LINEでもメールでもOK。<span className="text-[var(--brand)] font-semibold">QRコード</span>も作れるので、店頭やレジ横に置くこともできます。
              </p>
            </div>
            <div className="bg-[var(--plate)] rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-[var(--brand)] tracking-[-0.022em]">2</span>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                </div>
              </div>
              <h3 className="mt-3 text-base sm:text-lg font-semibold text-[var(--ink)] tracking-[-0.011em]">届いた声を承認する</h3>
              <p className="mt-2 text-sm text-[var(--slate)] leading-relaxed">
                ダッシュボードに届いた声を確認。「承認」ボタンを押すだけ。内容を見て選べるので安心です。
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs sm:text-sm text-[var(--slate)]">
            ※ ホームページへの埋め込みコードは初回に一度貼るだけ。以降は承認するたびに自動で反映されます。
          </p>
        </div>
      </section>

      {/* ── Pain → Solution ── */}
      <section className="bg-[var(--plate)] py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl sm:text-[2rem] font-bold text-center text-[var(--ink)] tracking-[-0.022em] mb-14 sm:mb-16">
            こんな面倒から解放されます。
          </h2>
          <div className="space-y-5 sm:space-y-6">
            {[
              {
                icon: <MessageSquareText size={18} className="text-[var(--brand)]" />,
                pain: "LINEで個別にお願い",
                solution: (<><span className="text-[var(--brand)] font-semibold">URL1つ</span>で自動収集</>),
              },
              {
                icon: <LayoutDashboard size={18} className="text-[var(--brand)]" />,
                pain: "感想がバラバラに散らばる",
                solution: (<><span className="text-[var(--brand)] font-semibold">ダッシュボード</span>に集約</>),
              },
              {
                icon: <Code size={18} className="text-[var(--brand)]" />,
                pain: "HPを手動で更新",
                solution: (<><span className="text-[var(--brand)] font-semibold">承認だけ</span>で自動反映</>),
              },
              {
                icon: <ImageIcon size={18} className="text-[var(--brand)]" />,
                pain: "SNS画像を毎回作成",
                solution: (<><span className="text-[var(--brand)] font-semibold">ワンクリック</span>で自動生成</>),
              },
              {
                icon: <MessageCircle size={18} className="text-[var(--brand)]" />,
                pain: "口コミを頼みづらい",
                solution: "フォームURLを送るだけ",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-base sm:text-lg leading-relaxed">
                <span className="shrink-0">{item.icon}</span>
                <p>
                  <span className="text-[var(--slate)] line-through decoration-[var(--slate)]/30">{item.pain}</span>
                  <span className="mx-2 text-[var(--slate)]">→</span>
                  <span className="text-[var(--ink)] font-medium">{item.solution}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product + Features (統合セクション) ── */}
      <section id="features" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-[2rem] font-bold text-center text-[var(--ink)] tracking-[-0.022em] mb-4">
            できること
          </h2>
          <p className="text-center text-[var(--slate)] mb-12 sm:mb-16">
            回答フォームと、ホームページに表示されるウィジェット。
          </p>

          {/* Screenshots */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 mb-16 sm:mb-24">
            <div>
              <img
                src="/Form.png"
                alt="お客様が回答する収集フォーム"
                className="w-full rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
              />
              <p className="mt-4 text-sm text-[var(--slate)] text-center">お客様が回答するフォーム画面</p>
              <div className="mt-3 text-center">
                <Link
                  href="/form/demo"
                  className="text-sm font-medium text-[var(--brand)] hover:brightness-110 transition"
                >
                  収集フォームを試す →
                </Link>
              </div>
            </div>
            <div>
              <img
                src="/Dashboard.png"
                alt="届いた声を管理するダッシュボード"
                className="w-full rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
              />
              <p className="mt-4 text-sm text-[var(--slate)] text-center">届いた声を管理するダッシュボード</p>
            </div>
          </div>

          {/* Feature 1: HP埋め込み — テキスト左、ビジュアル右 */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center mb-16 sm:mb-24">
            <div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Code size={20} className="text-[var(--brand)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-[-0.022em]">
                ホームページに埋め込み
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--slate)] leading-relaxed">
                埋め込みコードを<span className="text-[var(--brand)] font-semibold">コピペするだけ</span>。承認した声がホームページに自動で表示されます。{WIDGET_TYPES.length}種類のデザインから選べます。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
                {["ペライチ・WordPress・Wix対応", "コード1行で設置完了", "スマホでも綺麗に表示"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Circle size={6} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src="/widget-demo-screenshot.png"
                alt="ピアノ教室のホームページにVoiceHubウィジェットを埋め込んだ例"
                className="w-full rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
              />
            </div>
          </div>

          {/* Feature 2: SNS画像 — ビジュアル左、テキスト右（交互） */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center mb-16 sm:mb-24">
            <div className="order-2 md:order-1 flex justify-center">
              <img
                src="/sns-story-sample.png"
                alt="VoiceHubで生成したInstagramストーリー用画像"
                className="w-48 sm:w-56 rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Instagram size={20} className="text-[var(--brand)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-[-0.022em]">
                SNS投稿画像を作成
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--slate)] leading-relaxed">
                お客様の声から、そのままInstagramやストーリーズに使える画像を<span className="text-[var(--brand)] font-semibold">ワンクリックで生成</span>。デザインの手間ゼロ。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
                {["ストーリーズ・フィード対応", "ワンクリックで画像生成", "そのままSNSに投稿できる"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Circle size={6} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: 管理ダッシュボード — テキスト左、スクショ右 */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center mb-16 sm:mb-24">
            <div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <LayoutDashboard size={20} className="text-[var(--brand)]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-[-0.022em]">
                管理ダッシュボード
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[var(--slate)] leading-relaxed">
                届いた声を<span className="text-[var(--brand)] font-semibold">ひとつの画面</span>で管理。承認・タグ付け・検索もワンクリック。
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
                {["承認・非承認をワンクリック", "タグ付け・検索で整理", "お気に入り機能で優先表示"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Circle size={6} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <img
                src="/Dashboard.png"
                alt="VoiceHub管理ダッシュボード"
                className="w-full rounded-lg shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]"
              />
            </div>
          </div>

          {/* Compact feature list */}
          <div className="grid sm:grid-cols-2 gap-x-16 gap-y-8 sm:gap-y-10">
            {[
              { icon: <MessageSquareText size={20} />, title: "お客様の声 収集フォーム", desc: (<>星評価・写真付き。<span className="text-[var(--brand)] font-semibold">ステップ形式</span>で回答率アップ。</>) },
              { icon: <MapPin size={20} />, title: "Google口コミを取り込み", desc: (<>Googleマップの口コミを<span className="text-[var(--brand)] font-semibold">ワンクリック</span>でそのまま取り込み。</>) },
              { icon: <PenLine size={20} />, title: "手動追加もOK", desc: "LINEやメールでもらった声もまとめて登録。" },
              { icon: <Zap size={20} />, title: "5分でセットアップ完了", desc: (<><span className="text-[var(--brand)] font-semibold">5分</span>あれば始められます。</>) },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 text-[var(--brand)]">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[var(--ink)] tracking-[-0.011em]">{f.title}</h4>
                  <p className="mt-1 text-sm text-[var(--slate)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Widget demo */}
          <div className="mt-16 sm:mt-24">
            <h3 className="text-lg sm:text-xl font-semibold text-center text-[var(--ink)] tracking-[-0.022em] mb-2">
              ホームページへの表示タイプ
            </h3>
            <p className="text-center text-sm text-[var(--slate)] mb-8">
              {WIDGET_TYPES.length}種類から選べます。
            </p>
            <WidgetDemo />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[var(--plate)] py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-[2rem] font-bold text-[var(--ink)] tracking-[-0.022em] mb-4">
            今なら、ベータ版で全機能が<span className="text-[var(--brand)]">無料。</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--slate)] mb-10 sm:mb-12 leading-relaxed">
            現在ベータ版につき、全機能を無料で使えます。
            <br />
            <span className="font-medium text-[var(--ink)]">ベータユーザーには正式リリース後も特別価格を適用します。</span>
          </p>
          <div className="bg-[var(--canvas)] rounded-lg p-6 sm:p-8 max-w-sm mx-auto shadow-[0_2px_4px_rgba(26,31,54,0.04),0_12px_24px_rgba(26,31,54,0.08)]">
            <p className="text-label text-[var(--brand)] mb-4">ベータ限定</p>
            <p className="text-3xl sm:text-4xl font-bold text-[var(--ink)] tabular-nums">¥0</p>
            <p className="text-sm text-[var(--slate)] mt-1">全機能が無料で使い放題</p>
            <ul className="mt-6 space-y-3 text-left">
              {[
                "お客様の声フォーム 無制限",
                "お客様の声の登録数 無制限",
                "埋め込みウィジェット 無制限",
                `${WIDGET_TYPES.length}種類のウィジェットデザイン`,
                "SNS投稿画像をワンクリック生成",
                "Google口コミ 最新5件を取り込み",
                "手動追加OK",
                "ペライチ・WordPress対応",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--ink)]">
                  <CheckCircle size={15} className="text-[var(--brand)] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/try"
              className="block mt-8 w-full px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold bg-[var(--brand)] text-white rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition text-center"
            >
              まずは試してみる
            </Link>
            <p className="mt-3 text-xs text-[var(--slate)]">
              クレジットカード不要
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-[2rem] font-bold text-center text-[var(--ink)] tracking-[-0.022em] mb-10 sm:mb-14">
            よくある質問
          </h2>
          <div className="space-y-3">
            <FaqItem
              q="本当に無料ですか？"
              a="はい。ベータ期間中は全機能を無料で使えます。正式リリース後に有料プランを予定していますが、ベータユーザーには特別価格を用意します。"
            />
            <FaqItem
              q="ITが苦手でも使えますか？"
              a="使えます。メールアドレスで登録して、フォームを作って、URLを送るだけです。5分あれば始められます。"
            />
            <FaqItem
              q="ペライチやWordPressに対応していますか？"
              a="対応しています。埋め込みコードをコピペするだけです。iframe版もあるので、ほぼどのツールでも使えます。"
            />
            <FaqItem
              q="お客様の声が少なくても使えますか？"
              a="もちろんです。1件からでも使えます。過去にLINEやメールでもらった声も手動で追加できます。"
            />
            <FaqItem
              q="お客様の声はどのようにホームページに表示されますか？"
              a={`${WIDGET_TYPES.length}種類のウィジェットから選べます。カルーセル・グリッド・マーキーなど。すべてスマホ対応です。`}
            />
            <FaqItem
              q="届いたレビューは全て表示されるのですか？"
              a="いいえ。ダッシュボードで承認した声だけが表示されます。載せたくない声は非承認にできます。"
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#2A3050] py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-[2.5rem] font-bold text-white leading-tight tracking-[-0.022em]">
            お客様の声は、
            <br />
            24時間、営業してくれます。
          </h2>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-white/70 leading-relaxed">
            コーチ・コンサル、サロン、教室、フリーランスなど、
            <br className="hidden sm:block" />
            口コミを活かしたいすべての方に。
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 sm:px-10 sm:py-4 text-base sm:text-lg font-semibold bg-[var(--brand)] text-white rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 transition"
            >
              無料で試してみる
              <ArrowRight size={18} />
            </Link>
            <span className="text-xs text-white">登録不要・30秒で体験</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--slate)]">
          <span>&copy; 2026 VoiceHub. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">プライバシーポリシー</Link>
            <a href="https://forms.gle/XA7EA9CNGr67WeSk7" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)] transition-colors">お問い合わせ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
