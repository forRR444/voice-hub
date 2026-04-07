"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Star,
  Check,
  X,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ChevronDown,
  MessageSquare,
  CircleDot,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, TestimonialWithTags, FormQuestion } from "@/types/database";
import TryDataDetector from "./try-data-detector";
import { formatDate } from "@/lib/utils";
import AddTestimonialModal from "./add-testimonial-modal";
import GoogleReviewsModal from "./google-reviews-modal";
import PageTitle from "@/app/components/page-title";

/* ─── Design Tokens ─── */
const ink    = "#1A1F36";
const slate  = "#4F566B";
const muted  = "#A3ACB9";
const canvas = "#F7F8F9";
const white  = "#FFFFFF";
const plate  = "#F0F1F3";
const brand  = "#635BFF";
const brandD = "#493EE5";
const rule   = "#E3E8EE";
const gradient = `linear-gradient(180deg, ${brand} 0%, ${brandD} 100%)`;
const ghostBorder = "1px solid rgba(199,196,216,0.2)";
const floatShadow = "0px 2px 4px rgba(26,31,54,0.04), 0px 12px 32px rgba(26,31,54,0.08)";

type FilterTab = "all" | "pending" | "approved" | "rejected";
type FormInfo = { id: string; slug: string; title: string; brand_color: string; questions: FormQuestion[] };

