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
  Search,
  Bookmark,
  MessageSquare,
  ImageIcon,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, TestimonialWithTags } from "@/types/database";
import { getBaseUrl, formatDate } from "@/lib/utils";
import AddTestimonialModal from "./add-testimonial-modal";
import SnsImageModal from "./sns-image-modal";

type FilterTab = "all" | "pending" | "approved" | "rejected";

type FormInfo = { id: string; slug: string; title: string };

export default function DashboardClient({
  workspace,
  testimonials: initialTestimonials,
  forms,
  hasApprovedTestimonials,
  widgetCount,
  brandColor,
}: {
  workspace: WorkspaceRow;
  testimonials: TestimonialWithTags[];
  forms: FormInfo[];
  hasApprovedTestimonials: boolean;
  widgetCount: number;
  brandColor: string;
}) {
  const supabase = createClient();
  const [testimonials, setTestimonials] =
    useState<TestimonialWithTags[]>(initialTestimonials);
  const hasReal = useMemo(() => testimonials.some((t) => t.source !== "sample" && t.source !== "guide"), [testimonials]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [showFormMenu, setShowFormMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [snsImageTarget, setSnsImageTarget] = useState<TestimonialWithTags | null>(null);

  const filtered = useMemo(() => {
    let list = testimonials;
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
  }, [testimonials, filter, search]);

  const stats = useMemo(() => {
    const real = testimonials.filter((t) => t.source !== "guide" && t.source !== "sample");
    const total = real.length;
    const approved = real.filter((t) => t.status === "approved").length;
    const pending = real.filter((t) => t.status === "pending").length;
    const rated = real.filter((t) => t.rating != null);
    const avg =
      rated.length > 0
        ? rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length
        : 0;
    return { total, approved, pending, avg };
  }, [testimonials]);

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
    const url = `${getBaseUrl()}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setShowFormMenu(false);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  function handleTestimonialAdded(t: TestimonialWithTags) {
    setTestimonials((prev) => [t, ...prev]);
    setShowAddModal(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">{hasReal ? "お客様の声" : "ご登録ありがとうございます"}</h2>
          {!hasReal && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 inline-flex items-center gap-1.5">
              <Crown size={12} />
              初期サポーター
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {forms.length > 0 && hasReal && (
            <div className="relative">
              <button
                onClick={() => forms.length === 1 ? copyFormUrl(forms[0].slug) : setShowFormMenu(!showFormMenu)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <Plus size={16} />
            手動で追加
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={<MessageSquare size={18} className="text-slate-400" />} label="合計" value={stats.total} />
        <StatCard icon={<CheckCircle size={18} className="text-emerald-600" />} label="承認済み" value={stats.approved} />
        <StatCard icon={<Clock size={18} className="text-amber-500" />} label="未承認" value={stats.pending} />
        <StatCard
          icon={<Star size={18} className="text-yellow-500" />}
          label="平均評価"
          value={stats.avg > 0 ? stats.avg.toFixed(1) : "-"}
        />
      </div>}

      {/* Filter tabs + search */}
      {stats.total > 0 && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex gap-1 bg-white rounded-lg border border-foreground/10 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                filter === tab.key
                  ? "bg-indigo-600 text-white"
                  : "text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-foreground/10 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>}

      {/* Testimonial list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-foreground/50">
          お客様の声がまだありません
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <TestimonialCard
              key={t.id}
              testimonial={t}
              onApprove={() => updateStatus(t.id, "approved")}
              onReject={() => updateStatus(t.id, "rejected")}
              onToggleFeatured={() =>
                toggleFeatured(t.id, t.is_featured)
              }
              onCreateSnsImage={() => setSnsImageTarget(t)}
              onDeleteGuide={async (id) => {
                await supabase.from("testimonials").delete().eq("id", id);
                setTestimonials((prev) => prev.filter((item) => item.id !== id));
              }}
              formSlug={forms.length > 0 ? forms[0].slug : undefined}
              onCopyUrl={forms.length > 0 ? async () => {
                copyFormUrl(forms[0].slug);
                // Insert next guide message if not already exists
                const { data: existing } = await supabase
                  .from("testimonials")
                  .select("id")
                  .eq("workspace_id", workspace.id)
                  .eq("source", "guide")
                  .neq("id", t.id)
                  .limit(1);
                if (!existing || existing.length === 0) {
                  const { data: newGuide } = await supabase
                    .from("testimonials")
                    .insert({
                      workspace_id: workspace.id,
                      form_id: forms[0].id,
                      rating: 5,
                      content: "お客様の回答が届いたら「承認」ボタンを押してください。ホームページへの埋め込みは[[ウィジェット管理]]から設定できます。以上でガイドを終了します。",
                      name: "VoiceHub ガイド",
                      title: "ご案内",
                      status: "approved",
                      is_featured: false,
                      permission_granted: true,
                      source: "guide",
                    })
                    .select()
                    .single();
                  if (newGuide) {
                    setTestimonials((prev) => [{ ...newGuide, tags: [] }, ...prev]);
                  }
                }
              } : undefined}
              urlCopied={copiedUrl}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddTestimonialModal
          workspaceId={workspace.id}
          onClose={() => setShowAddModal(false)}
          onAdded={handleTestimonialAdded}
        />
      )}

      {/* SNS Image modal */}
      {snsImageTarget && (
        <SnsImageModal
          testimonial={snsImageTarget}
          brandColor={brandColor}
          onClose={() => setSnsImageTarget(null)}
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
    <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-foreground/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string }> = {
    pending: { dot: "bg-amber-400", label: "未承認" },
    approved: { dot: "bg-emerald-500", label: "承認済み" },
    rejected: { dot: "bg-red-400", label: "非承認" },
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
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-foreground/20"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial: t,
  onApprove,
  onReject,
  onToggleFeatured,
  onCreateSnsImage,
  formSlug,
  onCopyUrl,
  urlCopied,
  onDeleteGuide,
}: {
  testimonial: TestimonialWithTags;
  onApprove: () => void;
  onReject: () => void;
  onToggleFeatured: () => void;
  onCreateSnsImage: () => void;
  formSlug?: string;
  onCopyUrl?: () => void;
  urlCopied?: boolean;
  onDeleteGuide?: (id: string) => void;
}) {
  if (t.source === "guide") {
    return (
      <div className="bg-white rounded-lg border border-indigo-100 shadow-sm p-5 relative">
        {onDeleteGuide && (
          <button
            onClick={() => onDeleteGuide(t.id)}
            className="absolute top-4 right-4 text-foreground/20 hover:text-foreground/50 cursor-pointer"
          >
            <XCircle size={16} />
          </button>
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-foreground">{t.name}</span>
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">ご案内</span>
        </div>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {t.content.includes("[[") ? (
            <>
              {t.content.split("[[").map((part, i) => {
                if (i === 0) return part;
                const [linkText, rest] = part.split("]]");
                return (
                  <span key={i}>
                    <Link href="/dashboard/widgets" className="text-indigo-600 hover:underline">{linkText}</Link>
                    {rest}
                  </span>
                );
              })}
            </>
          ) : t.content}
        </p>
        {formSlug && onCopyUrl && t.content.includes("URLをコピー") && (
          <div className="flex items-center gap-2 bg-foreground/5 rounded-lg p-2.5 mt-4">
            <code className="flex-1 text-xs text-foreground/60 truncate">
              {getBaseUrl()}/form/{formSlug}
            </code>
            <button
              onClick={onCopyUrl}
              className="shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
            >
              {urlCopied ? "✓ コピー済み" : "URLをコピー"}
            </button>
          </div>
        )}
        <p className="text-xs text-foreground/30 mt-3 italic">VoiceHubからのご案内です</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/dashboard/${t.id}`}
              className="font-medium text-foreground hover:text-indigo-600"
            >
              {t.name}
            </Link>
            <StatusBadge status={t.status} />
          </div>
          <Stars rating={t.rating} />
          <p className="text-sm text-foreground/60 mt-2 line-clamp-2">
            {t.content}
          </p>
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
          <p className="text-xs text-foreground/30 mt-2">
            {formatDate(t.submitted_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
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
            <Bookmark size={16} className={t.is_featured ? "fill-violet-500" : ""} />
          </button>
          <button
            onClick={onCreateSnsImage}
            className="p-1.5 rounded text-foreground/40 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            title="SNS画像を作成"
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
