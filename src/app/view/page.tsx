"use client";

import { useState, useRef, useEffect } from "react";
import { Star, CheckCircle, XCircle, MoreHorizontal, Circle, ChevronDown } from "lucide-react";

const ink = "#1A1F36";
const slate = "#4F566B";
const muted = "#A3ACB9";
const plate = "#F0F1F3";
const brand = "#635BFF";
const brandD = "#493EE5";
const rule = "#E3E8EE";
const gradient = `linear-gradient(180deg, ${brand} 0%, ${brandD} 100%)`;

type Status = "pending" | "approved" | "rejected";

const demoItems = [
  { id: "1", name: "山田太郎", rating: 5, content: "とても素晴らしいサービスでした。スタッフの対応が丁寧で、安心して利用できました。友人にもおすすめしたいと思います。", status: "pending" as Status, date: "2024/03/15" },
  { id: "2", name: "佐藤花子", rating: 4, content: "カウンセリングがとても丁寧で、自分に合ったプランを提案してもらえました。結果にも満足しています。", status: "approved" as Status, date: "2024/03/12" },
  { id: "3", name: "鈴木一郎", rating: 3, content: "全体的には良かったですが、待ち時間が少し長かったです。次回は改善されるとうれしいです。", status: "rejected" as Status, date: "2024/03/10" },
];

const statusColor = (s: Status) => s === "approved" ? "#24B47E" : s === "rejected" ? "#E25950" : "#F5A623";

export default function ViewPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#F7F8F9" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: ink }}>承認UIパターン比較</h1>
        <p className="text-sm mb-8" style={{ color: muted }}>同じデータを7つの異なるパターンで表示しています</p>

        <PatternA />
        <PatternB />
        <PatternC />
        <PatternD />
        <PatternE />
        <PatternF />
        <PatternG />
      </div>
    </div>
  );
}

