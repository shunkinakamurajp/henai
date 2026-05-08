import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useItems } from "../hooks/useItems.ts";

export default function Record() {
  const { addPhoto } = useItems();
  const navigate = useNavigate();
  const [urls, setUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  
  // ★ 追加：進捗管理用の状態
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const ref = useRef<HTMLInputElement>(null);

  const load = (fileList?: FileList | File[] | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;

    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleSave = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress({ current: 0, total: files.length });

    // ★ 修正：forEachではなく for ループで 1枚ずつ順番に待機(await)しながら送信する
    // これにより、サーバーが1枚ずつAI分析を処理できるため、パンクを防げます
    for (let i = 0; i < files.length; i++) {
      try {
        await addPhoto(files[i], "", []); // ここで1枚終わるのを待つ
      } catch (err) {
        console.error("アップロード失敗:", files[i].name, err);
      }
      // 進捗を更新
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    // 全て完了
    setIsUploading(false);
    setSaved(true);
    setFiles([]);
    setUrls([]);
    if (ref.current) ref.current.value = "";

    // 2秒後に完了通知を消す
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles([]);
    setUrls([]);
    if (ref.current) ref.current.value = "";
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
            borderColor: drag ? "#A68A61" : "#E6E0D4",
            backgroundColor: drag ? "rgba(166, 138, 97, 0.05)" : "#F8F6F0",
            padding: urls.length > 0 ? "16px" : "0",
          }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            load(e.dataTransfer.files);
          }}
          onClick={() => !isUploading && ref.current?.click()}
        >
          {urls.length > 0 ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: colors.text }}>{files.length} 枚の画像を選択中</span>
                {!isUploading && (
                  <button onClick={clearSelection} style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: "#fff", cursor: "pointer" }}>クリア</button>
                )}
              </div>
              <div style={C.previewGrid}>
                {urls.map((url, i) => (
                  <div key={i} style={{ ...C.previewItem, opacity: i < progress.current ? 0.3 : 1 }}>
                    <img src={url} alt={`preview-${i}`} style={C.previewImage} />
                    {/* 完了した画像にチェックマーク */}
                    {i < progress.current && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>✅</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={C.placeholder}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 8 }}>📸</span>
              <p style={{ margin: 0, fontSize: 14, color: "#A39B8B", lineHeight: 1.6 }}>
                タップして写真を選択<br/>または複数ファイルを<br/>ドラッグ＆ドロップ
              </p>
            </div>
          )}
          <input
            type="file"
            ref={ref}
            style={{ display: "none" }}
            accept="image/*"
            multiple
            onChange={(e) => load(e.target.files)}
          />
        </div>

        <div style={C.actions}>
          <button
            onClick={handleSave}
            disabled={files.length === 0 || isUploading}
            style={{
              ...C.button,
              opacity: (files.length === 0 || isUploading) ? 0.5 : 1,
            }}
          >
            {isUploading ? "記録中..." : files.length > 0 ? `${files.length}枚を記録する` : "画像を記録"}
          </button>
        </div>
      </div>

      {/* ★ 進行状況のオーバーレイ表示 */}
      {(isUploading || saved) && (
        <div style={C.overlay}>
          <div style={C.overlayContent}>
            {isUploading ? (
              <>
                <div style={C.spinner} />
                <p style={C.overlayText}>AI分析＆記録中...</p>
                <p style={C.overlaySubtext}>{progress.current} / {progress.total} 枚完了</p>
                {/* プログレスバー */}
                <div style={C.progressBarContainer}>
                  <div style={{ ...C.progressBar, width: `${(progress.current / progress.total) * 100}%` }} />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>✨</div>
                <p style={C.overlayText}>記録が完了しました！</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* アニメーション用Style */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const colors = {
  bg: '#F8F6F0',
  text: '#3D3328',
  subtext: '#A39B8B',
  accent: '#A68A61',
  border: '#E6E0D4',
  card: '#FCFAEF',
};

const C: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", backgroundColor: colors.bg, color: colors.text, position: "relative", overflowX: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${colors.border}` },
  back: { fontSize: "20px", background: "none", border: "none", cursor: "pointer", color: colors.subtext },
  title: { fontSize: "16px", fontWeight: "bold", margin: 0, fontFamily: '"Noto Serif JP", serif' },
  content: { padding: "30px 20px", maxWidth: "600px", margin: "0 auto" },
  dropzone: { width: "100%", aspectRatio: "1/1", border: `2px dashed ${colors.border}`, borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" },
  placeholder: { textAlign: "center", pointerEvents: "none" },
  actions: { marginTop: "30px" },
  button: { width: "100%", padding: "16px", borderRadius: "12px", border: "none", backgroundColor: colors.accent, color: "#fff", fontSize: "16px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 12px rgba(166, 138, 97, 0.3)" },
  
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", width: "100%", overflowY: "auto", alignContent: "start" },
  previewItem: { width: "100%", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", backgroundColor: colors.border, position: "relative" },
  previewImage: { width: "100%", height: "100%", objectFit: "cover" },

  // オーバーレイUI
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(248, 246, 240, 0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  overlayContent: { backgroundColor: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "80%", maxWidth: "320px" },
  spinner: { width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" },
  overlayText: { fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" },
  overlaySubtext: { fontSize: "12px", color: colors.subtext, margin: 0 },
  progressBarContainer: { width: "100%", height: "6px", backgroundColor: colors.border, borderRadius: "3px", marginTop: "16px", overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: colors.accent, transition: "width 0.3s ease" }
};