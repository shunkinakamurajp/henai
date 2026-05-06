import TagChip from "./TagChip.tsx";

type Props = {
  tags: string[];
  selected: string | null;
  onChange: (tag: string | null) => void;
  mode?: "row" | "wrap";
};
export default function TagFilter({
  tags,
  selected,
  onChange,
  mode = "wrap",
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: mode === "wrap" ? "wrap" : "nowrap",
        gap: 8,
        overflowX: mode === "row" ? "auto" : "visible",
        alignItems: "center",
      }}
    >
      {/* すべて */}
      <TagChip
        label="すべて"
        active={selected === null}
        onClick={() => onChange(null)}
      />

      {/* タグ */}
      {tags.map((tag) => (
        <TagChip
          key={tag}
          label={tag}
          active={selected === tag}
          onClick={() => onChange(tag)}
        />
      ))}
    </div>
  );
}
