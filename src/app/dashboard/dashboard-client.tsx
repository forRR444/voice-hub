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
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, TestimonialWithTags } from "@/types/database";
import { getBaseUrl, formatDate } from "@/lib/utils";
import AddTestimonialModal from "./add-testimonial-modal";

type FilterTab = "all" | "pending" | "approved" | "rejected";

export default function DashboardClient({
  workspace,
  testimonials: initialTestimonials,
  formSlug,
}: {
  workspace: WorkspaceRow;
  testimonials: TestimonialWithTags[];
  formSlug: string | null;
}) {
  const supabase = createClient();
  const [testimonials, setTestimonials] =
    useState<TestimonialWithTags[]>(initialTestimonials);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

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
    const total = testimonials.length;
    const approved = testimonials.filter((t) => t.status === "approved").length;
    const pending = testimonials.filter((t) => t.status === "pending").length;
    const rated = testimonials.filter((t) => t.rating != null);
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
    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("testimonials")
      .update({ is_featured: !current })
      .eq("id", id);
    if (!error) {
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_featured: !current } : t
        )
      );
    }
  }

  function copyFormUrl() {
    if (!formSlug) return;
    const url = `${getBaseUrl()}/form/${formSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">お客様の声</h2>
        <div className="flex gap-2">
          {formSlug && (
            <button
              onClick={copyFormUrl}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-foreground/10 rounded-lg bg-background hover:bg-foreground/5 cursor-pointer"
            >
              <Copy size={16} />
              {copiedUrl ? "コピーしました" : "フォームURLをコピー"}
            </button>
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
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BarChart3 size={20} className="text-indigo-500" />}
          label="合計"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-500" />}
          label="承認済み"
          value={stats.approved}
        />
        <StatCard
          icon={<Clock size={20} className="text-yellow-500" />}
          label="未承認"
          value={stats.pending}
        />
        <StatCard
          icon={<Star size={20} className="text-amber-500" />}
          label="平均評価"
          value={stats.avg > 0 ? stats.avg.toFixed(1) : "-"}
        />
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-background rounded-lg border border-foreground/10 p-1">
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
            className="pl-9 pr-4 py-2 text-sm border border-foreground/10 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

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
    <div className="bg-background rounded-xl border border-foreground/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-foreground/50">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "未承認" },
    approved: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "承認済み",
    },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "非承認" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${c.bg} ${c.text}`}
    >
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
}: {
  testimonial: TestimonialWithTags;
  onApprove: () => void;
  onReject: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <div className="bg-background rounded-xl border border-foreground/10 p-5">
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
            {t.is_featured && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                注目
              </span>
            )}
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

        <div className="flex items-center gap-1 ml-4 shrink-0">
          {t.status !== "approved" && (
            <button
              onClick={onApprove}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
              title="承認"
            >
              <CheckCircle size={18} />
            </button>
          )}
          {t.status !== "rejected" && (
            <button
              onClick={onReject}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
              title="非承認"
            >
              <XCircle size={18} />
            </button>
          )}
          <button
            onClick={onToggleFeatured}
            className={`p-2 rounded-lg cursor-pointer ${
              t.is_featured
                ? "text-amber-500 hover:bg-amber-50"
                : "text-foreground/30 hover:bg-foreground/5"
            }`}
            title={t.is_featured ? "注目を解除" : "注目に設定"}
          >
            <Bookmark size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
