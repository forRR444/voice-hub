"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Plus, Trash2, Upload, Eye, Sparkles, FileText, ClipboardList, MapPin, Clock, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image-utils";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { useCopy } from "@/hooks/use-copy";
import { SALON_THEMES, type SalonThemeConfig } from "@/lib/salon-themes";
import {
  SALON_TAGLINE_MAX_LENGTH, SALON_MAX_LINKS, IMAGE_RESIZE_MAX_PX,
  SALON_DESCRIPTION_MAX_LENGTH, SALON_ADDRESS_MAX_LENGTH, SALON_CLOSED_DAYS_MAX_LENGTH,
  SALON_MENU_MAX_ITEMS, SALON_MENU_NAME_MAX_LENGTH, SALON_MENU_PRICE_MAX_LENGTH,
  SALON_MENU_DESCRIPTION_MAX_LENGTH, SALON_BUSINESS_HOURS_TEXT_MAX_LENGTH,
} from "@/lib/constants";
import type { WorkspaceRow, SalonPageRow, SalonPageLinkRow, SalonTheme, SalonPageLinkIcon, SalonReviewLayout, SalonMenuItem } from "@/types/database";
import { List, LayoutGrid, Square, Columns3 } from "lucide-react";
import { SALON_LINK_ICONS, SalonLinkIcon } from "@/lib/salon-link-icons";
import PageTitle from "@/app/components/page-title";
import { ink, slate, muted, brand, brandD, plate, canvas, white, rule, gradient } from "@/lib/theme-tokens";

const ghostBorder = "1px solid rgba(227,232,238,0.5)";
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  color: ink,
  background: white,
  border: ghostBorder,
  borderRadius: 8,
  outline: "none",
  letterSpacing: "-0.011em",
  transition: "border-color 0.15s",
};

type LinkEntry = { label: string; url: string; icon: SalonPageLinkIcon };

const urlPlaceholders: Record<string, string> = {
  line: "https://lin.ee/xxxxx（公式LINEのURL）",
  instagram: "https://instagram.com/yourname",
  phone: "tel:09012345678（電話番号）",
  mail: "mailto:info@example.com（メールアドレス）",
  map: "https://maps.google.com/...（Googleマップ）",
  web: "https://example.com（WebサイトのURL）",
};

