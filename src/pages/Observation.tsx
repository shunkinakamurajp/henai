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
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "60px 40px", // 上下の間隔を少し広げて重なりを軽減
          alignItems: "start" 
        }}>
          {filteredPhotos.map((photo, index) => {
            const isSelected = selectedPhoto?.id === photo.id; // このカードが選択されているか

            return (
              <div 
                key={photo.id} 
                onClick={() => setSelectedPhoto(isSelected ? null : photo)} // クリックで展開/折りたたみ
                style={{ 
                  position: "relative", 
                  // 選択時は「回転を戻す」「少し大きくする」「最前面へ」
                  transform: isSelected ? "rotate(0deg) scale(1.02)" : `rotate(${((index % 5) - 2) * 1.5}deg)`, 
                  zIndex: isSelected ? 100 : 1, 
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer"
                }}
              >
                <div style={{ 
                  background: "#fff", 
                  padding: "12px", 
                  borderRadius: "2px", 
                  boxShadow: isSelected 
                    ? "0 20px 40px rgba(0,0,0,0.2)" // 選択時は影を強くして浮いている感を出す
                    : "0 6px 16px rgba(0,0,0,0.08)",
                  border: isSelected ? `1px solid ${colors.accent}` : "1px solid transparent"
                }}>
                  <PhotoCard item={photo} />
                  
                  {/* ── ★詳細テキスト（選択された時だけ表示） ── */}
                  {isSelected && (
                    <div style={{ 
                      marginTop: "16px", 
                      paddingTop: "16px", 
                      borderTop: `1px solid ${colors.line}`,
                      animation: "fadeIn 0.3s ease" 
                    }}>
                      <p style={{ 
                        fontSize: "14px", 
                        color: colors.text, 
                        lineHeight: 1.7, 
                        margin: "0 0 12px 0",
                        whiteSpace: "pre-wrap"
                      }}>
                        {photo.description || "詳細な観測記録はありません。"}
                      </p>
                      <div style={{ fontSize: "11px", color: colors.accent, textAlign: "center", fontWeight: "bold" }}>
                        ▲ クリックで閉じる
                      </div>
                    </div>
                  )}

                  {/* 元からあるフッター情報 */}
                  <div style={{ 
                    marginTop: "12px", 
                    fontSize: "10px", 
                    color: colors.subtext, 
                    textAlign: "right", 
                    fontFamily: fonts.mono, 
                    borderTop: !isSelected ? `1px solid ${colors.line}` : "none", 
                    paddingTop: !isSelected ? "8px" : "0" 
                  }}>
                    Observer ID: {photo.userId?.slice(0, 8)}...
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
}