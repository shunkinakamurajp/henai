import { useState, useMemo, useEffect } from "react";
import { useItems } from "../hooks/useItems.ts";
import { SavedBoard, PhotoMaterial } from "../types/index.ts";
import { useNavigate } from "react-router-dom";

const F = { serif: '"Noto Serif JP", serif', sans: '"Noto Sans JP", sans-serif' };
const C = { text: "#3D3328", sub: "#A39B8B", accent: "#A68A61", border: "#E6E0D4", bg: "#F8F6F0" };

/**
 * 自身が作成した図鑑（ボードの保存データ）を管理・閲覧するページ
 */
export default function Zukan() {
  // ★ myPhotos を使用して、図鑑の中身も自分の投稿のみに限定する
  const { myPhotos, loading, error } = useItems();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<SavedBoard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("savedBoards");
    if (raw) setBoards(JSON.parse(raw));
  }, []);

  const activeBoard = boards.find((b) => b.id === activeId) ?? boards[0] ?? null;

  // 自分の最新の投稿データを用いて、図鑑の表示アイテムを再計算
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
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: F.serif, fontSize: 26, fontWeight: "bold", color: C.text }}>📌 図鑑</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>これまでにあなたが収集し、整理した偏愛の記録です。</p>
        </div>
        <button onClick={() => navigate("/photos")} style={{ padding: "10px 20px", borderRadius: 8, background: C.accent, color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
          ＋ 新しい図鑑を編む
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: C.sub }}>読み込み中...</div>}
      
      {!loading && boards.length === 0 && (
        <div style={{ textAlign: "center", padding: "100px 0", color: C.sub, border: `1px dashed ${C.border}`, borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 14 }}>まだ保存された図鑑がありません。「Myフォト」でお気に入りの配置を保存してください。</p>
        </div>
      )}

      {!loading && boards.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
          {/* 左側：図鑑リスト */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {boards.map(b => (
              <div key={b.id} onClick={() => setActiveId(b.id)} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${activeId === b.id ? C.accent : C.border}`, background: activeId === b.id ? "rgba(166,138,97,0.1)" : "#fff", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: activeId === b.id ? C.accent : C.text }}>{b.title}</div>
                <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>{new Date(b.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>

          {/* 右側：ボードプレビュー */}
          {activeBoard && (
            <div style={{ background: activeBoard.condition.corkColor, borderRadius: 16, padding: "30px", minHeight: 460, boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)" }}>
              <h2 style={{ color: "#fff", fontFamily: F.serif, marginBottom: 24, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{activeBoard.title}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {displayItems.length > 0 ? displayItems.map(item => (
                  <div key={item.id} style={{ transform: `rotate(${(Math.random()-0.5)*8}deg)`, padding: 6, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                    <img src={item.imageUrl} style={{ width: 140, height: 140, objectFit: "cover" }} alt="" />
                  </div>
                )) : (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>該当する標本が現在のデータに見当たりません。</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}