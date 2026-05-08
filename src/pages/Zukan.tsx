import { useState, useMemo, useEffect } from "react";
import { useItems } from "../hooks/useItems.ts";
import { useAuth } from "../hooks/useAuth"; // .js を削除
import { SavedBoard, PhotoMaterial } from "../types/index.ts";
import { useNavigate } from "react-router-dom";

const F = { serif: '"Noto Serif JP", serif', sans: '"Noto Sans JP", sans-serif' };
const C = { text: "#3D3328", sub: "#A39B8B", accent: "#A68A61", border: "#E6E0D4", bg: "#F8F6F0" };

export default function Zukan() {
  const { myPhotos, loading: itemsLoading } = useItems();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<SavedBoard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardsLoading, setBoardsLoading] = useState(true);

  useEffect(() => {
  if (!user) return;

  try {
    // localStorage から取得
    const saved = localStorage.getItem(`savedBoards_${user.uid}`);

    if (saved) {
      const fetchedBoards: SavedBoard[] = JSON.parse(saved);

      // createdAt の新しい順
      fetchedBoards.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setBoards(fetchedBoards);

      // 最初の図鑑を選択
      if (fetchedBoards.length > 0 && !activeId) {
        setActiveId(fetchedBoards[0].id);
      }
    } else {
      setBoards([]);
    }
  } catch (err) {
    console.error("ボードの取得に失敗しました:", err);
  } finally {
    setBoardsLoading(false);
  }
}, [user]);

  const loading = itemsLoading || boardsLoading;
  const activeBoard = boards.find((b) => b.id === activeId) ?? boards[0] ?? null;

  const displayItems = useMemo(() => {
    if (!activeBoard || myPhotos.length === 0) return [];
    let filtered = [...myPhotos];
    if (activeBoard.condition.tags.length > 0) {
      filtered = filtered.filter(p => 
        activeBoard.condition.tags.every(t => (p.tags || []).includes(t))
      );
    }
    return filtered.slice(0, activeBoard.condition.maxCount);
  }, [activeBoard, myPhotos]);

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh", padding: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: F.serif, fontSize: 26, fontWeight: "bold", color: C.text }}>📌 図鑑</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>収集し、整理した偏愛の記録です。</p>
        </div>
        <button onClick={() => navigate("/photos")} style={{ padding: "10px 20px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
          ＋ 新しい図鑑を編む
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.sub }}>読み込み中...</div>
      ) : boards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: C.sub, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p>まだ図鑑がありません。Myフォトでお気に入りを保存してください。</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
          {/* 左側：図鑑リスト */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {boards.map(b => (
              <div 
                key={b.id} 
                onClick={() => setActiveId(b.id)} 
                style={{ 
                  padding: "14px 16px", borderRadius: 10, 
                  border: `1px solid ${activeId === b.id ? C.accent : C.border}`, 
                  background: activeId === b.id ? "rgba(166,138,97,0.1)" : "#fff", 
                  cursor: "pointer", transition: "all 0.2s" 
                }}
              >
                <div style={{ fontSize: 14, fontWeight: "bold", color: activeId === b.id ? C.accent : C.text }}>{b.title}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>{b.createdAt? new Date(b.createdAt).toLocaleDateString(): ""}</div>
              </div>
            ))}
          </div>

          {/* 右側：ボードプレビュー */}
          {activeBoard && (
            <div style={{ background: activeBoard.condition.corkColor, borderRadius: 16, padding: "30px", minHeight: 460, boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)" }}>
              <h2 style={{ color: "#fff", fontFamily: F.serif, marginBottom: 24, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{activeBoard.title}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {displayItems.length > 0 ? displayItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      // Math.randomをインデックスベースの固定値に変更
                      transform: `rotate(${((index % 5) - 2) * 3}deg)`, 
                      padding: 6, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" 
                    }}
                  >
                    {/* item.imageUrl を item.url に修正 */}
                    <img src={item.url} style={{ width: 140, height: 140, objectFit: "cover" }} alt="" />
                  </div>
                )) : (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>該当する標本が見当たりません。</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}