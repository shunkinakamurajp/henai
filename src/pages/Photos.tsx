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
  // ★ myPhotos を photos という変数名でマッピングし、既存ロジックを自分専用に変更
  const { myPhotos: photos, loading, updatePhoto } = useItems();

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

  const allTags = useMemo(() => {
    return Array.from(new Set((photos || []).flatMap(photo => photo.tags || [])));
  }, [photos]);

  const filtered = useMemo((): PhotoMaterial[] => {
    let r = [...(photos || [])];
    if (cond.tags.length > 0)
      r = r.filter((p) => cond.tags.every((t) => (p.aiTags ?? p.tags ?? []).map((s) => s.replace(/^#/, "")).includes(t)));
    if (cond.dateFrom) r = r.filter((p) => p.date && p.date >= cond.dateFrom);
    if (cond.dateTo) r = r.filter((p) => p.date && p.date <= cond.dateTo);
    return r.slice(0, cond.maxCount);
  }, [photos, cond]);

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
  }, [filtered, size, mixed]);

  const boardW = Math.max(860, ...board.map((b) => b.baseX + (offsets[b.id]?.dx ?? 0) + b.w + 80));
  const boardH = Math.max(460, ...board.map((b) => b.baseY + (offsets[b.id]?.dy ?? 0) + b.h + 80));

  const lightbox = lightboxIdx !== null ? filtered[lightboxIdx] : null;
  const closeLightbox = () => { setLightboxIdx(null); setIsEditingText(false); };

  const startEditing = () => {
    if (!lightbox) return;
    setEditTitle(lightbox.title || "");
    setEditMemo(lightbox.memo || "");
    setEditTags((lightbox.tags || []).join(" "));
    setIsEditingText(true);
  };

  const handleSaveText = () => {
    if (!lightbox) return;
    updatePhoto(lightbox.id, {
      title: editTitle,
      memo: editMemo,
      tags: editTags.split(" ").filter(t => t.trim() !== ""),
    });
    setIsEditingText(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: F.serif, fontSize: 24, fontWeight: "bold", color: C.text, letterSpacing: "0.05em", marginBottom: 4 }}>🖼️ Myフォト</h1>
          <p style={{ fontSize: 12, color: C.sub }}>あなた自身の記録を整理する場所です。他人の記録は「観測」から見ることができます。</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPanelOpen((o) => !o)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: panelOpen ? C.accent : C.bg, color: panelOpen ? "#fff" : C.sub, fontSize: 12, cursor: "pointer" }}>
            {panelOpen ? "▲ 条件を閉じる" : "▼ 条件を設定"}
          </button>
          <button onClick={() => setSaveModal(true)} style={{ padding: "7px 16px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", fontSize: 12, cursor: "pointer", fontWeight: "bold" }}>
            📖 図鑑として保存
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto", overflowY: "auto", borderRadius: 12, maxHeight: "62vh", boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
        <div style={{ width: boardW, height: boardH, background: cond.corkColor, position: "relative", borderRadius: 12 }}>
          {loading && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.6)" }}>読み込み中...</div>}
          {!loading && board.map((item, i) => (
            <DraggablePin key={item.id} item={item} offset={offsets[item.id] ?? { dx: 0, dy: 0 }} onOffsetChange={(o) => setOffsets((prev) => ({ ...prev, [item.id]: o }))} onClick={() => setLightboxIdx(i)} />
          ))}
        </div>
      </div>

      {saveModal && <SaveModal cond={cond} offsets={offsets} onClose={() => setSaveModal(false)} />}
      
      {lightbox && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFDF5", padding: "24px", borderRadius: 12, maxWidth: "80%", cursor: "default" }}>
            <img src={lightbox.imageUrl} style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 4 }} />
            <div style={{ marginTop: 16 }}>
              {isEditingText ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="タイトル..." />
                  <textarea value={editMemo} onChange={e => setEditMemo(e.target.value)} placeholder="考察や想いを書き留める..." rows={3} />
                  <button onClick={handleSaveText} style={{ background: C.accent, color: "#fff", padding: "8px", borderRadius: 6, border: "none" }}>保存</button>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontFamily: F.serif, margin: "0 0 8px" }}>{lightbox.title || "無題の標本"}</h3>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{lightbox.memo || "言葉がまだ添えられていません。"}</p>
                  <button onClick={startEditing} style={{ marginTop: 12, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.sub }}>✏️ 編集</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DraggablePin({ item, offset, onOffsetChange, onClick }: any) {
  const x = item.baseX + offset.dx + 40;
  const y = item.baseY + offset.dy + 40;
  return (
    <div onClick={onClick} style={{ position: "absolute", left: x, top: y, width: item.w, transform: `rotate(${item.rot}deg)`, cursor: "pointer", transition: "transform 0.2s" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.pinColor, margin: "0 auto -5px", position: "relative", zIndex: 2 }} />
      <div style={{ background: "#fff", padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <img src={item.imageUrl} draggable={false} style={{ width: "100%", height: item.h, objectFit: "cover" }} alt="" />
      </div>
    </div>
  );
}

function SaveModal({ cond, onClose }: any) { 
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 24, borderRadius: 12, width: 320 }}>
        <h3 style={{ margin: "0 0 16px" }}>図鑑に保存</h3>
        <p style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>現在のコルクボードの配置と条件を自分自身の「図鑑」に記録します。</p>
        <button onClick={onClose} style={{ width: "100%", padding: 10, background: C.accent, color: "#fff", border: "none", borderRadius: 8 }}>保存を確定</button>
      </div>
    </div>
  );
}
function PanelLabel({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 10, color: C.sub, fontWeight: "bold", marginBottom: 6 }}>{children}</div>; }
function SmallChip({ label, active, onClick }: any) { return <button onClick={onClick} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 9999, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accent : C.bg, color: active ? "#fff" : C.sub }}>{label}</button>; }