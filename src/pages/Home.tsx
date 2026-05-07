import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // 追加

// --- デザイン・定数定義 ---
const colors = {
  bg: "#F8F6F0",
  card: "#FFFFFF",
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
};

const fonts = {
  serif: '"Noto Serif JP", serif',
  sans: '"Noto Sans JP", sans-serif',
};

// 型定義
interface PhotoMaterial {
  id: string | number;
  imageUrl: string;
  title?: string;
  userId: string | number;
  createdAt: string;
}

interface SavedBoard {
  id: string;
  title: string;
  createdAt: string;
}

// ダミーデータ（バックエンド未接続時用）
const MOCK_PHOTOS: PhotoMaterial[] = [
  { id: 1, imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32", title: "記憶の破片", userId: "user-123", createdAt: "2024-05-01" },
  { id: 2, imageUrl: "https://images.unsplash.com/photo-1493128477623-afc02b294496", title: "夜の静寂", userId: "user-123", createdAt: "2024-05-02" },
];

/**
 * ホームコンポーネント (AppからHomeに名称変更)
 */
export default function Home() {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [boards, setBoards] = useState<SavedBoard[]>([]);

  const navigate = useNavigate(); // React Routerの遷移用hook

  const fetchData = async () => {
    setLoading(true);
    try {
      // ユーザーIDの取得ロジック（実際はuseAuth等から取得）
      setCurrentUserId("user-123"); 
      setPhotos(MOCK_PHOTOS);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <header>
        <h1 style={{ fontFamily: fonts.serif, fontSize: "32px", fontWeight: "bold", letterSpacing: "0.05em", color: colors.text }}>
          偏愛の書斎
        </h1>
        <p style={{ fontSize: "14px", color: colors.subtext, marginTop: "8px" }}>
          あなたの「好き」が、静かに積み重なる場所。
        </p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: colors.subtext }}>読み込み中...</div>
      ) : (
        <>
          {/* 最近のフォトセクション */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", fontWeight: "bold" }}>最近のフォト</h2>
              <button 
                onClick={() => navigate("/photos")} // 修正：navigateを使用
                style={{ background: "none", border: "none", color: colors.accent, cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
              >
                一覧を見る →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {photos.slice(0, 4).map(photo => (
                <div key={photo.id} style={{ background: colors.card, padding: "12px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                  <img src={photo.imageUrl} alt={photo.title} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "4px" }} />
                  <p style={{ marginTop: "8px", fontSize: "13px", fontWeight: "bold" }}>{photo.title || "無題"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 図鑑セクション */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: fonts.serif, fontSize: "24px", fontWeight: "bold" }}>保存した図鑑</h2>
              <button 
                onClick={() => navigate("/zukan")} // 修正：navigateを使用
                style={{ background: "none", border: "none", color: colors.accent, cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
              >
                図鑑を開く →
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
              {boards.length > 0 ? boards.slice(0, 3).map(board => (
                <div key={board.id} style={{ border: `1px solid ${colors.border}`, padding: "20px", borderRadius: "12px", cursor: "pointer" }}>
                  <h3 style={{ fontFamily: fonts.serif, fontSize: "18px" }}>{board.title}</h3>
                  <p style={{ fontSize: "12px", color: colors.subtext, marginTop: "8px" }}>作成日: {new Date(board.createdAt).toLocaleDateString()}</p>
                </div>
              )) : (
                <p style={{ color: colors.subtext, fontSize: "14px" }}>まだ図鑑が作成されていません。</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}