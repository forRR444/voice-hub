"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Plus,
  MagnifyingGlass,
  BookmarkSimple,
  ChatTeardrop,
  CaretDown,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, TestimonialWithTags, FormQuestion } from "@/types/database";
import TryDataDetector from "./try-data-detector";
import { getBaseUrl, formatDate } from "@/lib/utils";
import AddTestimonialModal from "./add-testimonial-modal";
import GoogleReviewsModal from "./google-reviews-modal";
import { useCopy } from "@/hooks/use-copy";

type FilterTab = "all" | "pending" | "approved" | "rejected";

type FormInfo = { id: string; slug: string; title: string; brand_color: string; questions: FormQuestion[] };

export default function DashboardClient({
  workspace,
  testimonials: initialTestimonials,
  forms,
  brandColor,
}: {
  workspace: WorkspaceRow;
  testimonials: TestimonialWithTags[];
  forms: FormInfo[];
  brandColor: string;
}) {
  const supabase = createClient();
  const [testimonials, setTestimonials] =
    useState<TestimonialWithTags[]>(initialTestimonials);
  const real = useMemo(() => testimonials.filter((t) => t.source !== "sample" && t.source !== "guide"), [testimonials]);
  const hasReal = real.length > 0;
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [showFormMenu, setShowFormMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { copiedKey: copiedUrl, copy } = useCopy();
  const filtered = useMemo(() => {
    let list = real;
    if (filter !== "all") {
      list = list.filter((t) => t.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [real, filter, search]);

  const stats = useMemo(() => {
    const total = real.length;
    const approved = real.filter((t) => t.status === "approved").length;
    const pending = real.filter((t) => t.status === "pending").length;
    const rated = real.filter((t) => t.rating != null);
    const avg =
      rated.length > 0
        ? rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length
        : 0;
    return { total, approved, pending, avg };
  }, [real]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("testimonials")
      .update({ status })
      .eq("id", id);
    if (error) {
      window.alert("ステータスの更新に失敗しました");
      return;
    }
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("testimonials")
      .update({ is_featured: !current })
      .eq("id", id);
    if (error) {
      window.alert("おすすめ設定の更新に失敗しました");
      return;
    }
    setTestimonials((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_featured: !current } : t
      )
    );
  }

  function copyFormUrl(slug: string) {
    copy(`${getBaseUrl()}/form/${slug}`);
    setShowFormMenu(false);
  }

  function handleTestimonialAdded(t: TestimonialWithTags) {
    setTestimonials((prev) => [t, ...prev]);
    setShowAddModal(false);
  }

  function handleGoogleImported(imported: TestimonialWithTags[]) {
    setTestimonials((prev) => [...imported, ...prev]);
    setShowGoogleModal(false);
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "全て" },
    { key: "pending", label: "未承認" },
    { key: "approved", label: "承認済み" },
    { key: "rejected", label: "非承認" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">ホーム</h2>
        </div>
        <div className="flex gap-2 justify-end">
          {forms.length > 0 && hasReal && (
            <div className="relative">
              <button
                onClick={() => forms.length === 1 ? copyFormUrl(forms[0].slug) : setShowFormMenu(!showFormMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
              >
                <Copy size={16} />
                {copiedUrl ? "コピーしました" : "フォームURLをコピー"}
              </button>
              {showFormMenu && forms.length > 1 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFormMenu(false)}
                  />
                  <div className="absolute right-0 top-11 z-20 w-56 bg-white rounded-lg border border-foreground/10 shadow-lg py-1">
                    {forms.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => copyFormUrl(f.slug)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 cursor-pointer"
                      >
                        <Copy size={14} />
                        {f.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => setShowGoogleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-foreground/10 bg-white rounded-lg hover:bg-foreground/5 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google口コミを取り込む
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <Plus size={16} />
            手動で追加
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={<ChatTeardrop size={18} className="text-slate-400" />} label="合計" value={stats.total} />
        <StatCard icon={<CheckCircle size={18} className="text-emerald-600" />} label="承認済み" value={stats.approved} />
        <StatCard icon={<Clock size={18} className="text-amber-500" />} label="未承認" value={stats.pending} />
        <StatCard
          icon={<Star size={18} className="text-yellow-500" />}
          label="平均評価"
          value={stats.avg > 0 ? stats.avg.toFixed(1) : "-"}
        />
      </div>}

      {/* Filter tabs + search */}
      {stats.total > 0 && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        {/* Mobile: search + dropdown in one row */}
        <div className="flex gap-2 items-center sm:hidden">
          <div className="relative flex-1">
            <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-foreground/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-foreground/10 rounded-lg bg-white cursor-pointer"
            >
              {tabs.find((t) => t.key === filter)?.label}
              <CaretDown size={12} className={`text-foreground/40 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-32 bg-white rounded-lg border border-foreground/10 shadow-lg py-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => { setFilter(tab.key); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs cursor-pointer ${
                        filter === tab.key
                          ? "text-indigo-600 font-medium bg-indigo-50"
                          : "text-foreground/60 hover:bg-foreground/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {/* Desktop: tabs */}
        <div className="hidden sm:flex gap-1 bg-foreground/[0.03] rounded-lg border border-foreground/10 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                filter === tab.key
                  ? "bg-white text-foreground font-medium shadow-sm"
                  : "text-foreground/50 hover:text-foreground/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative hidden sm:block">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-foreground/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>}

      {/* Guide + Testimonial list */}
      <div className="flex flex-col gap-3">
        <GuideCards />

        {filtered.length === 0 && (search.trim() || filter !== "all") ? (
          <div className="text-center py-16 text-foreground/50">
            該当する口コミがありません
          </div>
        ) : filtered.length > 0 ? (
          <>
            {filtered.map((t) => (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                onApprove={() => updateStatus(t.id, "approved")}
                onReject={() => updateStatus(t.id, "rejected")}
                onToggleFeatured={() => toggleFeatured(t.id, t.is_featured)}
              />
            ))}
          </>
        ) : null}
      </div>

      {/* Try data: Google口コミをサイレントインポート */}
      <TryDataDetector workspaceId={workspace.id} />

      {/* Add modal */}
      {showAddModal && (
        <AddTestimonialModal
          workspaceId={workspace.id}
          onClose={() => setShowAddModal(false)}
          onAdded={handleTestimonialAdded}
        />
      )}

      {/* Google Reviews modal */}
      {showGoogleModal && (
        <GoogleReviewsModal
          workspaceId={workspace.id}
          onClose={() => setShowGoogleModal(false)}
          onImported={handleGoogleImported}
        />
      )}

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-2.5 sm:p-4">
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <span className="hidden sm:block">{icon}</span>
        <span className="text-[10px] sm:text-xs text-foreground/40 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl sm:text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string }> = {
    pending: { dot: "bg-amber-400", label: "未承認" },
    approved: { dot: "bg-emerald-500", label: "承認済み" },
    rejected: { dot: "bg-red-400", label: "非承認" },
    guide: { dot: "bg-indigo-400", label: "ご案内" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/50">
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          weight={i < rating ? "fill" : "regular"}
          className={
            i < rating
              ? "text-amber-400"
              : "text-foreground/20"
          }
        />
      ))}
    </div>
  );
}

function GuideCards() {
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("voicehub_guide_hidden") || "{}"); } catch { return {}; }
  });

  const dismiss = (key: string) => {
    const next = { ...hidden, [key]: true };
    setHidden(next);
    localStorage.setItem("voicehub_guide_hidden", JSON.stringify(next));
  };

  if (hidden.welcome && hidden.widget) return null;

  return (
    <div className="flex flex-col gap-3">
      {!hidden.welcome && (
        <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-4 sm:p-5 relative">
          <button
            onClick={() => dismiss("welcome")}
            className="absolute top-4 right-4 text-foreground/60 hover:text-red-500 cursor-pointer transition-colors"
          >
            <XCircle size={16} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
            <span className="text-sm sm:text-base font-semibold text-foreground">VoiceHubチーム</span>
            <StatusBadge status="guide" />
          </div>
          <p className="text-xs sm:text-sm text-foreground/50 mt-2 leading-relaxed">
            ご登録ありがとうございます！まずはフォームを設定して、お客様にLINEやメールでURLを送りましょう。回答がここに届きます。
          </p>
          <Link href="/dashboard/forms" className="inline-block mt-1.5 text-xs text-indigo-500 hover:text-indigo-700">
            フォームを設定する →
          </Link>
        </div>
      )}
      {!hidden.widget && (
        <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-4 sm:p-5 relative">
          <button
            onClick={() => dismiss("widget")}
            className="absolute top-4 right-4 text-foreground/60 hover:text-red-500 cursor-pointer transition-colors"
          >
            <XCircle size={16} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
            <span className="text-sm sm:text-base font-semibold text-foreground">VoiceHubチーム</span>
            <StatusBadge status="guide" />
          </div>
          <p className="text-xs sm:text-sm text-foreground/50 mt-2 leading-relaxed">
            お客様の声をホームページやSNSに表示して、信頼度をアップさせましょう。ウィジェットから簡単に埋め込めます。
          </p>
          <Link href="/dashboard/widgets" className="inline-block mt-1.5 text-xs text-indigo-500 hover:text-indigo-700">
            ウィジェット設定へ →
          </Link>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({
  testimonial: t,
  onApprove,
  onReject,
  onToggleFeatured,
}: {
  testimonial: TestimonialWithTags;
  onApprove: () => void;
  onReject: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-4 sm:p-5 hover:border-foreground/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
            <Link
              href={`/dashboard/${t.id}`}
              className="text-sm sm:text-base font-semibold text-foreground hover:text-indigo-600"
            >
              {t.name || "お客様"}
            </Link>
            <StatusBadge status={t.status} />
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <Stars rating={t.rating} />
            <span className="text-[10px] text-foreground/25">{formatDate(t.submitted_at)}</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/50 mt-2 line-clamp-2 leading-relaxed">
            {t.content}
          </p>
          {([t.before_story, t.title, t.company].some(Boolean) || (t.custom_fields && Object.keys(t.custom_fields).length > 0)) && (
            <Link
              href={`/dashboard/${t.id}`}
              className="inline-block mt-1.5 text-[10px] sm:text-xs text-indigo-500 hover:text-indigo-700"
            >
              詳細を見る →
            </Link>
          )}
          {t.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {t.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-foreground/5 text-foreground/60 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: inline buttons */}
        <div className="hidden sm:flex items-center gap-2 ml-4 shrink-0">
          <button
            onClick={onApprove}
            disabled={t.status === "approved"}
            className={`p-2 rounded ${
              t.status === "approved"
                ? "text-foreground/15 cursor-default"
                : "text-foreground/60 hover:text-emerald-600 cursor-pointer"
            }`}
            title="承認"
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={onReject}
            disabled={t.status === "rejected"}
            className={`p-2 rounded ${
              t.status === "rejected"
                ? "text-foreground/15 cursor-default"
                : "text-foreground/60 hover:text-red-500 cursor-pointer"
            }`}
            title="却下"
          >
            <XCircle size={18} />
          </button>
          <button
            onClick={onToggleFeatured}
            className={`p-1.5 rounded cursor-pointer ${
              t.is_featured
                ? "text-violet-500 hover:bg-violet-50"
                : "text-foreground/60 hover:text-foreground/80 hover:bg-foreground/5"
            }`}
            title={t.is_featured ? "注目を解除" : "注目に設定"}
          >
            <BookmarkSimple size={16} weight={t.is_featured ? "fill" : "regular"} className={t.is_featured ? "text-violet-500" : ""} />
          </button>
        </div>
        {/* Mobile: overflow menu */}
        <CardOverflowMenu
          status={t.status}
          isFeatured={t.is_featured}
          onApprove={onApprove}
          onReject={onReject}
          onToggleFeatured={onToggleFeatured}
        />
      </div>
    </div>
  );
}

function CardOverflowMenu({
  status,
  isFeatured,
  onApprove,
  onReject,
  onToggleFeatured,
}: {
  status: string;
  isFeatured: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleFeatured: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative sm:hidden ml-2 shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded text-foreground/40 hover:text-foreground/60 cursor-pointer"
      >
        <DotsThreeVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-lg border border-foreground/10 shadow-lg py-1">
            {status !== "approved" && (
              <button
                onClick={() => { onApprove(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-emerald-600 hover:bg-foreground/5 cursor-pointer"
              >
                <CheckCircle size={14} />
                承認
              </button>
            )}
            {status !== "rejected" && (
              <button
                onClick={() => { onReject(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-foreground/5 cursor-pointer"
              >
                <XCircle size={14} />
                却下
              </button>
            )}
            <button
              onClick={() => { onToggleFeatured(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground/60 hover:bg-foreground/5 cursor-pointer"
            >
              <BookmarkSimple size={14} weight={isFeatured ? "fill" : "regular"} className={isFeatured ? "text-violet-500" : ""} />
              {isFeatured ? "注目を解除" : "注目に設定"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