export default function SalonPageSettingsClient({
  workspace,
  initialSalonPage,
  initialLinks,
}: {
  workspace: WorkspaceRow;
  initialSalonPage: SalonPageRow | null;
  initialLinks: SalonPageLinkRow[];
}) {
  const supabase = createClient();
  const { copiedKey, copy } = useCopy();

  const [step, setStep] = useState(1);
  const [salonName, setSalonName] = useState(initialSalonPage?.salon_name ?? workspace.name);
  const [tagline, setTagline] = useState(initialSalonPage?.tagline ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialSalonPage?.logo_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSalonPage?.logo_url ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialSalonPage?.cover_image_url ?? null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialSalonPage?.cover_image_url ?? null);
  const [coverPosition, setCoverPosition] = useState(initialSalonPage?.cover_image_position ?? 50);
  const [theme, setTheme] = useState<SalonTheme>(initialSalonPage?.theme ?? "natural");
  const [accentColor, setAccentColor] = useState(
    initialSalonPage?.accent_color ?? SALON_THEMES.natural.defaultAccent
  );
  const [reviewLayout, setReviewLayout] = useState<SalonReviewLayout>(
    initialSalonPage?.review_layout ?? "card"
  );
  const [links, setLinks] = useState<LinkEntry[]>(
    initialLinks.map((l) => ({ label: l.label, url: l.url, icon: (l.icon && l.icon !== "none" ? l.icon : "web") as SalonPageLinkIcon }))
  );
  const [isPublished, setIsPublished] = useState(initialSalonPage?.is_published ?? false);

  // HP充実フィールド
  const [description, setDescription] = useState(initialSalonPage?.description ?? "");
  const [address, setAddress] = useState(initialSalonPage?.address ?? "");
  const [googleMapUrl, setGoogleMapUrl] = useState(initialSalonPage?.google_map_url ?? "");
  const [businessHoursText, setBusinessHoursText] = useState(initialSalonPage?.business_hours?.text ?? "");
  const [closedDays, setClosedDays] = useState(initialSalonPage?.closed_days ?? "");
  const [menuItems, setMenuItems] = useState<SalonMenuItem[]>(
    initialSalonPage?.menu_items ?? []
  );
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [detailView, setDetailView] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = initialSalonPage?.slug ?? null;
  const salonBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voicehub.jp";
  const pageUrl = slug ? `${salonBaseUrl}/salon/${slug}` : null;
  const themeConfig = SALON_THEMES[theme];

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleThemeChange(newTheme: SalonTheme) {
    setTheme(newTheme);
    setAccentColor(SALON_THEMES[newTheme].defaultAccent);
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addMenuItem() {
    if (menuItems.length >= SALON_MENU_MAX_ITEMS) return;
    setMenuItems([...menuItems, { name: "", price: "", description: "" }]);
  }

  function updateMenuItem(index: number, field: keyof SalonMenuItem, value: string) {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  }

  function removeMenuItem(index: number) {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  }

  function addLink() {
    if (links.length >= SALON_MAX_LINKS) return;
    setLinks([...links, { label: "", url: "", icon: "web" }]);
  }

  function updateLink(index: number, field: keyof LinkEntry, value: string) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!salonName.trim()) {
      setError("サロン名を入力してください");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      let uploadedLogoUrl = logoUrl;
      let uploadedCoverUrl = coverImageUrl;

      if (logoFile) {
        const resized = await resizeImage(logoFile, IMAGE_RESIZE_MAX_PX);
        const path = `salon/${workspace.id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, resized, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`ロゴのアップロードに失敗しました: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedLogoUrl = urlData.publicUrl;
      }

      if (coverFile) {
        const resized = await resizeImage(coverFile, 1920);
        const path = `salon/${workspace.id}/cover_${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, resized, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`カバー画像のアップロードに失敗しました: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        uploadedCoverUrl = urlData.publicUrl;
      }

      const newSlug = slug ?? generateSlug(10);

      const { data: upserted, error: upsertError } = await supabase
        .from("salon_pages")
        .upsert(
          {
            workspace_id: workspace.id,
            salon_name: salonName.trim(),
            tagline: tagline.trim() || null,
            logo_url: uploadedLogoUrl,
            theme,
            accent_color: accentColor,
            cover_image_url: uploadedCoverUrl,
            cover_image_position: coverPosition,
            review_layout: reviewLayout,
            is_published: isPublished,
            slug: newSlug,
            description: description.trim() || null,
            address: address.trim() || null,
            google_map_url: googleMapUrl.trim() || null,
            business_hours: businessHoursText.trim() ? { text: businessHoursText.trim() } : null,
            closed_days: closedDays.trim() || null,
            menu_items: menuItems.filter((m) => m.name.trim()).length > 0
              ? menuItems.filter((m) => m.name.trim()).map((m) => ({
                  name: m.name.trim(),
                  price: m.price.trim(),
                  description: m.description.trim(),
                }))
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id" }
        )
        .select("id, slug")
        .single();

      if (upsertError) throw new Error(upsertError.message);

      const salonPageId = upserted.id;

      await supabase
        .from("salon_page_links")
        .delete()
        .eq("salon_page_id", salonPageId);

      const validLinks = links.filter((l) => l.url.trim());
      if (validLinks.length > 0) {
        const iconLabelMap: Record<string, string> = {
          line: "LINE", instagram: "Instagram",
          phone: "電話", mail: "メール", map: "地図", web: "Webサイト",
        };
        const { error: linkError } = await supabase
          .from("salon_page_links")
          .insert(
            validLinks.map((l, i) => ({
              salon_page_id: salonPageId,
              label: l.label.trim() || iconLabelMap[l.icon] || "リンク",
              url: l.url.trim(),
              icon: l.icon,
              display_order: i,
            }))
          );
        if (linkError) throw new Error(linkError.message);
      }

      setLogoUrl(uploadedLogoUrl);
      setLogoFile(null);
      setCoverImageUrl(uploadedCoverUrl);
      setCoverFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      if (!slug) {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const filledCount = [
    description.trim(),
    menuItems.filter((m) => m.name.trim()).length > 0,
    address.trim(),
    businessHoursText.trim() || closedDays.trim(),
  ].filter(Boolean).length;

  const steps = [
    { n: 1, label: "サロン情報" },
    { n: 2, label: "デザイン" },
    { n: 3, label: "予約導線" },
    { n: 4, label: "公開設定" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* ─── Header ─── */}
      <div className="mb-8 sm:mb-10 animate-fade-in">
        <PageTitle>サロンページ</PageTitle>
        <p className="text-sm mt-1" style={{ color: slate, letterSpacing: "-0.011em" }}>
          お客様の声付きのサロン紹介ページを作成できます
        </p>
      </div>

      {/* ─── Step Indicator ─── */}
      <div className="flex mb-8 animate-fade-in-delay-1" style={{ borderBottom: `1px solid ${rule}` }}>
        {steps.map(({ n, label }) => (
          <button
            key={n}
            onClick={() => setStep(n)}
            className="flex-1 pb-3 text-center cursor-pointer relative transition-opacity duration-150 hover:opacity-80"
          >
            <span
              className="block text-[10px] font-medium uppercase mb-0.5"
              style={{ color: step === n ? brand : muted, letterSpacing: "0.04em" }}
            >
              STEP {n}
            </span>
            <span
              className="text-xs font-medium"
              style={{
                color: step === n ? ink : slate,
                letterSpacing: "-0.011em",
              }}
            >
              {label}
            </span>
            {step === n && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: brand }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── Step 1: サロン情報 ─── */}
      {step === 1 && (
        <div className="animate-fade-in-delay-2">
          <div className="rounded-lg p-6 sm:p-8" style={{ background: white }}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold" style={{ color: ink }}>
                {detailView ? "サロン詳細情報" : "基本情報"}
              </p>
              <button
                onClick={() => setDetailView(!detailView)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-all duration-150 hover:opacity-80"
                style={{
                  background: "transparent",
                  color: slate,
                  border: `1px solid ${rule}`,
                }}
              >
                {detailView ? (
                  <>
                    <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
                    基本情報に戻る
                  </>
                ) : (
                  <>
                    <ChevronDown size={13} style={{ transform: "rotate(-90deg)" }} />
                    詳細情報
                    {filledCount > 0 && (
                      <span
                        className="ml-0.5 px-1.5 py-px rounded-full text-[10px] font-bold"
                        style={{ background: `rgba(0,0,0,0.06)`, color: slate }}
                      >
                        {filledCount}/4
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {!detailView ? (
            <div className="space-y-6">
              <FieldLabel label="サロン名" required>
                <input
                  style={inputStyle}
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="例: Nail Salon Miki"
                  maxLength={50}
                  onFocus={(e) => (e.target.style.borderColor = brand)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                />
              </FieldLabel>

              <FieldLabel label="一言紹介文">
                <div className="relative">
                  <textarea
                    style={{ ...inputStyle, resize: "none" as const }}
                    value={tagline ?? ""}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="例: 爪に優しいジェルネイル専門サロン"
                    maxLength={SALON_TAGLINE_MAX_LENGTH}
                    rows={2}
                    onFocus={(e) => (e.target.style.borderColor = brand)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                  />
                  <span
                    className="absolute bottom-2.5 right-3 text-[11px] tabular-nums"
                    style={{ color: muted }}
                  >
                    {(tagline ?? "").length}/{SALON_TAGLINE_MAX_LENGTH}
                  </span>
                </div>
              </FieldLabel>

              <FieldLabel label="ロゴ画像">
                <div className="flex items-center gap-5">
                  {logoPreview ? (
                    <img
                      src={logoPreview!}
                      alt="ロゴ"
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ border: ghostBorder }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                      style={{ background: accentColor }}
                    >
                      {(salonName || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-opacity duration-150 hover:opacity-70"
                      style={{ color: slate, background: plate }}
                    >
                      <Upload size={14} />
                      アップロード
                    </span>
                  </label>
                </div>
              </FieldLabel>

              <FieldLabel label="ヘッダー画像">
                {coverPreview ? (
                  <div>
                    {/* プレビュー + 位置調整 */}
                    <div
                      className="relative rounded-lg overflow-hidden"
                      style={{ aspectRatio: "3.2 / 1", border: ghostBorder }}
                    >
                      <img
                        src={coverPreview!}
                        alt="カバー"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `center ${coverPosition}%`,
                        }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3))" }}
                      />
                    </div>
                    {/* 位置スライダー */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[11px] whitespace-nowrap" style={{ color: muted }}>上</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={coverPosition}
                        onChange={(e) => setCoverPosition(Number(e.target.value))}
                        className="flex-1"
                        style={{ accentColor: brand }}
                      />
                      <span className="text-[11px] whitespace-nowrap" style={{ color: muted }}>下</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity duration-150 hover:opacity-70"
                          style={{ color: slate, background: plate }}
                        >
                          変更
                        </span>
                      </label>
                      <button
                        onClick={() => { setCoverPreview(null); setCoverImageUrl(null); setCoverFile(null); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity duration-150 hover:opacity-70 cursor-pointer"
                        style={{ color: muted }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                    <div
                      className="flex flex-col items-center justify-center gap-2 rounded-lg py-8 transition-opacity duration-150 hover:opacity-70"
                      style={{ background: plate }}
                    >
                      <Upload size={20} style={{ color: muted }} />
                      <span className="text-xs" style={{ color: slate }}>
                        画像をアップロード
                      </span>
                      <span className="text-[10px]" style={{ color: muted }}>
                        推奨: 1200×400px以上の横長画像
                      </span>
                    </div>
                  </label>
                )}
              </FieldLabel>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 cursor-pointer"
                  style={{ background: gradient }}
                >
                  次へ
                </button>
              </div>
            </div>
            ) : (
            <div className="space-y-3">
                  {/* サロン紹介文 */}
                  <div className="rounded-lg overflow-hidden" style={{ background: plate }}>
                    <button
                      onClick={() => toggleSection("description")}
                      className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:brightness-[0.97]"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} style={{ color: slate }} />
                        <span className="text-sm font-semibold" style={{ color: ink }}>サロン紹介文</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {description.trim() && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(99,91,255,0.1)", color: brand }}>
                            入力済み
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          style={{ color: muted, transition: "transform 0.2s", transform: openSections.has("description") ? "rotate(180deg)" : "rotate(0)" }}
                        />
                      </div>
                    </button>
                    {openSections.has("description") && (
                      <div className="px-4 pb-4">
                        <textarea
                          style={{ ...inputStyle, resize: "none" as const }}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="サロンの特徴やこだわりを自由にお書きください"
                          maxLength={SALON_DESCRIPTION_MAX_LENGTH}
                          rows={6}
                          onFocus={(e) => (e.target.style.borderColor = brand)}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                        />
                        <p className="text-xs text-right mt-1" style={{ color: description.length > SALON_DESCRIPTION_MAX_LENGTH ? "#EF4444" : muted }}>
                          {description.length} / {SALON_DESCRIPTION_MAX_LENGTH}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* メニュー・料金表 */}
                  <div className="rounded-lg overflow-hidden" style={{ background: plate }}>
                    <button
                      onClick={() => toggleSection("menu")}
                      className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:brightness-[0.97]"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList size={18} style={{ color: slate }} />
                        <span className="text-sm font-semibold" style={{ color: ink }}>メニュー・料金表</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {menuItems.filter((m) => m.name.trim()).length > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(99,91,255,0.1)", color: brand }}>
                            {menuItems.filter((m) => m.name.trim()).length}件
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          style={{ color: muted, transition: "transform 0.2s", transform: openSections.has("menu") ? "rotate(180deg)" : "rotate(0)" }}
                        />
                      </div>
                    </button>
                    {openSections.has("menu") && (
                      <div className="px-4 pb-4">
                        <div className="space-y-3">
                          {menuItems.map((item, i) => (
                            <div key={i} className="rounded-lg p-3" style={{ background: white, border: `1px solid ${rule}` }}>
                              <div className="flex items-center gap-2">
                                <input
                                  style={inputStyle}
                                  className="flex-[3]"
                                  value={item.name}
                                  onChange={(e) => updateMenuItem(i, "name", e.target.value)}
                                  placeholder="メニュー名"
                                  maxLength={SALON_MENU_NAME_MAX_LENGTH}
                                  onFocus={(e) => (e.target.style.borderColor = brand)}
                                  onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                                />
                                <input
                                  style={inputStyle}
                                  className="flex-[1]"
                                  value={item.price}
                                  onChange={(e) => updateMenuItem(i, "price", e.target.value)}
                                  placeholder="¥0,000"
                                  maxLength={SALON_MENU_PRICE_MAX_LENGTH}
                                  onFocus={(e) => (e.target.style.borderColor = brand)}
                                  onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                                />
                                <button
                                  onClick={() => removeMenuItem(i)}
                                  className="flex-shrink-0 p-1.5 rounded-md transition-colors duration-150 cursor-pointer"
                                  style={{ color: muted }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = muted; e.currentTarget.style.background = "transparent"; }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <input
                                style={inputStyle}
                                className="mt-2"
                                value={item.description}
                                onChange={(e) => updateMenuItem(i, "description", e.target.value)}
                                placeholder="簡単な説明（任意）"
                                maxLength={SALON_MENU_DESCRIPTION_MAX_LENGTH}
                                onFocus={(e) => (e.target.style.borderColor = brand)}
                                onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                              />
                            </div>
                          ))}
                        </div>
                        {menuItems.length < SALON_MENU_MAX_ITEMS ? (
                          <button
                            onClick={addMenuItem}
                            className="flex items-center gap-1.5 text-sm font-medium mt-3 transition-opacity duration-150 hover:opacity-70 cursor-pointer"
                            style={{ color: brand }}
                          >
                            <Plus size={16} />
                            メニューを追加
                          </button>
                        ) : (
                          <p className="text-xs mt-3" style={{ color: muted }}>メニューは最大{SALON_MENU_MAX_ITEMS}件です</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* アクセス */}
                  <div className="rounded-lg overflow-hidden" style={{ background: plate }}>
                    <button
                      onClick={() => toggleSection("access")}
                      className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:brightness-[0.97]"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={18} style={{ color: slate }} />
                        <span className="text-sm font-semibold" style={{ color: ink }}>アクセス</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {address.trim() && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(99,91,255,0.1)", color: brand }}>
                            入力済み
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          style={{ color: muted, transition: "transform 0.2s", transform: openSections.has("access") ? "rotate(180deg)" : "rotate(0)" }}
                        />
                      </div>
                    </button>
                    {openSections.has("access") && (
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <label className="block text-sm font-semibold mb-1" style={{ color: ink }}>住所</label>
                          <input
                            style={inputStyle}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="東京都渋谷区..."
                            maxLength={SALON_ADDRESS_MAX_LENGTH}
                            onFocus={(e) => (e.target.style.borderColor = brand)}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1" style={{ color: ink }}>GoogleマップURL</label>
                          <input
                            style={inputStyle}
                            value={googleMapUrl}
                            onChange={(e) => setGoogleMapUrl(e.target.value)}
                            placeholder="https://maps.google.com/..."
                            onFocus={(e) => (e.target.style.borderColor = brand)}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                          />
                          <p className="text-xs mt-1" style={{ color: muted }}>
                            Googleマップで検索し、「共有」からURLをコピーしてください
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 営業時間・定休日 */}
                  <div className="rounded-lg overflow-hidden" style={{ background: plate }}>
                    <button
                      onClick={() => toggleSection("hours")}
                      className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-150 hover:brightness-[0.97]"
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={18} style={{ color: slate }} />
                        <span className="text-sm font-semibold" style={{ color: ink }}>営業時間・定休日</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(businessHoursText.trim() || closedDays.trim()) && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(99,91,255,0.1)", color: brand }}>
                            入力済み
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          style={{ color: muted, transition: "transform 0.2s", transform: openSections.has("hours") ? "rotate(180deg)" : "rotate(0)" }}
                        />
                      </div>
                    </button>
                    {openSections.has("hours") && (
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <label className="block text-sm font-semibold mb-1" style={{ color: ink }}>営業時間</label>
                          <textarea
                            style={{ ...inputStyle, resize: "none" as const }}
                            value={businessHoursText}
                            onChange={(e) => setBusinessHoursText(e.target.value)}
                            placeholder={"例:\n平日 10:00〜20:00\n土日祝 10:00〜18:00"}
                            maxLength={SALON_BUSINESS_HOURS_TEXT_MAX_LENGTH}
                            rows={3}
                            onFocus={(e) => (e.target.style.borderColor = brand)}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1" style={{ color: ink }}>定休日</label>
                          <input
                            style={inputStyle}
                            value={closedDays}
                            onChange={(e) => setClosedDays(e.target.value)}
                            placeholder="毎週月曜日、第3火曜日"
                            maxLength={SALON_CLOSED_DAYS_MAX_LENGTH}
                            onFocus={(e) => (e.target.style.borderColor = brand)}
                            onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 cursor-pointer"
                    style={{ background: gradient }}
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Step 2: デザイン ─── */}
      {step === 2 && (
        <div className="animate-fade-in-delay-2">
          <div className="rounded-lg p-6 sm:p-8" style={{ background: white }}>
            <div className="space-y-6">
              <FieldLabel label="メインカラー">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer"
                    style={{ border: ghostBorder }}
                  />
                  <input
                    style={{ ...inputStyle, maxWidth: 140, fontFamily: "monospace" }}
                    value={accentColor}
                    onChange={(e) => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                        setAccentColor(e.target.value);
                      }
                    }}
                  />
                </div>
              </FieldLabel>

              <FieldLabel label="お客様の声レイアウト">
                <div className="flex gap-2 mt-1">
                  {([
                    { id: "card" as const, label: "カード", icon: Square, desc: "1列で大きく表示" },
                    { id: "grid" as const, label: "グリッド", icon: LayoutGrid, desc: "2列・高さ均一" },
                    { id: "wall" as const, label: "Wall", icon: Columns3, desc: "2列・高さ自由" },
                    { id: "list" as const, label: "リスト", icon: List, desc: "コンパクトに一覧" },
                  ]).map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setReviewLayout(layout.id)}
                      className="flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg cursor-pointer transition-all duration-150"
                      style={{
                        background: reviewLayout === layout.id ? `${brand}10` : plate,
                      }}
                    >
                      <layout.icon size={18} style={{ color: reviewLayout === layout.id ? brand : muted }} />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: reviewLayout === layout.id ? ink : slate, letterSpacing: "-0.011em" }}
                      >
                        {layout.label}
                      </span>
                      <span className="hidden sm:block text-[10px]" style={{ color: muted }}>{layout.desc}</span>
                    </button>
                  ))}
                </div>
              </FieldLabel>

              {/* フルプレビュー - 削除済み */}
              {false && (
                <div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: themeConfig.bodyBg, border: `1px solid ${rule}` }}
                >
                  {/* カバー画像 */}
                  {coverPreview && (
                    <div style={{ aspectRatio: "3.2 / 1" }}>
                      <img
                        src={coverPreview!}
                        alt=""
                        style={{
                          width: "100%", height: "100%",
                          objectFit: "cover", objectPosition: `center ${coverPosition}%`,
                        }}
                      />
                    </div>
                  )}

                  {/* プロフィール */}
                  <div style={{
                    background: coverPreview ? themeConfig.bodyBg : themeConfig.headerBg,
                    padding: "0 20px 24px",
                    textAlign: "center" as const,
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "center",
                      marginTop: coverPreview ? -40 : 24,
                      marginBottom: 12,
                      position: "relative" as const,
                      zIndex: 2,
                    }}>
                      {logoPreview ? (
                        <img
                          src={logoPreview!}
                          alt=""
                          className="mx-auto"
                          style={{
                            width: 80, height: 80, borderRadius: "50%", objectFit: "cover" as const,
                            border: `4px solid ${themeConfig.bodyBg}`,
                            background: themeConfig.bodyBg,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        />
                      ) : (
                        <div
                          className="mx-auto"
                          style={{
                            width: 80, height: 80, borderRadius: "50%", background: accentColor,
                            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 30, fontWeight: 700,
                            border: `4px solid ${themeConfig.bodyBg}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          {(salonName || "S").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* サロン名 + リンクアイコン */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                      <p
                        style={{ fontSize: 20, fontWeight: 700, color: themeConfig.textPrimary, margin: 0, letterSpacing: "-0.01em" }}
                      >
                        {salonName || "サロン名"}
                      </p>
                      {links.filter(l => l.url.trim()).length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {links.filter(l => l.url.trim()).map((l, i) => (
                            <span key={i} style={{ display: "flex", alignItems: "center", color: themeConfig.textSecondary }}>
                              <SalonLinkIcon icon={l.icon && l.icon !== "none" ? l.icon : "web"} size={22} color={themeConfig.textSecondary} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {tagline && (
                      <p style={{ fontSize: 14, color: themeConfig.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                        {tagline}
                      </p>
                    )}
                  </div>

                  {/* 評価 */}
                  <div style={{ textAlign: "center" as const, padding: "20px 20px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ color: accentColor, fontSize: 20, letterSpacing: "1px", lineHeight: 1 }}>
                        {"\u2605\u2605\u2605\u2605\u2605"}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: themeConfig.textPrimary }}>4.8</span>
                    </div>
                    <p style={{ fontSize: 13, color: themeConfig.textSecondary, marginTop: 4 }}>
                      お客様の声 12件
                    </p>
                  </div>

                  {/* レイアウトプレビュー */}
                  <div style={{ padding: "12px 16px" }}>
                    <PreviewCards layout={reviewLayout} themeConfig={themeConfig} accent={accentColor} />
                  </div>

                  {/* フッター */}
                  <div style={{ textAlign: "center" as const, padding: "32px 20px 16px", fontSize: 11, color: themeConfig.textSecondary, opacity: 0.6 }}>
                    Powered by VoiceHub
                  </div>
                </div>
              </div>
              )}

              <StepNavigation onBack={() => setStep(1)} onNext={() => setStep(3)} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: 予約導線 ─── */}
      {step === 3 && (
        <div className="animate-fade-in-delay-2">
          <div className="rounded-lg p-6 sm:p-8" style={{ background: white }}>
            <div className="space-y-5">
              <p className="text-sm" style={{ color: slate, letterSpacing: "-0.011em" }}>
                LINE、Instagram、Webサイトなどのリンクを追加できます（最大{SALON_MAX_LINKS}つ）
              </p>

              {links.map((link, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: plate }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* アイコン選択 */}
                      <div>
                        <span
                          className="block text-[11px] font-medium uppercase mb-1.5"
                          style={{ color: muted, letterSpacing: "0.04em" }}
                        >
                          アイコン
                        </span>
                        <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                          {SALON_LINK_ICONS.map((iconDef) => (
                            <button
                              key={iconDef.id}
                              title={iconDef.label}
                              onClick={() => {
                                const updated = [...links];
                                updated[i] = { ...updated[i], icon: iconDef.id };
                                setLinks(updated);
                              }}
                              className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-150"
                              style={{
                                background: link.icon === iconDef.id ? `${brand}10` : white,
                                color: link.icon === iconDef.id ? brand : slate,
                              }}
                            >
                              <SalonLinkIcon icon={iconDef.id} size={16} color={link.icon === iconDef.id ? brand : muted} />
                              <span className="hidden sm:inline">{iconDef.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        style={{ ...inputStyle, background: white }}
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder={urlPlaceholders[link.icon] ?? "https://..."}
                        onFocus={(e) => (e.target.style.borderColor = brand)}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(227,232,238,0.5)")}
                      />
                      {!link.url.trim() && (
                        <p className="text-xs" style={{ color: "#E25950" }}>
                          URLを入力してください
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeLink(i)}
                      className="mt-1 p-1.5 transition-opacity duration-150 hover:opacity-50 cursor-pointer"
                      style={{ color: muted }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {links.length < SALON_MAX_LINKS && (
                <button
                  onClick={addLink}
                  className="flex items-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer"
                  style={{ color: brandD }}
                >
                  <Plus size={15} />
                  リンクを追加
                </button>
              )}

              <StepNavigation
                onBack={() => setStep(2)}
                onNext={() => {
                  const hasEmptyUrl = links.some((l) => !l.url.trim());
                  if (hasEmptyUrl) return;
                  setStep(4);
                }}
                nextDisabled={links.some((l) => !l.url.trim())}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 4: 公開設定 ─── */}
      {step === 4 && (
        <div className="animate-fade-in-delay-2">
          <div className="rounded-lg p-6 sm:p-8" style={{ background: white }}>
            <div className="space-y-6">
              {/* 公開トグル */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: ink, letterSpacing: "-0.011em" }}>
                    ページを公開
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: muted }}>
                    公開するとURLにアクセスできるようになります
                  </p>
                </div>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
                  style={{ background: isPublished ? brand : plate }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200"
                    style={{
                      background: white,
                      transform: isPublished ? "translateX(20px)" : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {/* URL */}
              {pageUrl && (
                <div
                  className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: plate }}
                >
                  <span
                    className="text-sm truncate flex-1 tabular-nums"
                    style={{ color: slate, fontFamily: "monospace", letterSpacing: "-0.011em" }}
                  >
                    {pageUrl}
                  </span>
                  <button
                    onClick={() => copy(pageUrl, "url")}
                    className="flex items-center gap-1.5 text-xs font-medium transition-opacity duration-150 hover:opacity-70 cursor-pointer whitespace-nowrap"
                    style={{ color: brand }}
                  >
                    {copiedKey === "url" ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === "url" ? "コピー済み" : "URLをコピー"}
                  </button>
                </div>
              )}

              {/* プレビューリンク */}
              {pageUrl && isPublished && (
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
                  style={{ color: brandD }}
                >
                  <Eye size={15} />
                  ページを確認する
                  <ExternalLink size={12} />
                </a>
              )}

              {error && (
                <p className="text-sm" style={{ color: "#E25950" }}>{error}</p>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity duration-150 hover:opacity-70 cursor-pointer"
                  style={{ color: slate, background: plate }}
                >
                  戻る
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 cursor-pointer disabled:opacity-50"
                  style={{ background: gradient }}
                >
                  {saving ? "保存中..." : saved ? (
                    <><Check size={15} /> 保存済み</>
                  ) : (
                    "保存する"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Field Label ─── */
function FieldLabel({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-medium uppercase mb-2"
        style={{ color: slate, letterSpacing: "0.02em" }}
      >
        {label}
        {required && <span style={{ color: brand }}> *</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Step Navigation ─── */
function StepNavigation({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between pt-2">
      <button
        onClick={onBack}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-opacity duration-150 hover:opacity-70 cursor-pointer"
        style={{ color: slate, background: plate }}
      >
        戻る
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: gradient }}
      >
        次へ
      </button>
    </div>
  );
}

/* ─── Theme Card ─── */
function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: SalonThemeConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-lg p-4 transition-all duration-150 cursor-pointer"
      style={{
        background: selected ? `${brand}08` : plate,
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-5 h-5 rounded-full"
          style={{ background: theme.defaultAccent }}
        />
        <span
          className="text-xs font-semibold text-center"
          style={{ color: selected ? ink : slate, letterSpacing: "-0.011em" }}
        >
          {theme.label}
        </span>
        <p className="hidden sm:block text-[10px] text-center leading-relaxed" style={{ color: muted }}>
          {theme.description}
        </p>
        {selected && (
          <Check size={12} style={{ color: brand }} />
        )}
      </div>
    </button>
  );
}

/* ─── Preview Cards ─── */
const sampleReviews = [
  { stars: 5, name: "田中様", text: "とても丁寧で素敵な施術でした。カウンセリングから仕上がりまで大満足です。また利用させていただきます！" },
  { stars: 4, name: "佐藤様", text: "雰囲気が良くリラックスできました。" },
  { stars: 5, name: "山田様", text: "友人の紹介で初めて伺いました。丁寧なカウンセリングで安心できました。仕上がりも大満足で、友人にもおすすめしたいと思います。次回も楽しみにしています！" },
  { stars: 5, name: "鈴木様", text: "毎回癒されています。ありがとう！" },
];

function MiniCard({ stars, name, text, accent, themeConfig, compact }: {
  stars: number; name: string; text: string; accent: string;
  themeConfig: SalonThemeConfig; compact?: boolean;
}) {
  return (
    <div
      style={{
        background: themeConfig.cardBg,
        borderRadius: themeConfig.borderRadius,
        padding: compact ? 8 : 10,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 3 : 4,
      }}
    >
      <span style={{ color: accent, fontSize: compact ? 10 : 11, letterSpacing: 1 }}>
        {Array.from({ length: 5 }, (_, i) => i < stars ? "\u2605" : "\u2606").join("")}
      </span>
      <p style={{
        fontSize: compact ? 10 : 11,
        lineHeight: 1.4,
        color: themeConfig.textSecondary,
        margin: 0,
        display: compact ? "-webkit-box" : undefined,
        WebkitLineClamp: compact ? 2 : undefined,
        WebkitBoxOrient: compact ? ("vertical" as const) : undefined,
        overflow: compact ? "hidden" : undefined,
      }}>
        {text}
      </p>
      <span style={{ fontSize: compact ? 9 : 10, color: themeConfig.textSecondary, opacity: 0.7 }}>
        {name}
      </span>
    </div>
  );
}

function PreviewCards({ layout, themeConfig, accent }: {
  layout: SalonReviewLayout; themeConfig: SalonThemeConfig; accent: string;
}) {
  if (layout === "grid") {
    return (
      <div className="mt-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {sampleReviews.map((r, i) => (
          <MiniCard key={i} {...r} accent={accent} themeConfig={themeConfig} compact />
        ))}
      </div>
    );
  }

  if (layout === "wall") {
    return (
      <div className="mt-4" style={{ columnCount: 2, columnGap: 6 }}>
        {sampleReviews.map((r, i) => (
          <div key={i} style={{ breakInside: "avoid", marginBottom: 6 }}>
            <MiniCard {...r} accent={accent} themeConfig={themeConfig} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="mt-4" style={{ display: "flex", flexDirection: "column" }}>
        {sampleReviews.map((r, i) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              borderBottom: i < sampleReviews.length - 1 ? `1px solid ${themeConfig.cardBorder}` : "none",
              display: "flex",
              alignItems: "start",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%", background: accent,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}
            >
              {r.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: themeConfig.textPrimary }}>{r.name}</span>
                <span style={{ color: accent, fontSize: 9, letterSpacing: 1 }}>
                  {Array.from({ length: 5 }, (_, i) => i < r.stars ? "\u2605" : "\u2606").join("")}
                </span>
              </div>
              <p style={{ fontSize: 10, lineHeight: 1.4, color: themeConfig.textSecondary, margin: 0 }}>
                {r.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // card (default)
  return (
    <div className="mt-4" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sampleReviews.map((r, i) => (
        <MiniCard key={i} {...r} accent={accent} themeConfig={themeConfig} />
      ))}
    </div>
  );
}
