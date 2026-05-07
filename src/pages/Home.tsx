import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems.ts"; // 他のページと同じフックを使用

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
const PhotoCard = ({ item }: { item: any }) => (
  <div style={{
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
  // 他のページで成功している myPhotos を直接使う
  const { myPhotos, loading } = useItems();
  const [boards, setBoards] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const rawBoards = localStorage.getItem("savedBoards");
    if (rawBoards) {
      try {
        setBoards(JSON.parse(rawBoards));
      } catch (e) {
        setBoards([]);
      }
    }
  }, []);

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
                {myPhotos.slice(0, 4).map((photo: any) => (
                  <PhotoCard key={photo.id} item={photo} />
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