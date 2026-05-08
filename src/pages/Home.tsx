import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems.ts"; // 他のページと同じフックを使用
import { useAuth } from "../hooks/useAuth.ts";
import { supabase } from "../lib/supabase";
/**
 * デザイントークンと定数
 */
const colors = {
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  card: "#FCFAEF",
  bg: "#F8F6F0",
};

const fonts = {
  serif: '"Noto Serif JP","Hiragino Mincho ProN",serif',
  sans: '"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif',
};

/**
 * コンポーネント: フォトカード
 */
const PhotoCard = ({ item, onClick }: { item: any; onClick: () => void }) => (
  <div onClick={onClick} style={{
    background: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease",
    cursor: "pointer",
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
  >
    <div style={{ 
      width: "100%", 
      height: "160px", 
      overflow: "hidden", 
      borderRadius: "4px", 
      marginBottom: "10px", 
      background: "#eee" 
    }}>
      <img 
        src={item.imageUrl} 
        alt="" 
        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
      />
    </div>
    <div style={{ 
      fontSize: "13px", 
      fontWeight: "bold", 
      color: colors.text, 
      marginBottom: "4px", 
      overflow: "hidden", 
      textOverflow: "ellipsis", 
      whiteSpace: "nowrap",
      fontFamily: fonts.serif
    }}>
      {item.title || "無題の記録"}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {(item.tags || []).map((tag: string) => (
        <span key={tag} style={{ fontSize: "10px", color: colors.accent, background: "rgba(166,138,97,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
          #{tag}
        </span>
      ))}
    </div>
  </div>
);

/**
 * コンポーネント: 図鑑カード
 */
const ZukanCard = ({ board, onClick }: { board: any; onClick: () => void }) => (
  <div onClick={onClick} style={{
    background: colors.card,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = "0 8px 24px rgba(166,138,97,0.15)";
    e.currentTarget.style.borderColor = colors.accent;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
    e.currentTarget.style.borderColor = colors.border;
  }}
  >
    <div style={{ fontSize: "16px", fontWeight: "bold", color: colors.text, marginBottom: "8px", fontFamily: fonts.serif }}>
      📌 {board.title}
    </div>
    <div style={{ fontSize: "12px", color: colors.subtext }}>
      {new Date(board.createdAt).toLocaleDateString("ja-JP")} 作成
    </div>
  </div>
);

/**
 * メインコンポーネント: Home
 */
export default function Home() {
  const { myPhotos, loading } = useItems();
  const { user } = useAuth(); // ★追加: ユーザー情報を取得
  const [boards, setBoards] = useState<any[]>([]);
  const navigate = useNavigate();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  
  // ホームで表示する4件を切り出す
  const displayPhotos = myPhotos ? myPhotos.slice(0, 4) : [];
  const lightbox = lightboxIdx !== null ? displayPhotos[lightboxIdx] : null;

  const closeLightbox = () => setLightboxIdx(null);
  const goPrev = () => setLightboxIdx((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setLightboxIdx((i) => (i !== null && i < displayPhotos.length - 1 ? i + 1 : i));

  // キーボードの矢印キーで画像を切り替える処理
  useEffect(() => {
    if (lightboxIdx === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lightboxIdx, displayPhotos.length]);

  useEffect(() => {
    const fetchRecentBoards = async () => {
      if (!user) {
        setBoards([]);
        return;
      }

      const { data, error } = await supabase
        .from("saved_boards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6); // ★ ホーム画面用なので最新の6件だけ取得すれば十分です

      if (error) {
        console.error("ホーム画面での図鑑取得エラー:", error.message);
      } else if (data) {
        // Zukan.tsx と同じように、DBのスネークケースをキャメルケースに変換してセット
        const formattedBoards = data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          title: b.title,
          comment: b.comment,
          condition: b.condition,
          offsets: b.offsets,
          createdAt: b.created_at,
        }));
        setBoards(formattedBoards);
      }
    };

    fetchRecentBoards();
  }, [user]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 48, 
      padding: "40px",
      minHeight: "100vh",
      backgroundColor: colors.bg,
      fontFamily: fonts.sans,
      color: colors.text
    }}>
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: colors.subtext }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>📖</div>
          キャビネットを展開しています...
        </div>
      ) : (
        <>
          <section>
            <SectionHeader
              title="最近のフォト"
              description="あなた自身が記録した最新の偏愛標本です。"
              onMore={() => navigate("/photos")}
            />
            {(!myPhotos || myPhotos.length === 0) ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: colors.subtext, fontSize: "14px", border: `1px dashed ${colors.border}`, borderRadius: "16px" }}>
                標本がまだありません。
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 32,
                  paddingTop: 16,
                }}
              >
                {displayPhotos.map((photo: any, index: number) => (
                  <PhotoCard key={photo.id} item={photo} onClick={() => setLightboxIdx(index)} />
                ))}
              </div>
            )}
          </section>

          <div style={{ height: "1px", backgroundColor: colors.border, width: "100%", opacity: 0.6 }} />

          <section>
            <SectionHeader
              title="最近の図鑑"
              description="テーマごとに整理された標本箱です。"
              onMore={() => navigate("/zukan")}
            />
            {boards.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: colors.subtext, fontSize: "14px", border: `1px dashed ${colors.border}`, borderRadius: "16px" }}>
                図鑑がまだありません。
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 24,
                  paddingTop: 16,
                }}
              >
                {boards.slice(0, 6).map((board) => (
                  <ZukanCard
                    key={board.id}
                    board={board}
                    onClick={() => navigate("/zukan")}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {lightbox && lightboxIdx !== null && (
        <div onClick={closeLightbox} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          
          <button 
            onClick={(e) => { e.stopPropagation(); goPrev(); }} 
            disabled={lightboxIdx === 0} 
            style={{ position: "absolute", left: 24, width: 44, height: 44, borderRadius: "50%", background: lightboxIdx === 0 ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.85)", border: "none", fontSize: 20, cursor: lightboxIdx === 0 ? "default" : "pointer", color: colors.text, zIndex: 2001 }}
          >‹</button>

          <div onClick={(e) => e.stopPropagation()} style={{ background: "transparent", padding: "16px", maxWidth: 800, width: "90%", cursor: "default", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <img src={lightbox.imageUrl} alt="photo" style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 4, boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }} />
            <div style={{ width: "100%", maxWidth: 600, background: "#FFFDF5", borderRadius: 12, padding: "20px", marginTop: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontFamily: fonts.serif, color: colors.text }}>{lightbox.title || "無題の標本"}</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: 14, color: colors.subtext, lineHeight: 1.6 }}>{lightbox.memo || "まだ言葉が添えられていません。"}</p>
              {lightbox.tags && lightbox.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {lightbox.tags.map((t: string) => <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(166,138,97,0.1)", color: colors.accent, borderRadius: 999 }}>#{t}</span>)}
                </div>
              )}
              {/* 編集はフォトページで行うように誘導 */}
              <button onClick={() => navigate("/photos")} style={{ padding: "6px 14px", fontSize: 12, borderRadius: 6, border: `1px solid ${colors.border}`, background: "transparent", color: colors.subtext, float: "right", cursor: "pointer" }}>✏️ フォトページで編集</button>
              <div style={{ clear: "both" }}></div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); goNext(); }} 
            disabled={lightboxIdx === displayPhotos.length - 1} 
            style={{ position: "absolute", right: 24, width: 44, height: 44, borderRadius: "50%", background: lightboxIdx === displayPhotos.length - 1 ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.85)", border: "none", fontSize: 20, cursor: lightboxIdx === displayPhotos.length - 1 ? "default" : "pointer", color: colors.text, zIndex: 2001 }}
          >›</button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, description, onMore }: { title: string; description: string; onMore: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", fontFamily: fonts.serif, margin: "0 0 4px" }}>
          {title}
        </h2>
        <p style={{ fontSize: "13px", color: colors.subtext, margin: 0 }}>{description}</p>
      </div>
      <span onClick={onMore} style={{ fontSize: "12px", color: colors.subtext, cursor: "pointer" }}>すべて見る ＞</span>
    </div>
  );
}