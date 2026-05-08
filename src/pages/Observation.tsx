import { useEffect, useState, useMemo } from "react";
import { useItems } from "../hooks/useItems.ts";
import { PhotoMaterial, SavedBoard } from "../types/index.ts";
import PhotoCard from "../components/PhotoCard.tsx";
import TagChip from "../components/TagChip.tsx";

const colors = { bg: "#F8F6F0", text: "#2A241E", subtext: "#5D544D", accent: "#8B5E3C", line: "rgba(139, 94, 60, 0.12)" };
const fonts = { serif: '"Noto Serif JP", serif', sans: '"Noto Sans JP", sans-serif', mono: 'monospace' };

/**
 * 自分以外のユーザーが記録した偏愛を「観測」するページ
 */
export default function Observation() {
  // ★ otherPhotos を直接受け取ることで、自分以外のデータのみを表示
  const { otherPhotos, loading } = useItems();
  const [selTag, setSelTag] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMaterial | null>(null);

  // 他人の投稿から、タグのリストを生成
  const allTags = useMemo(() => {
    const tags = otherPhotos.flatMap((p) => [...(p.aiTags || []), ...(p.tags || [])].map((t) => t.replace(/^#/, "")));
    return [...new Set(tags)];
  }, [otherPhotos]);

  // フィルタリング後の他者の投稿
  const filteredPhotos = useMemo(() => {
    return otherPhotos.filter((p) => {
      if (!selTag) return true;
      const itemTags = [...(p.aiTags || []), ...(p.tags || [])].map((t) => t.replace(/^#/, ""));
      return itemTags.includes(selTag);
    });
  }, [otherPhotos, selTag]);

  if (loading) return <div style={{ padding: 40, backgroundColor: colors.bg, minHeight: "100vh", textAlign: "center" }}>観測台帳を展開中...</div>;

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh", padding: "40px 60px" }}>
      {/* ── ヘッダー ── */}
      <header style={{ marginBottom: 48 }}>
        <div style={{ display: "inline-block", borderLeft: `6px solid ${colors.accent}`, paddingLeft: "20px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", fontFamily: fonts.serif, margin: 0, letterSpacing: "0.15em" }}>🔭 観測台帳</h1>
        </div>
        <p style={{ marginTop: 16, fontSize: "15px", color: colors.subtext, maxWidth: "650px", lineHeight: 1.8 }}>
          あなた以外の誰かが、日常の中で見つけ出した「熱狂」の断片を観測します。知らない誰かの視点を通して、世界の解像度を上げましょう。
        </p>
      </header>

      {/* ── タグフィルター ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: "12px", color: colors.accent, marginBottom: "12px", fontWeight: "bold", letterSpacing: "0.1em" }}>熱量の索引</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <TagChip label="全領域を観測" active={selTag === null} onClick={() => setSelTag(null)} />
          {allTags.map((t) => (
            <TagChip key={t} label={`#${t}`} active={selTag === t} onClick={() => setSelTag(t)} />
          ))}
        </div>
      </div>

      {/* ── フィード ── */}
      {filteredPhotos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "120px 0", color: colors.subtext, fontFamily: fonts.serif }}>
          <div style={{ fontSize: "40px", marginBottom: "20px" }}>🔭</div>
          現在、この領域で観測可能な他者の記録はありません。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
          {filteredPhotos.map((photo, index) => (
            <div 
              key={photo.id} 
               onClick={() => setSelectedPhoto(photo)} // ★ 追加：クリックで選択
              style={{ 
                position: "relative", 
                transform: `rotate(${((index % 5) - 2) * 1.5}deg)`, 
                cursor: "zoom-in", // ★ 追加：クリックできることを示す
                transition: "transform 0.2s ease"
            }}>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "2px", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }}>
                <PhotoCard item={photo} />
                <div style={{ marginTop: "12px", fontSize: "10px", color: colors.subtext, textAlign: "right", fontFamily: fonts.mono, borderTop: `1px solid ${colors.line}`, paddingTop: "8px" }}>
                  Observer ID: {photo.userId?.slice(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── 詳細ポップアップ（モーダル） ── */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)} 
          style={{ 
            position: "fixed", 
            top: 0, left: 0, width: "100%", height: "100%", 
            backgroundColor: "rgba(0,0,0,0.8)", // 背景を暗くする
            display: "flex", alignItems: "center", justifyContent: "center", 
            zIndex: 9999, // 一番上に持ってくる
            padding: "20px"
          }}
        >
          {/* 閉じるボタン：画面右上に固定 */}
          <button 
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "#fff", border: "none", borderRadius: "50%",
              width: "40px", height: "40px", cursor: "pointer",
              fontSize: "20px", fontWeight: "bold", zIndex: 10000,
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
            }}
          >
            ✕
          </button>

          {/* 白いカード部分 */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              backgroundColor: "#fff", padding: "24px", borderRadius: "8px", 
              maxWidth: "600px", width: "100%", maxHeight: "90vh", 
              overflowY: "auto", position: "relative"
            }}
          >
            <img 
              src={selectedPhoto.url} 
              style={{ width: "100%", height: "auto", borderRadius: "4px", marginBottom: "16px" }} 
            />
            <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", marginBottom: "12px" }}>
              {selectedPhoto.title || "無題の記録"}
            </h2>
            <p style={{ color: colors.subtext, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {selectedPhoto.description}
            </p>
            
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${colors.line}`, fontSize: "12px", fontFamily: fonts.mono }}>
              Observer ID: {selectedPhoto.userId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}