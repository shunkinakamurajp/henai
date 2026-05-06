// src/components/ItemCard.tsx
// Observation.tsx の ObsCard をコンポーネントとして切り出したもの

import { useState } from "react";
import { PhotoMaterial } from "../types/index.ts";

const colors = {
  bg: "#F8F6F0",
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  card: "#FCFAEF",
};

const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
};

const ROTATIONS = [-3, -2, -1.5, -1, 1, 1.5, 2, 3];

interface ItemCardProps {
  item: PhotoMaterial;
  onTagClick: (tag: string) => void;
}

export default function ItemCard({ item, onTagClick }: ItemCardProps) {
  const [hovered, setHovered] = useState(false);
  const idString = typeof item.id === "number" ? String(item.id) : item.id;
  const rotationIndex = [...idString].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % ROTATIONS.length;
  const rot = ROTATIONS[rotationIndex];
  const imgSrc = item.imageUrl ?? item.img;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.card,
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.12)"
          : "0 2px 6px rgba(0,0,0,0.07)",
        transform: hovered
          ? "rotate(0deg) translateY(-4px)"
          : `rotate(${rot}deg)`,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "pointer",
      }}
    >
      {/* 画像 or 絵文字 */}
      <div
        style={{
          height: 130,
          background: item.bg ?? "#E6E0D4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.title}
            style={{ width: "100%", height: 130, objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 44 }}>{item.emoji}</span>
        )}
      </div>

      <div style={{ padding: "12px 14px" }}>
        {/* タイトル */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            color: colors.text,
            marginBottom: "5px",
            fontFamily: fonts.serif,
          }}
        >
          {item.title}
        </div>

        {/* メモ */}
        {item.memo && (
          <div
            style={{
              fontSize: "11px",
              color: colors.subtext,
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            {item.memo}
          </div>
        )}

        {/* タグ（クリックで絞り込み） */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            marginBottom: "8px",
          }}
        >
          {(item.tags ?? []).map((t) => (
            <button
              key={t}
              onClick={() => onTagClick(t)}
              style={{
                fontSize: "10px",
                padding: "2px 9px",
                borderRadius: "9999px",
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                color: colors.subtext,
                cursor: "pointer",
                fontFamily: fonts.sans,
              }}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* 場所・日付 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: colors.subtext,
          }}
        >
          {item.loc && <span>📍 {item.loc}</span>}
          {item.date && <span>{item.date}</span>}
        </div>
      </div>
    </div>
  );
}