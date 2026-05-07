import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SignUp() {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signUp(email, password, username);
    if (res.success) {
      setMessage("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
    } else {
      setMessage("エラー: " + res.error);
    }
  };

  return (
    <div style={S.container}>
      <h1 style={S.title}>新規アカウント作成</h1>
      <form onSubmit={handleSignUp} style={S.form}>
        <input type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} style={S.input} required />
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} style={S.input} required />
        <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} style={S.input} required />
        {message && <p style={S.info}>{message}</p>}
        <button type="submit" disabled={loading} style={S.button}>{loading ? "処理中..." : "登録する"}</button>
      </form>
      <Link to="/login" style={S.link}>ログインはこちら</Link>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F6F0" },
  title: { fontFamily: "serif", fontSize: 24, marginBottom: 24, color: "#3D3328" },
  form: { width: "80%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 16 },
  input: { padding: 12, borderRadius: 8, border: "1px solid #E6E0D4", fontSize: 16 },
  button: { padding: 12, borderRadius: 8, background: "#A68A61", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" },
  info: { fontSize: 12, textAlign: "center", color: "#A68A61", lineHeight: 1.5 },
  link: { marginTop: 16, fontSize: 14, color: "#A39B8B", textDecoration: "none" }
};