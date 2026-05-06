import { CSSProperties } from "react";

const colors = {
  bg: "#F8F6F0",
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
};

const fonts = {
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
};

interface TagChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  fontSize?: string;
  padding?: string;
  style?: CSSProperties;
}

export default function TagChip({
  label,
  active,
  onClick,
  fontSize = "11px",
  padding = "4px 13px",
  style,
}: TagChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize,
        padding,
        borderRadius: "9999px",
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? colors.accent : colors.bg,
        color: active ? "#fff" : colors.subtext,
        cursor: "pointer",
        fontFamily: fonts.sans,
        transition: "all 0.15s",
        whiteSpace: "nowrap", // 文字を絶対に折り返さない
        flexShrink: 0, // Flexボックス内で圧縮されるのを防ぐ
        display: "inline-block", // または "inline-flex"
        ...style,
      }}
    >
      {active && "# "}
      {label}
    </button>
  );
}
