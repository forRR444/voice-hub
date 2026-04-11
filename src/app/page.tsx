"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PublicHeader from "./components/public-header";
import TestimonialToast from "./components/testimonial-toast";
import FaqItem from "./components/faq-item";
import IconCircle from "./components/ui/icon-circle";
import BulletItem from "./components/ui/bullet-item";
import CTAButton from "./components/ui/cta-button";
import {
  MessageSquareText,
  LayoutDashboard,
  Code,
  PenLine,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  MessageCircle,
  QrCode,
  Instagram,
  ImageIcon,
  MapPin,
  Store,
} from "lucide-react";
import WidgetDemo from "./components/widget-demo";
import { WIDGET_TYPES } from "@/lib/constants";


const FEATURE_CARDS = [
  {
    icon: Code,
    title: "ホームページに埋め込み",
    description: (
      <>
        埋め込みコードを<span className="text-[var(--brand)] font-semibold">コピペするだけ</span>。
        <br />
        承認した声がホームページに自動で表示されます。
      </>
    ),
    bullets: ["コード1行で設置完了", "スマホでも綺麗に表示"],
  },
  {
    icon: Instagram,
    title: "SNS投稿画像を作成",
    description: (
      <>
        お客様の声から、そのままInstagramやXに使える画像を
        <br />
        <span className="text-[var(--brand)] font-semibold">ワンクリックで生成</span>。
      </>
    ),
    bullets: null,
  },
  {
    icon: Store,
    title: "お客様の声ページが持てる",
    description: (
      <>
        インスタのプロフリンクに<span className="text-[var(--brand)] font-semibold">URLを貼るだけ</span>。
        <br />
        お客様の声付きのサロン紹介ページが簡単に作れます。
      </>
    ),
    bullets: ["LINE・予約リンクもまとめて設置", "HPの代わりとして使える"],
  },
  {
    icon: LayoutDashboard,
    title: "管理ダッシュボード",
    description: (
      <>
        届いた声を<span className="text-[var(--brand)] font-semibold">ひとつの画面</span>で管理。
        <br />
        承認・タグ付け・検索もワンクリック。
      </>
    ),
    bullets: null,
  },
];

