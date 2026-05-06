import { useEffect, useRef, useState, useMemo } from "react";
import TagFilter from "../components/TagFilter.tsx";
import { PhotoMaterial, BoardCondition, SavedBoard } from "../types/index.ts";
import { useItems } from "../hooks/useItems.ts";

const F = {
  serif: '"Noto Serif JP","Hiragino Mincho ProN",serif',
  sans: '"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif',
  mono: '"SF Mono","Courier New",monospace',
};
const C = {
  text: "#3D3328",
  sub: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  bg: "#F8F6F0",
};

const PIN_COLORS = ["#c0392b", "#e67e22", "#27ae60", "#2980b9", "#8e44ad", "#16a085"];
const SIZES = [
  { label: "小", w: 120, h: 100 },
  { label: "中", w: 160, h: 135 },
  { label: "大", w: 210, h: 175 },
  { label: "混在", w: 0, h: 0 },
];
const CORK_COLORS = [
  { label: "ナチュラル", value: "#B8864E" },
  { label: "ダーク", value: "#7A5230" },
  { label: "ライト", value: "#D4AA78" },
  { label: "グリーン", value: "#6B7C5A" },
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

interface BoardItem extends PhotoMaterial {
  w: number;
  h: number;
  rot: number;
  baseX: number;
  baseY: number;
  pinColor: string;
}

const defaultCondition: BoardCondition = {
  tags: [],
  dateFrom: "",
  dateTo: "",
  maxCount: 20,
  sizeIdx: 1,
  corkColor: CORK_COLORS[0].value,
};

export default function Photos() {
  // 自分の投稿のみを取得[cite: 5, 10]
  const { myPhotos, loading, updatePhoto } = useItems();

  const [offsets, setOffsets] = useState<Record<string | number, { dx: number; dy: number }>>({});
  const [cond, setCond] = useState<BoardCondition>(() => {
    const saved = localStorage.getItem("photoCond");
    return saved ? JSON.parse(saved) : defaultCondition;
  });
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("panelOpen");
    return saved ? (JSON.parse(saved) as boolean) : false;
  });

  useEffect(() => {
    localStorage.setItem("photoCond", JSON.stringify(cond));
  }, [cond]);

  useEffect(() => {
    localStorage.setItem("panelOpen", JSON.stringify(panelOpen));
  }, [panelOpen]);

  const [saveModal, setSaveModal] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [isEditingText, setIsEditingText] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editTags, setEditTags] = useState("");

  const set = <K extends keyof BoardCondition>(k: K, v: BoardCondition[K]) =>
    setCond((c) => ({ ...c, [k]: v }));

  const allTags = useMemo(() => [
      ...new Set(myPhotos.flatMap((p) => (p.aiTags ?? p.tags ?? []).map((t) => t.replace(/^#/, "")))),
    ], [myPhotos]);

  const filtered = useMemo((): PhotoMaterial[] => {
    // 自分の写真のみを対象に絞り込む[cite: 5]
    let r = [...myPhotos];
    if (cond.tags.length > 0)
      r = r.filter((p) => cond.tags.every((t) => (p.aiTags ?? p.tags ?? []).map((s) => s.replace(/^#/, "")).includes(t)));
    if (cond.dateFrom) r = r.filter((p) => p.date && p.date >= cond.dateFrom);
    if (cond.dateTo) r = r.filter((p) => p.date && p.date <= cond.dateTo);
    return r.slice(0, cond.maxCount);
  }, [myPhotos, cond.tags, cond.dateFrom, cond.dateTo, cond.maxCount]);

  const size = SIZES[cond.sizeIdx];
  const mixed = cond.sizeIdx === 3;

  const board = useMemo((): BoardItem[] => {
    const rand = seededRand(42);
    const cols = Math.max(2, Math.floor(1060 / ((size.w || 160) + 24)));
    return filtered.map((item, i) => {
      const r = mixed ? seededRand(Number(item.id.toString().replace(/\D/g, ''))) : rand;
      const w = mixed ? [120, 140, 160, 190, 210][Math.floor(r() * 5)] : size.w;
      const h = mixed ? Math.round(w * (0.75 + r() * 0.3)) : size.h;
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        ...item, w, h,
        rot: (r() - 0.5) * 8,
        baseX: col * ((size.w || 160) + 28) + (r() - 0.5) * 18,
        baseY: row * ((size.h || 135) + 28) + (r() - 0.5) * 18,
        pinColor: PIN_COLORS[i % PIN_COLORS.length],
      };
    });
  }, [filtered, size.w, size.h, mixed]);

  const boardW = Math.max(860, ...board.map((b) => b.baseX + (offsets[b.id]?.dx ?? 0) + b.w + 80));
  const boardH = Math.max(460, ...board.map((b) => b.baseY + (offsets[b.id]?.dy ?? 0) + b.h + 80));

  const lightbox = lightboxIdx !== null ? filtered[lightboxIdx] : null;
  const closeLightbox = () => { setLightboxIdx(null); setIsEditingText(false); };
  const goPrev = () => { setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : i)); setIsEditingText(false); };
  const goNext = () => { setLightboxIdx((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i)); setIsEditingText(false); };

  useEffect(() => {
    if (lightboxIdx === null || isEditingText) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightboxIdx, filtered.length, isEditingText]);

  const startEditing = () => {
    if (!lightbox) return;
    setEditTitle(lightbox.title || "");
    setEditMemo(lightbox.memo || "");
    setEditTags((lightbox.tags || []).join(" "));
    setIsEditingText(true);
  };

  const handleSaveText = () => {
    if (!lightbox) return;
    const newTags = editTags.split(" ").filter(t => t.trim() !== "");
    updatePhoto(lightbox.id, {
      title: editTitle,
      memo: editMemo,
      tags: newTags,
    });
    setIsEditingText(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: F.serif, fontSize: 24, fontWeight: "bold", color: C.text, letterSpacing: "0.05em", marginBottom: 4 }}>🖼️ Myフォト</h1>
          <p style={{ fontSize: 12, color: C.sub }}>画像をクリックして言葉を追加できます。自分だけの記録を管理しましょう。</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPanelOpen((o) => !o)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: panelOpen ? C.accent : C.bg, color: panelOpen ? "#fff" : C.sub, fontSize: 12, cursor: "pointer", fontFamily: F.sans }}>
            {panelOpen ? "▲ 条件を閉じる" : "▼ 条件を設定"}
          </button>
          <button onClick={() => setSaveModal(true)} style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${C.accent}`, background: C.accent, color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: F.sans, fontWeight: "bold" }}>
            📖 図鑑として保存
          </button>
        </div>
      </div>

      {panelOpen && (
        <div style={{ background: "#FCFAEF", border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 18 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <PanelLabel>タグで絞る</PanelLabel>
            <TagFilter tags={allTags} selected={cond.tags.length === 1 ? cond.tags[0] : null} onChange={(t) => t ? setCond((c) => ({ ...c, tags: [t] })) : setCond((c) => ({ ...c, tags: [] }))} mode="row" />
          </div>
          <div>
            <PanelLabel>枚数：最大 {cond.maxCount} 枚</PanelLabel>
            <input type="range" min={2} max={50} value={cond.maxCount} onChange={(e) => set("maxCount", Number(e.target.value))} style={{ width: "100%", accentColor: C.accent }} />
          </div>
          <div>
            <PanelLabel>カードサイズ</PanelLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {SIZES.map((s, i) => (
                <SmallChip key={s.label} label={s.label} active={cond.sizeIdx === i} onClick={() => set("sizeIdx", i)} />
              ))}
            </div>
          </div>
          <div>
            <PanelLabel>コルクの色</PanelLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {CORK_COLORS.map((cc) => (
                <button key={cc.value} title={cc.label} onClick={() => set("corkColor", cc.value)} style={{ width: 24, height: 24, borderRadius: "50%", background: cc.value, cursor: "pointer", border: `3px solid ${cond.corkColor === cc.value ? C.text : "transparent"}`, transition: "border .15s" }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto", overflowY: "auto", borderRadius: 12, maxHeight: "62vh", boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
        <div style={{ width: boardW, height: boardH, background: cond.corkColor, position: "relative", backgroundImage: ["repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(0,0,0,.025) 12px,rgba(0,0,0,.025) 13px)", "repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(0,0,0,.018) 12px,rgba(0,0,0,.018) 13px)"].join(","), borderRadius: 12 }}>
          {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.6)", fontSize: 14 }}>写真を準備中...</div>}
          {!loading && filtered.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.4)", fontSize: 14 }}>条件に合う記録がありません</div>}
          
          {board.map((item, i) => (
            <DraggablePin key={item.id} item={item} offset={offsets[item.id] ?? { dx: 0, dy: 0 }} onOffsetChange={(o) => setOffsets((prev) => ({ ...prev, [item.id]: o }))} onClick={() => setLightboxIdx(i)} />
          ))}
        </div>
      </div>

      {saveModal && <SaveModal cond={cond} offsets={offsets} onClose={() => setSaveModal(false)} />}

      {lightbox && lightboxIdx !== null && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <ArrowBtn dir="left" disabled={lightboxIdx === 0 || isEditingText} onClick={(e) => { e.stopPropagation(); goPrev(); }} />
          <div onClick={(e) => e.stopPropagation()} style={{ background: "transparent", padding: "16px", maxWidth: 800, width: "90%", cursor: "default", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <img src={lightbox.imageUrl} alt="photo" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }} />
            <div style={{ display: "flex", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>
              {lightbox.date && <span style={{ fontFamily: F.mono }}>{lightbox.date}</span>}
            </div>
            <div style={{ width: "100%", maxWidth: 600, background: "#FFFDF5", borderRadius: 12, padding: "20px", marginTop: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              {isEditingText ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="タイトルを入力..." style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: F.serif, fontSize: 16, fontWeight: "bold" }} />
                  <textarea value={editMemo} onChange={e => setEditMemo(e.target.value)} placeholder="この写真についてのメモ・考察..." rows={3} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: F.sans, fontSize: 14, resize: "vertical" }} />
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="タグをスペース区切りで入力" style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, fontFamily: F.sans, fontSize: 13 }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setIsEditingText(false)} style={{ padding: "6px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.sub }}>キャンセル</button>
                    <button onClick={handleSaveText} style={{ padding: "6px 16px", borderRadius: 6, background: C.accent, color: "#fff", fontWeight: "bold" }}>保存</button>
                  </div>
                </div>
              ) : (
                <div>
                  {(lightbox.title || lightbox.memo || (lightbox.tags && lightbox.tags.length > 0)) ? (
                    <>
                      {lightbox.title && <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontFamily: F.serif, color: C.text }}>{lightbox.title}</h3>}
                      {lightbox.memo && <p style={{ margin: "0 0 12px 0", fontSize: 14, color: C.sub, lineHeight: 1.6 }}>{lightbox.memo}</p>}
                      {lightbox.tags && lightbox.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                          {lightbox.tags.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(166,138,97,0.1)", color: C.accent, borderRadius: 999 }}>#{t}</span>)}
                        </div>
                      )}
                      <button onClick={startEditing} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, float: "right" }}>✏️ テキストを編集</button>
                      <div style={{ clear: "both" }}></div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <p style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>まだ言葉が添えられていません。</p>
                      <button onClick={startEditing} style={{ padding: "8px 20px", fontSize: 13, borderRadius: 6, background: C.accent, color: "#fff", fontWeight: "bold" }}>＋ 言葉を添える</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <ArrowBtn dir="right" disabled={lightboxIdx === filtered.length - 1 || isEditingText} onClick={(e) => { e.stopPropagation(); goNext(); }} />
        </div>
      )}
    </>
  );
}

function DraggablePin({ item, offset, onOffsetChange, onClick }: { item: BoardItem; offset: { dx: number; dy: number }; onOffsetChange: (o: { dx: number; dy: number }) => void; onClick: () => void; }) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const startRef = useRef<{ mx: number; my: number; dx: number; dy: number; } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    startRef.current = { mx: e.clientX, my: e.clientY, dx: offset.dx, dy: offset.dy };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!startRef.current) return;
      onOffsetChange({ dx: startRef.current.dx + e.clientX - startRef.current.mx, dy: startRef.current.dy + e.clientY - startRef.current.my });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  const x = item.baseX + offset.dx + 40;
  const y = item.baseY + offset.dy + 40;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onMouseDown}
      onClick={() => !dragging && onClick()}
      style={{
        position: "absolute", left: x, top: y, width: item.w,
        transform: hovered && !dragging ? "rotate(0deg) translateY(-5px) scale(1.04)" : `rotate(${item.rot}deg)`,
        filter: `drop-shadow(${dragging ? "4px 12px 20px rgba(0,0,0,.45)" : "2px 5px 10px rgba(0,0,0,.28)"})`,
        transition: dragging ? "none" : "transform .2s, filter .2s",
        cursor: dragging ? "grabbing" : "grab", zIndex: dragging ? 50 : hovered ? 10 : 1, userSelect: "none",
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.pinColor, border: "2px solid rgba(0,0,0,.2)", margin: "0 auto -6px", position: "relative", zIndex: 2, boxShadow: "0 2px 5px rgba(0,0,0,.4)" }} />
      <div style={{ background: "#FFFDF5", borderRadius: 2 }}>
        <div style={{ width: "100%", height: item.h + 10, overflow: "hidden", background: item.bg ?? "#E6E0D4", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={item.imageUrl} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        </div>
        <div style={{ padding: "6px 8px 8px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#b8a890", fontFamily: F.mono, letterSpacing: "0.05em" }}>{item.date ?? ""}</div>
        </div>
      </div>
    </div>
  );
}

function SaveModal({ cond, offsets, onClose }: { cond: BoardCondition; offsets: Record<string | number, { dx: number; dy: number }>; onClose: () => void; }) {
  const [title, setTitle] = useState("");
  const [done, setDone] = useState(false);

  const save = () => {
    if (!title.trim()) return;
    const board: SavedBoard = { id: crypto.randomUUID(), title: title.trim(), condition: cond, offsets, createdAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem("savedBoards") ?? "[]") as SavedBoard[];
    localStorage.setItem("savedBoards", JSON.stringify([board, ...existing]));
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, borderRadius: 14, padding: "28px 28px 24px", width: 360, boxShadow: "0 16px 48px rgba(0,0,0,.3)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0", fontFamily: F.serif, fontSize: 18, color: C.accent }}>✓ 図鑑に保存しました</div>
        ) : (
          <>
            <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: "bold", color: C.text, marginBottom: 6 }}>図鑑として保存</div>
            <label style={{ fontSize: 11, color: C.sub, display: "block", marginBottom: 6 }}>タイトル</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：錆と光の記録" autoFocus onKeyDown={(e) => e.key === "Enter" && save()} style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 14, fontFamily: F.sans, color: C.text, outline: "none", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontSize: 13, cursor: "pointer", fontFamily: F.sans }}>キャンセル</button>
              <button onClick={save} disabled={!title.trim()} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: title.trim() ? C.accent : C.border, color: title.trim() ? "#fff" : C.sub, fontSize: 13, fontWeight: "bold", cursor: title.trim() ? "pointer" : "default", fontFamily: F.sans }}>保存する</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ArrowBtn({ dir, disabled, onClick }: { dir: "left" | "right"; disabled: boolean; onClick: (e: React.MouseEvent) => void; }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ position: "fixed", top: "50%", transform: "translateY(-50%)", [dir === "left" ? "left" : "right"]: 24, width: 44, height: 44, borderRadius: "50%", background: disabled ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.85)", border: "none", fontSize: 20, cursor: disabled ? "default" : "pointer", color: disabled ? "rgba(0,0,0,.2)" : "#3D3328", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 101 }}>
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}
function PanelLabel({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 10, color: C.sub, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, fontWeight: "bold", fontFamily: F.sans }}>{children}</div>; }
function SmallChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) { return <button onClick={onClick} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 9999, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accent : C.bg, color: active ? "#fff" : C.sub, cursor: "pointer", fontFamily: F.sans }}>{label}</button>; }