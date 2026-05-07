import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems.ts";

export default function Record() {
  const { addPhoto } = useItems();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null); // 送信用ファイル
  const [drag, setDrag] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // アップロード中状態
  const ref = useRef<HTMLInputElement>(null);

  const load = (f?: File) => {
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUrl(reader.result as string);
    };
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      // Pythonサーバーへ送信（テキストとタグは現在は空で送信）
      await addPhoto(file, "", []);
      setSaved(true);
      
      // 成功したら一覧へ戻る
      setTimeout(() => {
        setSaved(false);
        navigate("/photos");
      }, 1500);
    } catch (error) {
      alert("保存に失敗しました。サーバーが起動しているか確認してください。");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={C.main}>
      <header style={C.header}>
        <button onClick={() => navigate(-1)} style={C.back}>←</button>
        <h1 style={C.title}>素材を記録</h1>
        <div style={{ width: 40 }} />
      </header>

      <div style={C.content}>
        <div
          style={{
            ...C.dropzone,
            borderColor: drag ? "#646cff" : "#ddd",
            backgroundColor: drag ? "#f0f0ff" : "#fafafa",
          }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            load(e.dataTransfer.files[0]);
          }}
          onClick={() => ref.current?.click()}
        >
          {url ? (
            <img src={url} alt="preview" style={C.preview} />
          ) : (
            <div style={C.placeholder}>
              <span style={{ fontSize: 40 }}>📸</span>
              <p>タップして写真を選択<br/>またはドラッグ＆ドロップ</p>
            </div>
          )}
          <input
            type="file"
            ref={ref}
            style={{ display: "none" }}
            accept="image/*"
            onChange={(e) => load(e.target.files?.[0])}
          />
        </div>

        <div style={C.actions}>
          <button
            onClick={handleSave}
            disabled={!file || isUploading}
            style={{
              ...C.button,
              opacity: (!file || isUploading) ? 0.5 : 1,
            }}
          >
            {isUploading ? "解析中..." : saved ? "記録完了！" : "画像を記録"}
          </button>
        </div>
      </div>
    </div>
  );
}

const C: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", backgroundColor: "#fff" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid #eee" },
  back: { fontSize: "24px", background: "none", border: "none", cursor: "pointer" },
  title: { fontSize: "18px", fontWeight: "bold", margin: 0 },
  content: { padding: "20px" },
  dropzone: { width: "100%", aspectRatio: "1/1", border: "2px dashed #ddd", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" },
  preview: { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: { textAlign: "center", color: "#888" },
  actions: { marginTop: "30px" },
  button: { width: "100%", padding: "16px", borderRadius: "12px", border: "none", backgroundColor: "#000", color: "#fff", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
};