const PAIN_SOLUTIONS = [
  {
    icon: <MessageSquareText size={18} className="text-[var(--brand)]" />,
    pain: "LINEで個別にお願い",
    solution: (<><span className="text-[var(--brand)] font-semibold">URL1つ</span>で自動収集</>),
  },
  {
    icon: <LayoutDashboard size={18} className="text-[var(--brand)]" />,
    pain: "口コミがバラバラ",
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
];

const PRICING_FEATURES = [
  "登録数・ウィジェット 無制限",
  "承認するだけでHPに自動反映",
  "SNS投稿画像をワンクリック生成",
  "お客様の声つきサロンページ",
  "Google口コミ取り込み",
];

export default function Home() {
  const pinRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastActiveRef = useRef(-1);

  useEffect(() => {
    const container = pinRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const count = FEATURE_CARDS.length;
      const active = Math.min(Math.floor(progress * count), count - 1);

      // Update card transforms directly
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        const offset = i - active;
        card.style.transform = `translateX(${offset * 110}%)`;
        card.style.opacity = offset === 0 ? "1" : "0.15";
      });

      // Update dots
      if (active !== lastActiveRef.current) {
        dotsRef.current.forEach((dot, i) => {
          if (!dot) return;
          if (i === active) {
            dot.style.background = "var(--brand)";
            dot.style.transform = "scale(1.3)";
          } else {
            dot.style.background = "rgba(99,91,255,0.2)";
            dot.style.transform = "scale(1)";
          }
        });
        lastActiveRef.current = active;
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const setCardRef = useCallback((el: HTMLDivElement | null, i: number) => {
    cardsRef.current[i] = el;
  }, []);
  const setDotRef = useCallback((el: HTMLDivElement | null, i: number) => {
    dotsRef.current[i] = el;
  }, []);

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
              <IconCircle icon={MapPin} size="md" />
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">Google口コミ取込</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <IconCircle icon={MessageSquareText} size="md" />
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">フォームで収集</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <IconCircle icon={Code} size="md" />
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">HPに自動表示</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <IconCircle icon={Instagram} size="md" />
              <span className="text-[10px] sm:text-xs text-[var(--slate)]">SNS投稿画像を作成</span>
            </div>
          </div>
          <p className="mt-6 sm:mt-8 text-sm sm:text-xl text-[var(--slate)] max-w-2xl mx-auto leading-relaxed">
            お客様にフォームURLを送って、届いた声を承認するだけ。
            <br className="hidden md:block" />
            ホームページに自動反映。SNS用の投稿画像もワンクリックで。
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
            <CTAButton href="/try">
              無料で試してみる
              <ArrowRight size={16} />
            </CTAButton>
            <span className="text-xs text-[var(--slate)]">登録不要・30秒で体験</span>
          </div>
          <div className="mt-10 sm:mt-14 max-w-3xl mx-auto">
            <img
              src="/Dashboard.png"
              alt="VoiceHub ダッシュボード画面"
              className="w-full rounded-lg shadow-ambient"
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
          <h2 className="section-heading text-center mb-4">
            <span className="text-[var(--brand)]">2ステップ</span>で完了
          </h2>
          <p className="text-center text-sm sm:text-base text-[var(--slate)] mb-12 sm:mb-16">
            あとはホームページに自動反映。SNS投稿画像もすぐ作れます。
          </p>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-[var(--plate)] rounded-lg p-4 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-4xl font-bold text-[var(--brand)] tracking-[-0.022em]">1</span>
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--brand)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <QrCode size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                </div>
              </div>
              <h3 className="mt-3 text-sm sm:text-lg font-semibold text-[var(--ink)] tracking-[-0.011em]">フォームURLを送る</h3>
              <p className="mt-2 text-sm text-[var(--slate)] leading-relaxed">
                お客様に<span className="text-[var(--brand)] font-semibold">URL</span>を送るだけ。LINEでもメールでもOK。<span className="text-[var(--brand)] font-semibold">QRコード</span>も作れるので、店頭やレジ横に置くこともできます。
              </p>
            </div>
            <div className="bg-[var(--plate)] rounded-lg p-4 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-4xl font-bold text-[var(--brand)] tracking-[-0.022em]">2</span>
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} className="sm:!w-6 sm:!h-6 text-[var(--brand)]" />
                </div>
              </div>
              <h3 className="mt-3 text-sm sm:text-lg font-semibold text-[var(--ink)] tracking-[-0.011em]">届いた声を承認する</h3>
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
      <section className="bg-[var(--plate)] py-12 sm:py-24">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="section-heading text-center mb-8 sm:mb-16">
            こんな面倒から解放されます。
          </h2>
          <div className="space-y-3.5 sm:space-y-6">
            {PAIN_SOLUTIONS.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 sm:gap-3 text-sm sm:text-lg leading-relaxed">
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

      {/* ── Product + Features (scroll-pinned horizontal) ── */}
      <div ref={pinRef} id="features" className="relative scroll-mt-20" style={{ height: `${FEATURE_CARDS.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex flex-col pt-20 sm:pt-0 sm:justify-center overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 w-full">
            <h2 className="section-heading text-center mb-4 sm:mb-8">
              できること
            </h2>

            {/* Progress dots */}
            <div className="flex justify-center gap-2.5 mb-6 sm:mb-8">
              {FEATURE_CARDS.map((_, i) => (
                <div
                  key={i}
                  ref={(el) => setDotRef(el, i)}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: i === 0 ? "var(--brand)" : "rgba(99,91,255,0.2)",
                    transform: i === 0 ? "scale(1.3)" : "scale(1)",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>

            {/* Cards track */}
            <div className="relative" style={{ height: "min(60vh, 420px)" }}>
              {FEATURE_CARDS.map((feature, i) => (
                <div
                  key={i}
                  ref={(el) => setCardRef(el, i)}
                  className="absolute inset-0"
                  style={{
                    transform: `translateX(${i * 110}%)`,
                    opacity: i === 0 ? 1 : 0.15,
                    transition: "transform 0.4s ease-out, opacity 0.4s ease-out",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10 items-start">
                    <div>
                      <IconCircle icon={feature.icon} size="sm" className="mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-2xl font-semibold text-[var(--ink)] tracking-[-0.022em]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[var(--slate)] leading-relaxed">
                        {feature.description}
                      </p>
                      {feature.bullets && (
                        <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-[var(--ink)]">
                          {feature.bullets.map((item, j) => (
                            <BulletItem key={j}>{item}</BulletItem>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {i === 0 && (
                        <div className="w-full max-h-[280px] sm:max-h-[340px] overflow-hidden rounded-lg shadow-ambient">
                          <img src="/widget-demo-screenshot.png" alt="HPウィジェット埋め込み例" className="w-full object-cover object-top" />
                        </div>
                      )}
                      {i === 1 && (
                        <img src="/sns-story-sample.png" alt="SNS投稿画像" className="w-36 sm:w-48 rounded-lg shadow-ambient" />
                      )}
                      {i === 2 && (
                        <img src="/Dashboard.png" alt="サロンページ" className="w-full rounded-lg shadow-ambient" />
                      )}
                      {i === 3 && (
                        <img src="/Dashboard.png" alt="管理ダッシュボード" className="w-full rounded-lg shadow-ambient" />
                      )}
                    </div>
                    {/* Compact features */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-x-4 sm:gap-x-16 gap-y-2 sm:gap-y-6 mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-[var(--ghost-border)]">
                      {[
                        { icon: MessageSquareText, title: "お客様の声 収集フォーム", desc: "星評価・写真付き。ステップ形式で回答率アップ。" },
                        { icon: MapPin, title: "Google口コミを取り込み", desc: "ワンクリックでそのまま取り込み。" },
                        { icon: PenLine, title: "手動追加もOK", desc: "LINEやメールの声もまとめて登録。" },
                        { icon: Zap, title: "5分でセットアップ完了", desc: "5分あれば始められます。" },
                      ].map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2 sm:gap-3">
                          <IconCircle icon={f.icon} size="xs" className="mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-[10px] sm:text-sm font-semibold text-[var(--ink)]">{f.title}</h4>
                            <p className="text-[10px] sm:text-sm text-[var(--slate)] leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-12 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Widget demo */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-center text-[var(--ink)] tracking-[-0.022em] mb-2">
              ホームページへの表示タイプ
            </h3>
            <p className="text-center text-xs sm:text-sm text-[var(--slate)] mb-8">
              {WIDGET_TYPES.length}種類から選べます。
            </p>
            <WidgetDemo />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[var(--plate)] py-12 sm:py-24 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="section-heading text-center mb-4">
            今なら、ベータ版で全機能が<span className="text-[var(--brand)]">無料。</span>
          </h2>
          <p className="text-xs sm:text-lg text-[var(--slate)] mb-8 sm:mb-12 leading-relaxed">
            現在ベータ版につき、全機能を無料で使えます。
            <br />
            <span className="font-medium text-[var(--ink)]">ベータユーザーには正式リリース後も特別価格を適用します。</span>
          </p>
          <div className="bg-[var(--canvas)] rounded-lg p-4 sm:p-8 max-w-sm mx-auto shadow-ambient">
            <p className="text-sm font-semibold tracking-wide uppercase text-[var(--brand)] mb-3 sm:mb-4">ベータ限定</p>
            <p className="text-2xl sm:text-4xl font-bold text-[var(--ink)] tabular-nums">¥0</p>
            <p className="text-xs sm:text-sm text-[var(--slate)] mt-1">全機能が無料で使い放題</p>
            <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 text-left">
              {PRICING_FEATURES.map((item, i) => (
                <BulletItem key={i} className="text-xs sm:text-sm text-[var(--ink)]">{item}</BulletItem>
              ))}
            </ul>
            <CTAButton href="/try" size="lg" block className="mt-6 sm:mt-8">
              まずは試してみる
            </CTAButton>
            <p className="mt-3 text-xs text-[var(--slate)]">
              クレジットカード不要
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="section-heading text-center mb-8 sm:mb-14">
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
      <section className="bg-[#2A3050] py-14 sm:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-xl sm:text-[2.5rem] font-bold text-white leading-tight tracking-[-0.022em]">
            お客様の声は、
            <br />
            24時間、営業してくれます。
          </h2>
          <p className="mt-4 sm:mt-6 text-xs sm:text-lg text-white/70 leading-relaxed">
            コーチ・コンサル、サロン、教室、フリーランスなど、
            <br className="hidden sm:block" />
            口コミを活かしたいすべての方に。
          </p>
          <div className="mt-6 sm:mt-10 flex flex-col items-center gap-2 sm:gap-3">
            <CTAButton href="/try" size="sm">
              無料で試してみる
              <ArrowRight size={14} className="sm:hidden" />
              <ArrowRight size={18} className="hidden sm:block" />
            </CTAButton>
            <span className="text-xs text-white">登録不要・30秒で体験</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 sm:py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-[var(--slate)]">
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