/* ─── Pattern A: ドット + 有効な遷移のみ ─── */
function PatternA() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));

  return (
    <Section title="パターンA" desc="ドット残し + 有効な遷移のみ表示">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: statusColor(t.status) }} />
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                  </div>
                  <Stars rating={t.rating} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-medium uppercase hidden sm:inline" style={{ color: muted }}>{t.date}</span>
                  {/* Desktop */}
                  <div className="hidden sm:flex items-center gap-1.5 ml-3">
                    {t.status !== "rejected" && (
                      <button onClick={() => update(t.id, "rejected")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer" style={{ color: slate, background: plate }}>
                        <XCircle size={13} /> 却下
                      </button>
                    )}
                    {t.status !== "approved" && (
                      <button onClick={() => update(t.id, "approved")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-white cursor-pointer" style={{ background: gradient }}>
                        <CheckCircle size={13} /> 承認
                      </button>
                    )}
                  </div>
                  {/* Mobile */}
                  <div className="flex sm:hidden items-center gap-0.5">
                    {t.status !== "rejected" && (
                      <button onClick={() => update(t.id, "rejected")} className="p-1.5 cursor-pointer" style={{ color: "#E25950" }}><XCircle size={18} /></button>
                    )}
                    {t.status !== "approved" && (
                      <button onClick={() => update(t.id, "approved")} className="p-1.5 cursor-pointer" style={{ color: "#24B47E" }}><CheckCircle size={18} /></button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

/* ─── Pattern B: ドット + ホバーでアクション ─── */
function PatternB() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));

  return (
    <Section title="パターンB" desc="ドット残し + ホバーでアクション表示（WordPress風）">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="group flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: statusColor(t.status) }} />
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                    <span className="text-[10px] font-medium uppercase" style={{ color: muted }}>{t.date}</span>
                  </div>
                  <Stars rating={t.rating} />
                </div>
                {/* Desktop: hover only */}
                <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {t.status !== "rejected" && (
                    <button onClick={() => update(t.id, "rejected")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer" style={{ color: slate, background: plate }}>
                      <XCircle size={13} /> 却下
                    </button>
                  )}
                  {t.status !== "approved" && (
                    <button onClick={() => update(t.id, "approved")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-white cursor-pointer" style={{ background: gradient }}>
                      <CheckCircle size={13} /> 承認
                    </button>
                  )}
                </div>
                {/* Mobile: always visible */}
                <div className="flex sm:hidden items-center gap-0.5">
                  {t.status !== "rejected" && (
                    <button onClick={() => update(t.id, "rejected")} className="p-1.5 cursor-pointer" style={{ color: "#E25950" }}><XCircle size={18} /></button>
                  )}
                  {t.status !== "approved" && (
                    <button onClick={() => update(t.id, "approved")} className="p-1.5 cursor-pointer" style={{ color: "#24B47E" }}><CheckCircle size={18} /></button>
                  )}
                </div>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

/* ─── Pattern C: ドットなし + ラベルで状態暗示 ─── */
function PatternC() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));

  return (
    <Section title="パターンC" desc="ドットなし + ボタンラベルで状態暗示（Judge.me風）">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                    <span className="text-[10px] font-medium uppercase" style={{ color: muted }}>{t.date}</span>
                  </div>
                  <Stars rating={t.rating} />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Desktop */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {t.status === "pending" && (
                      <>
                        <button onClick={() => update(t.id, "rejected")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer" style={{ color: slate, background: plate }}>
                          <XCircle size={13} /> 却下
                        </button>
                        <button onClick={() => update(t.id, "approved")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-white cursor-pointer" style={{ background: gradient }}>
                          <CheckCircle size={13} /> 承認
                        </button>
                      </>
                    )}
                    {t.status === "approved" && (
                      <button onClick={() => update(t.id, "pending")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer" style={{ color: slate, background: plate }}>
                        承認を取消
                      </button>
                    )}
                    {t.status === "rejected" && (
                      <button onClick={() => update(t.id, "approved")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-white cursor-pointer" style={{ background: gradient }}>
                        <CheckCircle size={13} /> 承認
                      </button>
                    )}
                  </div>
                  {/* Mobile */}
                  <div className="flex sm:hidden items-center gap-0.5">
                    {t.status === "pending" && (
                      <>
                        <button onClick={() => update(t.id, "rejected")} className="p-1.5 cursor-pointer" style={{ color: "#E25950" }}><XCircle size={18} /></button>
                        <button onClick={() => update(t.id, "approved")} className="p-1.5 cursor-pointer" style={{ color: "#24B47E" }}><CheckCircle size={18} /></button>
                      </>
                    )}
                    {t.status === "approved" && (
                      <button onClick={() => update(t.id, "pending")} className="px-2 py-1 text-[10px] font-medium rounded-[4px] cursor-pointer" style={{ color: slate, background: plate }}>取消</button>
                    )}
                    {t.status === "rejected" && (
                      <button onClick={() => update(t.id, "approved")} className="p-1.5 cursor-pointer" style={{ color: "#24B47E" }}><CheckCircle size={18} /></button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

/* ─── Pattern D: タブで完全分離 ─── */
function PatternD() {
  const [items, setItems] = useState(demoItems);
  const [tab, setTab] = useState<"all" | Status>("all");
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));

  const filtered = tab === "all" ? items : items.filter(i => i.status === tab);
  const tabs: { key: "all" | Status; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "approved", label: "承認済み" },
    { key: "pending", label: "未承認" },
    { key: "rejected", label: "非承認" },
  ];

  return (
    <Section title="パターンD" desc="タブで分離（YouTube風）— 「すべて」のみドット表示">
      <div className="flex gap-0 mb-0" style={{ borderBottom: `1px solid ${rule}` }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm cursor-pointer relative"
            style={{ color: tab === t.key ? ink : slate, fontWeight: tab === t.key ? 600 : 400 }}
          >
            {t.label}
            {tab === t.key && <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full" style={{ background: brand }} />}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12"><p className="text-sm" style={{ color: muted }}>該当する口コミがありません</p></div>
      ) : (
        filtered.map((t, i) => (
          <Row key={t.id} border={i < filtered.length - 1}>
            <div className="flex items-start gap-3.5">
              <Avatar name={t.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {tab === "all" && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: statusColor(t.status) }} />}
                      <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                      <span className="text-[10px] font-medium uppercase" style={{ color: muted }}>{t.date}</span>
                    </div>
                    <Stars rating={t.rating} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Desktop */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {t.status !== "rejected" && (
                        <button onClick={() => update(t.id, "rejected")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium cursor-pointer" style={{ color: slate, background: plate }}>
                          <XCircle size={13} /> 却下
                        </button>
                      )}
                      {t.status !== "approved" && (
                        <button onClick={() => update(t.id, "approved")} className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-semibold text-white cursor-pointer" style={{ background: gradient }}>
                          <CheckCircle size={13} /> 承認
                        </button>
                      )}
                    </div>
                    {/* Mobile */}
                    <div className="flex sm:hidden items-center gap-0.5">
                      {t.status !== "rejected" && (
                        <button onClick={() => update(t.id, "rejected")} className="p-1.5 cursor-pointer" style={{ color: "#E25950" }}><XCircle size={18} /></button>
                      )}
                      {t.status !== "approved" && (
                        <button onClick={() => update(t.id, "approved")} className="p-1.5 cursor-pointer" style={{ color: "#24B47E" }}><CheckCircle size={18} /></button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
              </div>
            </div>
          </Row>
        ))
      )}
    </Section>
  );
}

/* ─── Pattern E: Linear風 — ドットクリックでインラインドロップダウン ─── */
function PatternE() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
  const [openId, setOpenId] = useState<string | null>(null);

  const statusLabel = (s: Status) => s === "approved" ? "承認済み" : s === "rejected" ? "非承認" : "未承認";

  return (
    <Section title="パターンE" desc="Linear風 — ステータスドットをクリックでドロップダウン切替">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {/* Clickable status dot */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenId(openId === t.id ? null : t.id)}
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ background: `${statusColor(t.status)}18` }}
                      >
                        <span className="w-[8px] h-[8px] rounded-full" style={{ background: statusColor(t.status) }} />
                      </button>
                      {openId === t.id && (
                        <StatusDropdown
                          current={t.status}
                          onSelect={(s) => { update(t.id, s); setOpenId(null); }}
                          onClose={() => setOpenId(null)}
                        />
                      )}
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                    <span className="text-[10px] font-medium uppercase" style={{ color: muted }}>{t.date}</span>
                  </div>
                  <Stars rating={t.rating} />
                </div>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

function StatusDropdown({ current, onSelect, onClose }: { current: Status; onSelect: (s: Status) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const options: { key: Status; label: string; color: string }[] = [
    { key: "approved", label: "承認済み", color: "#24B47E" },
    { key: "pending", label: "未承認", color: "#F5A623" },
    { key: "rejected", label: "非承認", color: "#E25950" },
  ];

  return (
    <div ref={ref} className="absolute left-0 top-7 z-30 w-36 rounded-lg py-1 shadow-lg" style={{ background: "white", border: `1px solid ${rule}` }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onSelect(o.key)}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-gray-50"
          style={{ color: current === o.key ? ink : slate, fontWeight: current === o.key ? 600 : 400 }}
        >
          <span className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: o.color }} />
          {o.label}
          {current === o.key && <CheckCircle size={12} className="ml-auto" style={{ color: o.color }} />}
        </button>
      ))}
    </div>
  );
}

/* ─── Pattern F: Stripe風 — ドット+テキストバッジ + ...メニュー ─── */
function PatternF() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
  const [openId, setOpenId] = useState<string | null>(null);

  const statusLabel = (s: Status) => s === "approved" ? "承認済み" : s === "rejected" ? "非承認" : "未承認";
  const statusBg = (s: Status) => s === "approved" ? "rgba(36,180,126,0.08)" : s === "rejected" ? "rgba(226,89,80,0.08)" : "rgba(245,166,35,0.08)";
  const statusText = (s: Status) => s === "approved" ? "#1a7a56" : s === "rejected" ? "#b5302a" : "#946b1a";

  return (
    <Section title="パターンF" desc="Stripe風 — ドット+テキストバッジ、アクションは...メニュー">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="group flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: statusBg(t.status), color: statusText(t.status) }}
                    >
                      <span className="w-[5px] h-[5px] rounded-full" style={{ background: statusColor(t.status) }} />
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <Stars rating={t.rating} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium uppercase hidden sm:inline" style={{ color: muted }}>{t.date}</span>
                  <div className="relative">
                    <button
                      onClick={() => setOpenId(openId === t.id ? null : t.id)}
                      className="p-1.5 rounded-md cursor-pointer transition-colors hover:bg-gray-100"
                      style={{ color: muted }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openId === t.id && (
                      <OverflowMenu
                        status={t.status}
                        onSelect={(s) => { update(t.id, s); setOpenId(null); }}
                        onClose={() => setOpenId(null)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

function OverflowMenu({ status, onSelect, onClose }: { status: Status; onSelect: (s: Status) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-9 z-30 w-40 rounded-lg py-1 shadow-lg" style={{ background: "white", border: `1px solid ${rule}` }}>
      {status !== "approved" && (
        <button onClick={() => onSelect("approved")} className="flex items-center gap-2 w-full px-3 py-2 text-xs cursor-pointer hover:bg-gray-50" style={{ color: "#1a7a56" }}>
          <CheckCircle size={14} /> 承認する
        </button>
      )}
      {status !== "rejected" && (
        <button onClick={() => onSelect("rejected")} className="flex items-center gap-2 w-full px-3 py-2 text-xs cursor-pointer hover:bg-gray-50" style={{ color: "#b5302a" }}>
          <XCircle size={14} /> 却下する
        </button>
      )}
      {status !== "pending" && (
        <button onClick={() => onSelect("pending")} className="flex items-center gap-2 w-full px-3 py-2 text-xs cursor-pointer hover:bg-gray-50" style={{ color: slate }}>
          <Circle size={14} /> 未承認に戻す
        </button>
      )}
    </div>
  );
}

/* ─── Pattern G: Notion風 — パステルピルバッジ + クリックで切替 ─── */
function PatternG() {
  const [items, setItems] = useState(demoItems);
  const update = (id: string, s: Status) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: s } : i));
  const [openId, setOpenId] = useState<string | null>(null);

  const statusLabel = (s: Status) => s === "approved" ? "承認済み" : s === "rejected" ? "非承認" : "未承認";
  const pillBg = (s: Status) => s === "approved" ? "#dbf4e8" : s === "rejected" ? "#fde2e0" : "#fef3d6";
  const pillText = (s: Status) => s === "approved" ? "#1a7a56" : s === "rejected" ? "#b5302a" : "#946b1a";

  return (
    <Section title="パターンG" desc="Notion風 — パステルピルバッジ、クリックでステータス切替">
      {items.map((t, i) => (
        <Row key={t.id} border={i < items.length - 1}>
          <div className="flex items-start gap-3.5">
            <Avatar name={t.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold" style={{ color: ink }}>{t.name}</span>
                    {/* Clickable pill badge */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenId(openId === t.id ? null : t.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                        style={{ background: pillBg(t.status), color: pillText(t.status) }}
                      >
                        {statusLabel(t.status)}
                        <ChevronDown size={10} />
                      </button>
                      {openId === t.id && (
                        <NotionDropdown
                          current={t.status}
                          onSelect={(s) => { update(t.id, s); setOpenId(null); }}
                          onClose={() => setOpenId(null)}
                        />
                      )}
                    </div>
                  </div>
                  <Stars rating={t.rating} />
                </div>
                <span className="text-[10px] font-medium uppercase shrink-0" style={{ color: muted }}>{t.date}</span>
              </div>
              <p className="text-[13px] leading-[1.6] mt-1.5 line-clamp-2" style={{ color: slate }}>{t.content}</p>
            </div>
          </div>
        </Row>
      ))}
    </Section>
  );
}

function NotionDropdown({ current, onSelect, onClose }: { current: Status; onSelect: (s: Status) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const options: { key: Status; label: string; bg: string; text: string }[] = [
    { key: "approved", label: "承認済み", bg: "#dbf4e8", text: "#1a7a56" },
    { key: "pending", label: "未承認", bg: "#fef3d6", text: "#946b1a" },
    { key: "rejected", label: "非承認", bg: "#fde2e0", text: "#b5302a" },
  ];

  return (
    <div ref={ref} className="absolute left-0 top-8 z-30 w-40 rounded-lg py-1.5 shadow-lg" style={{ background: "white", border: `1px solid ${rule}` }}>
      <p className="px-3 py-1 text-[10px] font-medium uppercase" style={{ color: muted, letterSpacing: "0.05em" }}>ステータス</p>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onSelect(o.key)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-gray-50"
        >
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: o.bg, color: o.text }}>
            {o.label}
          </span>
          {current === o.key && <CheckCircle size={12} className="ml-auto" style={{ color: brand }} />}
        </button>
      ))}
    </div>
  );
}

/* ─── Shared components ─── */
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold mb-0.5" style={{ color: ink }}>{title}</h2>
      <p className="text-xs mb-3" style={{ color: muted }}>{desc}</p>
      <div className="bg-white rounded-lg" style={{ border: `1px solid ${rule}` }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children, border }: { children: React.ReactNode; border: boolean }) {
  return <div className="px-4 py-4" style={border ? { borderBottom: `1px solid ${rule}` } : undefined}>{children}</div>;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5" style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brandD} 100%)` }}>
      {name.charAt(0)}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={11} fill={i < rating ? "#F5A623" : "none"} style={{ color: i < rating ? "#F5A623" : rule }} />
      ))}
    </span>
  );
}
