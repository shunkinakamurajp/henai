// src/pages/UserProfile.tsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import { UserProfile as UserProfileType, Collection } from "../types/index.ts";
import { useItems } from "../hooks/useItems.ts"; // フックをインポート
import PhotoCard from "../components/PhotoCard.tsx";
import TagChip from "../components/TagChip.tsx";

const colors = {
  bg:      "#F8F6F0",
  text:    "#3D3328",
  subtext: "#A39B8B",
  accent:  "#A68A61",
  border:  "#E6E0D4",
};

const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans:  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
};

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  
  // 1. 共通フックから全データを取得
  const { photos, collections, loading, error } = useItems();
  const [selTag, setSelTag] = useState<string | null>(null);

  // 2. モックユーザー情報の生成（※将来的にAPIから取得する場合は、useUserなどの別フックにするかuseItemsに統合します）
  const userProfile: UserProfileType = {
    id: userId || "unknown",
    name: userId === "1" ? "ユーザーA" : `収集家 ${userId}`,
    title: "真鍮の蒐集家",
    stats: [
      { tag: "キーボード", score: 85 },
      { tag: "3Dプリント", score: 60 }
    ]
  };

  // 3. 取得した全データから、該当ユーザーの投稿のみにフィルタリング
  // ※ JSON内で userId が数値になっている可能性も考慮し、String()で安全に比較します
  const userPhotos = photos.filter((p) => String(p.userId) === String(userId));
  const userCollections = collections.filter((c) => String(c.authorId) === String(userId));

  // タグ一覧の抽出 (ユーザーのフォトと図鑑の両方から収集)
  const allTags = [...new Set([
    ...userPhotos.flatMap((p) => p.tags ?? []),
    ...userCollections.flatMap((c) => c.aiTags ?? [])
  ])];

  // 選択されたタグでさらに表示データをフィルタリング
  const displayedCollections = selTag
    ? userCollections.filter((c) => c.aiTags?.includes(selTag))
    : userCollections;

  const displayedPhotos = selTag
    ? userPhotos.filter((p) => p.tags?.includes(selTag))
    : userPhotos;

  // ローディングとエラーの表示
  if (loading) return <div style={{ color: colors.subtext, padding: "40px" }}>読み込み中...</div>;
  if (error || !userProfile) return <div style={{ color: "#991b1b", padding: "40px" }}>{error}</div>;

  return (
    <>
      {/* ── ユーザーヘッダー ── */}
      <header style={{ 
        display: "flex", alignItems: "center", gap: "32px", 
        marginBottom: "48px", paddingBottom: "32px", borderBottom: `1px solid ${colors.border}` 
      }}>
        <div style={{ 
          width: "100px", height: "100px", borderRadius: "50%", backgroundColor: colors.border,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" 
        }}>👤</div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "28px", margin: 0, fontFamily: fonts.serif }}>{userProfile.name}</h2>
            <span style={{ fontSize: "14px", color: colors.accent, fontWeight: "bold" }}>{userProfile.title}</span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            {userProfile.stats.map(s => (
              <div key={s.tag} style={{ fontSize: "12px", color: colors.subtext }}>
                {s.tag} <span style={{ color: colors.text, fontWeight: "bold" }}>{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── タグフィルター ── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "11px", color: colors.subtext, marginBottom: "10px", fontWeight: "bold" }}>
          タグで絞り込む
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <TagChip label="すべて" active={selTag === null} onClick={() => setSelTag(null)} />
          {allTags.map((t) => (
            <TagChip key={t} label={t} active={selTag === t} onClick={() => setSelTag(selTag === t ? null : t)} />
          ))}
        </div>
      </div>

      {/* ── コンテンツエリア ── */}
      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ fontFamily: fonts.serif, fontSize: "20px", marginBottom: "20px" }}>図鑑</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {displayedCollections.map((item) => (
            <div key={item.id} style={{
              background: "#FCFAEF",
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              overflow: "hidden",
              padding: 16,
            }}>
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10 }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 150,
                    background: "#E6E0D4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                  }}>
                  📚
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: fonts.serif, fontSize: 16, fontWeight: "bold", color: colors.text }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: colors.subtext, marginTop: 6, lineHeight: 1.5 }}>
                  {item.content}
                </div>
                {item.aiTags && item.aiTags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {item.aiTags.map((tag) => (
                      <TagChip key={tag} label={tag} active={selTag === tag} onClick={() => setSelTag(selTag === tag ? null : tag)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {displayedCollections.length === 0 && <p style={{ color: colors.subtext, fontSize: "13px" }}>図鑑の記録はありません</p>}
      </section>

      <section>
        <h3 style={{ fontFamily: fonts.serif, fontSize: "20px", marginBottom: "20px" }}>フォト</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
          {displayedPhotos.map((item) => (
            <PhotoCard key={item.id} item={item} />
          ))}
        </div>
        {displayedPhotos.length === 0 && <p style={{ color: colors.subtext, fontSize: "13px" }}>フォトの記録はありません</p>}
      </section>
    </>
  );
}