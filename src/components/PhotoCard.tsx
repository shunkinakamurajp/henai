// src/components/PhotoCard.tsx
// Photos.tsx（ポラロイド＋ピン）と Home.tsx（フラットカード）の両方で使用

import { useState } from "react";
import { PhotoMaterial } from "../types/index.ts";

const colors = {
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  bg: "#F8F6F0",
};
const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
  mono: '"SF Mono", "Courier New", monospace',
};

interface PhotoCardProps {
  item: PhotoMaterial;
  /** コルクボード用の回転角度。省略するとフラット表示（Home用） */
  rotation?: number;
  /** ピンの色。省略するとピン非表示（Home用） */
  pinColor?: string;
}

export default function PhotoCard({ item, rotation, pinColor }: PhotoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // rotation が渡されている → ポラロイド（Photos）モード
  // 渡されていない         → フラットカード（Home）モード
  const isPolaroid = rotation !== undefined && pinColor !== undefined;

  const cardStyle = isPolaroid
    ? {
        transform: hovered
          ? "rotate(0deg) translateY(-6px) scale(1.04)"
          : `rotate(${rotation}deg)`,
        transition: "transform 0.2s ease, filter 0.2s ease",
        filter: `drop-shadow(${
          hovered
            ? "3px 8px 16px rgba(0,0,0,0.4)"
            : "2px 4px 8px rgba(0,0,0,0.25)"
        })`,
        cursor: "zoom-in",
      }
    : {
        // Home用フラットカード
        borderRadius: "10px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        background: "#FFFDF5",
        boxShadow: hovered
          ? "0 6px 16px rgba(0,0,0,0.1)"
          : "0 2px 6px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "zoom-in",
      };

  return (
    <>
      {/* ── カード本体 ── */}
      <div
        onClick={() => setLightboxOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={cardStyle as React.CSSProperties}
      >
        {/* ピン（ポラロイドモードのみ表示） */}
        {isPolaroid && (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: pinColor,
              border: "2px solid rgba(0,0,0,0.2)",
              margin: "0 auto -6px",
              position: "relative",
              zIndex: 2,
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
            }}
          />
        )}

        {/* ポラロイド本体 / フラットカード本体 */}
        <div
          style={
            isPolaroid
              ? { background: "#FFFDF5", borderRadius: 2 }
              : {}
          }
        >
          {/* サムネイル */}
          <div
            style={{
              width: "100%",
              height: isPolaroid ? 120 : 160,
              background: item.bg ?? "#E6E0D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{
                  width: "100%",
                  height: isPolaroid ? 120 : 160,
                  objectFit: "cover",
                }}
              />
            ) : (
              <span style={{ fontSize: isPolaroid ? 38 : 44 }}>
                {item.emoji}
              </span>
            )}
          </div>

          {/* テキストエリア */}
          <div style={{ padding: isPolaroid ? "7px 10px 10px" : "10px 12px 14px" }}>
            <div
              style={{
                fontSize: isPolaroid ? 9 : 13,
                fontWeight: "bold",
                color: isPolaroid ? "#3a2e22" : colors.text,
                fontFamily: fonts.serif,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.title}
            </div>
            {item.date && (
              <div
                style={{
                  fontSize: isPolaroid ? 8 : 11,
                  color: isPolaroid ? "#b8a890" : colors.subtext,
                  fontFamily: fonts.mono,
                  marginTop: 2,
                }}
              >
                {item.date}
              </div>
            )}

            {/* フラットモードのみ：aiTagsを表示 */}
            {!isPolaroid && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8, minHeight: "18px" }}>
                {/* aiTags または tags があれば表示、なければ何も出さない */}
                {(item.aiTags?.length ? item.aiTags : item.tags || []).slice(0, 3).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    color: colors.accent,
                    background: "rgba(166,138,97,0.1)",
                  }}>
                  #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ライトボックス（両モード共通） ── */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFDF5",
              borderRadius: 4,
              padding: "16px 16px 20px",
              maxWidth: 440,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              cursor: "default",
            }}
          >
            {/* 拡大画像 */}
            <div
              style={{
                width: "100%",
                maxHeight: 300,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: item.bg ?? "#E6E0D4",
                marginBottom: 14,
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 72 }}>{item.emoji}</span>
              )}
            </div>

            {/* タイトル */}
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 15,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 6,
              }}
            >
              {item.title}
            </div>

            {/* メモ */}
            {item.memo && (
              <div
                style={{
                  fontSize: 12,
                  color: colors.subtext,
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {item.memo}
              </div>
            )}

            {/* タグ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {item.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: "2px 9px",
                    borderRadius: 9999,
                    border: `1px solid ${colors.border}`,
                    color: colors.subtext,
                    fontFamily: fonts.sans,
                  }}
                >
                  # {t}
                </span>
              ))}
            </div>

            {/* 場所・日付 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: colors.subtext,
              }}
            >
              {item.loc && <span>📍 {item.loc}</span>}
              {item.date && (
                <span style={{ fontFamily: fonts.mono }}>{item.date}</span>
              )}
            </div>

            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.subtext,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: fonts.sans,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}