export default function DashboardClient({
  workspace,
  testimonials: initialTestimonials,
  forms: _forms,
  brandColor: _brandColor,
}: {
  workspace: WorkspaceRow;
  testimonials: TestimonialWithTags[];
  forms: FormInfo[];
  brandColor: string;
}) {
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<TestimonialWithTags[]>(initialTestimonials);
  const real = useMemo(() => testimonials.filter((t) => t.source !== "sample" && t.source !== "guide"), [testimonials]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const filtered = useMemo(() => {
    let list = real;
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
    }
    return list;
  }, [real, filter, search]);

  const stats = useMemo(() => {
    const total = real.length;
    const approved = real.filter((t) => t.status === "approved").length;
    const pending = real.filter((t) => t.status === "pending").length;
    const rated = real.filter((t) => t.rating != null);
    const avg = rated.length > 0 ? rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length : 0;
    const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, avg, approvedPct };
  }, [real]);

  async function updateStatus(id: string, status: "approved" | "rejected" | "pending") {
    const { error } = await supabase.from("testimonials").update({ status }).eq("id", id);
    if (error) { window.alert("ステータスの更新に失敗しました"); return; }
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }


  function handleTestimonialAdded(t: TestimonialWithTags) { setTestimonials((prev) => [t, ...prev]); setShowAddModal(false); }
  function handleGoogleImported(imported: TestimonialWithTags[]) { setTestimonials((prev) => [...imported, ...prev]); setShowGoogleModal(false); }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "approved", label: "承認済み" },
    { key: "rejected", label: "非承認" },
    { key: "pending", label: "未承認" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-8 sm:mb-10 animate-fade-in relative z-30">
        <PageTitle>ダッシュボード</PageTitle>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 cursor-pointer"
            style={{ background: gradient }}
          >
            <Plus size={15} />
            追加
            <ChevronDown size={12} className="ml-0.5" />
          </button>
          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
              <div className="absolute right-0 top-12 z-50 w-60 rounded-[4px] py-1.5" style={{ background: white, boxShadow: floatShadow }}>
                <button
                  onClick={() => { setShowAddModal(true); setShowAddMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm cursor-pointer transition-opacity duration-150 hover:opacity-70"
                  style={{ color: ink }}
                >
                  <Plus size={14} style={{ color: brand }} />
                  手動で追加
                </button>
                <button
                  onClick={() => { setShowGoogleModal(true); setShowAddMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm cursor-pointer transition-opacity duration-150 hover:opacity-70"
                  style={{ color: ink }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google口コミをインポート
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Stats ─── */}
      {stats.total > 0 && (
        <>
        {/* Mobile: 1 card with inline stats / Desktop: 4 separate cards */}
        <div className="sm:hidden rounded-[4px] flex mb-6 animate-fade-in-delay-1" style={{ background: plate }}>
          {[
            { label: "合計", value: stats.total },
            { label: "承認済み", value: stats.approved },
            { label: "未承認", value: stats.pending },
            { label: "平均評価", value: stats.avg > 0 ? stats.avg.toFixed(1) : "-" },
          ].map((s) => (
            <div key={s.label} className="flex-1 py-3.5 text-center">
              <span className="block text-[11px] font-medium uppercase mb-1" style={{ color: slate, letterSpacing: "0.04em" }}>{s.label}</span>
              <span className="block text-xl font-semibold tabular-nums" style={{ color: ink, letterSpacing: "-0.022em" }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="hidden sm:grid grid-cols-4 gap-3 mb-8 animate-fade-in-delay-1">
          {[
            { label: "合計", value: stats.total, icon: <MessageSquare size={14} style={{ color: slate }} /> },
            { label: "承認済み", value: stats.approved, icon: <CheckCircle size={14} style={{ color: slate }} /> },
            { label: "未承認", value: stats.pending, icon: <CircleDot size={14} style={{ color: slate }} /> },
            { label: "平均評価", value: stats.avg > 0 ? stats.avg.toFixed(1) : "-", icon: <Star size={14} style={{ color: slate }} /> },
          ].map((s) => (
            <div key={s.label} className="rounded-[4px] p-4" style={{ background: plate }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ color: muted }}>{s.icon}</span>
                <span className="text-xs font-medium uppercase" style={{ color: slate, letterSpacing: "0.04em" }}>{s.label}</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums" style={{ color: ink, letterSpacing: "-0.022em" }}>{s.value}</p>
            </div>
          ))}
        </div>
        </>
      )}

      {/* ─── Filter tabs + search ─── */}
      {stats.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-0 animate-fade-in-delay-2" style={{ borderBottom: `1px solid ${rule}` }}>
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-3 sm:px-4 py-3 text-xs sm:text-sm transition-opacity duration-150 cursor-pointer relative whitespace-nowrap"
                style={{ color: filter === tab.key ? ink : slate, fontWeight: filter === tab.key ? 600 : 400, letterSpacing: "-0.011em" }}
              >
                {tab.label}
                {filter === tab.key && <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full" style={{ background: brand }} />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pb-2 sm:pb-0 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
              <input type="text" placeholder="検索..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                style={{ background: plate, color: ink, border: ghostBorder, letterSpacing: "-0.011em" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Guide + List (same stream) ─── */}
      <div className="animate-fade-in-delay-3">
        {filter === "all" && <GuideCards />}

        {filtered.length === 0 && (search.trim() || filter !== "all") ? (
          <div className="text-center py-20"><p className="text-sm" style={{ color: muted }}>該当する口コミがありません</p></div>
        ) : filtered.length > 0 ? (
          <div>
            {filtered.map((t, i) => (
              <TestimonialRow key={t.id} testimonial={t} isLast={i === filtered.length - 1}
                onStatusChange={(status) => updateStatus(t.id, status)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <TryDataDetector workspaceId={workspace.id} />
      {showAddModal && <AddTestimonialModal workspaceId={workspace.id} onClose={() => setShowAddModal(false)} onAdded={handleTestimonialAdded} />}
      {showGoogleModal && <GoogleReviewsModal workspaceId={workspace.id} onClose={() => setShowGoogleModal(false)} onImported={handleGoogleImported} />}
    </div>
  );
}

/* ─── Guide Cards ─── */
function GuideCards() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe localStorage read on mount
    try { setHidden(JSON.parse(localStorage.getItem("voicehub_guide_hidden") || "{}")); } catch { /* noop */ }
    setMounted(true);
  }, []);
  const dismiss = (key: string) => { const next = { ...hidden, [key]: true }; setHidden(next); localStorage.setItem("voicehub_guide_hidden", JSON.stringify(next)); };

  if (!mounted) return null;
  if (hidden.welcome && hidden.widget && hidden.sns) return null;

  const items = [
    { key: "welcome", text: "ご登録ありがとうございます！まずはフォームを設定して、お客様にLINEやメールでURLを送りましょう。回答がここに届きます。", link: "/dashboard/forms", cta: "フォームを設定する →" },
    { key: "widget", text: "お客様の声をホームページに表示して、信頼度をアップさせましょう。ウィジェットから簡単に埋め込めます。", link: "/dashboard/widgets", cta: "ウィジェット設定へ →" },
    { key: "sns", text: "口コミからInstagramやSNS用の画像を自動生成できます。お客様の声を投稿してフォロワーに信頼を伝えましょう。", link: "/dashboard/sns", cta: "SNS画像を作成する →" },
  ];

  return (
    <div>
      {items.filter((g) => !hidden[g.key]).map((g) => (
        <div key={g.key} className="py-5" style={{ borderBottom: `1px solid ${rule}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: gradient }}>V</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: ink }}>VoiceHubチーム</span>
                  <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded-full" style={{ color: brand, background: `${brand}10`, letterSpacing: "0.04em" }}>ご案内</span>
                </div>
                <p className="text-sm leading-[1.6]" style={{ color: slate }}>{g.text}</p>
                <Link href={g.link} className="inline-block mt-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70" style={{ color: brandD }}>{g.cta}</Link>
              </div>
            </div>
            <button onClick={() => dismiss(g.key)} className="transition-opacity duration-150 hover:opacity-50 cursor-pointer mt-1" style={{ color: muted }}>
              <XCircle size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Testimonial Row ─── */
function TestimonialRow({ testimonial: t, isLast, onStatusChange }: {
  testimonial: TestimonialWithTags; isLast: boolean; onStatusChange: (status: "approved" | "rejected" | "pending") => void;
}) {
  const initials = (t.name || "お客様").charAt(0).toUpperCase();
  return (
    <div className="group py-5" style={{ borderBottom: isLast ? "none" : `1px solid ${rule}` }}>
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5" style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brandD} 100%)` }}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/${t.id}`} className="text-sm font-semibold transition-opacity duration-150 hover:opacity-70" style={{ color: brand, letterSpacing: "-0.011em" }}>{t.name || "お客様"}</Link>
                {(t.title || t.company) && <span className="hidden sm:inline text-xs" style={{ color: muted }}>{[t.title, t.company].filter(Boolean).join(" / ")}</span>}
              </div>
              {t.rating != null && (
                <span className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill={i < t.rating! ? "#F5A623" : "none"} style={{ color: i < t.rating! ? "#F5A623" : rule }} />
                  ))}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium uppercase" style={{ color: muted, letterSpacing: "0.04em" }}>{formatDate(t.submitted_at)}</span>
              <StatusPill status={t.status} onSelect={onStatusChange} />
            </div>
          </div>
          <p className="text-sm leading-[1.6] mt-1.5 line-clamp-3" style={{ color: slate, letterSpacing: "-0.011em" }}>{t.content}</p>
          {t.tags.length > 0 && <div className="flex gap-1.5 mt-2.5">{t.tags.map((tag) => <span key={tag} className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: canvas, color: slate }}>{tag}</span>)}</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Status Pill (Notion-style) ─── */
const statusConfig: Record<string, { label: string; bg: string; text: string; strike?: boolean }> = {
  approved: { label: "承認済み", bg: "rgba(99,91,255,0.08)", text: brand },
  pending:  { label: "未承認",   bg: plate, text: slate },
  rejected: { label: "非承認",   bg: "transparent", text: muted, strike: true },
};

function StatusPill({ status, onSelect }: { status: string; onSelect: (s: "approved" | "rejected" | "pending") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full cursor-pointer transition-opacity hover:opacity-70"
        style={{
          background: status === "approved" ? "rgba(99,91,255,0.08)" : status === "rejected" ? plate : "transparent",
          color: status === "approved" ? brand : muted,
        }}
      >
        {status === "approved" && <Check size={15} strokeWidth={2.5} />}
        {status === "rejected" && <X size={15} strokeWidth={2} />}
        {status === "pending" && <span className="w-[6px] h-[6px] rounded-full" style={{ background: muted }} />}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-40 sm:w-48 rounded-lg py-1.5 shadow-lg" style={{ background: white, border: `1px solid ${rule}` }}>
          {(["approved", "rejected", "pending"] as const).map((key) => {
            const o = statusConfig[key];
            return (
              <button
                key={key}
                onClick={() => { onSelect(key); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base cursor-pointer transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = canvas; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-medium" style={{ background: o.bg, color: o.text }}>
                  {o.label}
                </span>
                {status === key && <Check size={14} className="ml-auto" style={{ color: brand }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

