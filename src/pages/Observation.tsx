import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems.ts";
import { PhotoMaterial, SavedBoard } from "../types/index.ts";
import PhotoCard from "../components/PhotoCard.tsx";
import ZukanCard from "../components/ZukanCard.tsx";
import TagChip from "../components/TagChip.tsx";

// ── デザイン定義 ──
const colors = {
  bg: "#F8F6F0",
  text: "#2A241E",
  subtext: "#5D544D",
  accent: "#8B5E3C",
  line: "rgba(139, 94, 60, 0.12)",
  cardBg: "#FFFDF5",
};

const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
  mono: '"SF Mono", "Courier New", monospace',
};

type FeedItem =
  | { kind: "photo"; data: PhotoMaterial; id: string }
  | { kind: "board"; data: SavedBoard; id: string };

// ── ヘルパー関数 ──
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const r = seededRand(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Observation() {
  const navigate = useNavigate();
  // currentUserId (u1) を取得して他者の判定に使用[cite: 5, 7]
  const { photos, currentUserId, loading, error } = useItems();
  const [boards, setBoards] = useState<SavedBoard[]>([]);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999));
  const [selTag, setSelTag] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "photo" | "board">("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedBoards");
      if (raw) setBoards(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // フィードアイテムの生成（他者の記録のみに限定）
  const feed = useMemo((): FeedItem[] => {
    // 1. 他者のフォトのみを抽出[cite: 4, 14]
    const othersPhotos = photos.filter((p) => String(p.userId) !== currentUserId);

    let photoItems: FeedItem[] = othersPhotos
      .filter((p) => {
        if (!selTag) return true;
        const itemTags = [...(p.aiTags || []), ...(p.tags || [])].map((t) => t.replace(/^#/, ""));
        return itemTags.includes(selTag);
      })
      .map((p) => ({ kind: "photo" as const, data: p, id: `p-${p.id}` }));

    // 2. 他者の図鑑のみを抽出 (SavedBoardにauthorIdがある場合を想定。現状はlocalStorageのため簡易フィルタ)[cite: 7, 8]
    // ※localStorageのデータが自分のものである場合は、将来的にAPI連携した際にここを authorId !== currentUserId にします。
    let boardItems: FeedItem[] = boards
      .filter((b) => !selTag || b.condition.tags.includes(selTag))
      .map((b) => ({ kind: "board" as const, data: b, id: `b-${b.id}` }));

    let merged: FeedItem[] =
      filter === "photo"
        ? photoItems
        : filter === "board"
          ? boardItems
          : [...photoItems, ...boardItems];

    return shuffle(merged, seed);
  }, [photos, boards, currentUserId, seed, selTag, filter]);

  const allTags = useMemo(() => {
    const pTags = photos.filter(p => String(p.userId) !== currentUserId)
      .flatMap((p) => [...(p.aiTags || []), ...(p.tags || [])].map((t) => t.replace(/^#/, "")));
    const bTags = boards.flatMap((b) => b.condition.tags);
    return [...new Set([...pTags, ...bTags])];
  }, [photos, boards, currentUserId]);

  const reshuffle = useCallback(() => setSeed(Math.floor(Math.random() * 99999)), []);

  if (loading) return <div style={{ color: colors.subtext, padding: "40px", backgroundColor: colors.bg, minHeight: "100vh" }}>観測データを展開中...</div>;

  return (
    <div style={{ position: "relative", minHeight: "100%", backgroundColor: colors.bg, color: colors.text, backgroundImage: `linear-gradient(${colors.line} 1px, transparent 1px), linear-gradient(90deg, ${colors.line} 1px, transparent 1px)`, backgroundSize: "32px 32px", margin: "-40px -60px", padding: "40px 60px" }}>
      
      {/* ── ヘッダー ── */}
      <header style={{ marginBottom: "48px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "inline-block", borderLeft: `5px solid ${colors.accent}`, paddingLeft: "20px", marginBottom: "12px" }}>
            <h1 style={{ fontSize: "30px", fontWeight: "bold", fontFamily: fonts.serif, margin: 0, letterSpacing: "0.15em" }}>🔭 観測台帳</h1>
          </div>
          <p style={{ fontSize: "14px", color: colors.subtext, lineHeight: 1.8, maxWidth: "600px", fontFamily: fonts.sans }}>
            他者の日常に紛れ込んだ「偏愛」の断片を観測し、新しい関心の座標を見つける場所です。[cite: 4]
          </p>
        </div>
        <button onClick={reshuffle} style={{ padding: "10px 20px", borderRadius: "4px", border: `1px solid ${colors.accent}`, background: "transparent", color: colors.accent, fontSize: "12px", cursor: "pointer", fontFamily: fonts.sans }}>
          再配置する
        </button>
      </header>

      {/* ── フィルター ── */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          {(["all", "photo", "board"] as const).map((v) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 16px", border: `1px solid ${filter === v ? colors.accent : "transparent"}`, borderRadius: "20px", background: filter === v ? colors.accent : "transparent", color: filter === v ? "#fff" : colors.subtext, fontSize: "12px", cursor: "pointer" }}>
              {v === "all" ? "すべて" : v === "photo" ? "📷 他者のフォト" : "📌 他者の図鑑"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: colors.accent, marginBottom: "10px", fontWeight: "bold" }}>分類 / 索引</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <TagChip label="すべて表示" active={selTag === null} onClick={() => setSelTag(null)} fontSize="11px" />
          {allTags.map((t) => (
            <TagChip key={t} label={`#${t}`} active={selTag === t} onClick={() => setSelTag(selTag === t ? null : t)} fontSize="11px" />
          ))}
        </div>
      </div>

      {/* ── ステータス ── */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${colors.line}`, paddingBottom: "8px", marginBottom: "32px", fontSize: "12px", color: colors.accent }}>
        <span>観測対象: {selTag ? `「${selTag}」` : "他者の記録すべて"}</span>
        <span>標本数: {feed.length.toString().padStart(3, "0")} 件</span>
      </div>

      {/* ── フィード ── */}
      {feed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: colors.subtext, fontFamily: fonts.serif }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔭</div>
          現在、この座標で観測可能な他者の記録はありません。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "40px" }}>
          {feed.map((item, index) => (
            <div key={item.id} style={{ position: "relative", transform: `rotate(${((index % 4) - 1.5) * 1.2}deg)` }}>
              <div style={{ background: colors.cardBg, padding: "10px", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: item.kind === "board" ? `2px solid ${colors.accent}` : `1px solid ${colors.line}` }}>
                {item.kind === "photo" ? <PhotoCard item={item.data} /> : <ZukanCard board={item.data} onClick={() => navigate("/zukan")} />}
                {/* 投稿者識別ラベル[cite: 14] */}
                <div style={{ marginTop: "8px", fontSize: "10px", color: colors.subtext, textAlign: "right", fontFamily: fonts.mono }}>
                  {item.kind === "photo"
                    ? `Captured by: ${item.data.userId}`
                    : "Captured by: unknown"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}