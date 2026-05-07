import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await login(email, password);
    if (res.success) {
      navigate("/photos"); // ログイン成功時に一覧画面へ
    } else {
      setError(res.error || "ログインに失敗しました");
    }
  };

  return (
    <div style={S.container}>
      <h1 style={S.title}>偏愛図鑑</h1>
      <form onSubmit={handleLogin} style={S.form}>
        <input 
          type="email" placeholder="メールアドレス" value={email}
          onChange={(e) => setEmail(e.target.value)} style={S.input} required
        />
        <input 
          type="password" placeholder="パスワード" value={password}
          onChange={(e) => setPassword(e.target.value)} style={S.input} required
        />
        {error && <p style={S.error}>{error}</p>}
        <button type="submit" disabled={loading} style={S.button}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '14px', color: '#A39B8B' }}>アカウントをお持ちでない方は </span>
        <Link to="/signup" style={{ fontSize: '14px', color: '#A68A61', fontWeight: 'bold', textDecoration: 'none' }}>
          新規登録
        </Link>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  container: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F6F0" },
  title: { fontFamily: "serif", fontSize: 32, marginBottom: 24, color: "#3D3328" },
  form: { width: "80%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 16 },
  input: { padding: 12, borderRadius: 8, border: "1px solid #E6E0D4", fontSize: 16 },
  button: { padding: 12, borderRadius: 8, background: "#A68A61", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" },
  error: { color: "red", fontSize: 12, textAlign: "center" }
};