import React, { useEffect, useState, useMemo } from "react";

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

const API_BASE_URL = "http://localhost:8000";

/**
 * 型定義
 */
interface PhotoMaterial {
  id: string | number;
  userId: string;
  imageUrl: string;
  title?: string;
  memo?: string;
  tags?: string[];
  aiTags?: string[];
  date?: string;
}

interface SavedBoard {
  id: string;
  title: string;
  condition: any;
  offsets: any;
  createdAt: string;
  comment?: string;
}

/**
 * モックデータ (サーバー未接続時の表示用)
 */
const MOCK_PHOTOS: PhotoMaterial[] = [
  { 
    id: "m1", 
    userId: "u1", 
    imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c8a9833d8e?w=800", 
    title: "深緑の記憶", 
    tags: ["自然", "緑"], 
    date: "2024-05-01" 
  },
  { 
    id: "m2", 
    userId: "u1", 
    imageUrl: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800", 
    title: "静止した刻", 
    tags: ["アンティーク", "静寂"], 
    date: "2024-05-02" 
  },
  { 
    id: "m3", 
    userId: "u1", 
    imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800", 
    title: "湖畔の朝", 
    tags: ["風景", "青"], 
    date: "2024-05-03" 
  },
  { 
    id: "m4", 
    userId: "u1", 
    imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800", 
    title: "光の標本", 
    tags: ["抽象", "光"], 
    date: "2024-05-04" 
  }
];

const MOCK_BOARDS: SavedBoard[] = [
  { 
    id: "b1", 
    title: "標本箱：静かなるもの", 
    createdAt: new Date().toISOString(), 
    condition: {}, 
    offsets: {} 
  }
];

/**
 * 簡易的なSupabaseモック
 */
const mockSupabase = {
  auth: {
    getUser: async () => {
      return { data: { user: { id: "u1" } }, error: null };
    }
  }
};

/**
 * コンポーネント: フォトカード
 */
const PhotoCard = ({ item }: { item: PhotoMaterial }) => (
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
      {(item.tags || []).map(tag => (
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
const ZukanCard = ({ board, onClick }: { board: SavedBoard; onClick: () => void }) => (
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
 * メインコンポーネント: App (Home)
 */
export default function App() {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<SavedBoard[]>([]);

  const navigate = (path: string) => {
    console.log(`Navigation target: ${path}`);
    window.location.hash = path;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await mockSupabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const photosRes = await fetch(`${API_BASE_URL}/photos`);
      if (!photosRes.ok) throw new Error("Fetch failed");
      
      const data = await photosRes.json();
      setPhotos(data.photos || []);
    } catch (err: any) {
      // 接続エラー (Failed to fetch) 時はモックデータにフォールバックしてプレビューを維持
      console.warn("Backend not found. Falling back to mock data.");
      setPhotos(MOCK_PHOTOS);
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
        setBoards(MOCK_BOARDS);
      }
    } else {
      setBoards(MOCK_BOARDS);
    }
  }, []);

  const myPhotos = useMemo(() => {
    if (!currentUserId) return [];
    return photos.filter(p => String(p.userId) === String(currentUserId));
  }, [photos, currentUserId]);

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
            {myPhotos.length === 0 ? (
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
                {myPhotos.slice(0, 4).map((photo) => (
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