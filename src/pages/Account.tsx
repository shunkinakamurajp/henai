// src/pages/Account.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";

const colors = {
  bg: "#F8F6F0",
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  card: "#FFFFFF",
  innerCard: "#FCFAEF",
};

const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
};

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ★ モーダル表示管理
  
  const [profileData, setProfileData] = useState({
    name: "標本収集家",
    imageUrl: "",
    email: "",
  });

  const [editForm, setEditForm] = useState(profileData);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = {
          name: user.user_metadata?.display_name || "標本収集家",
          imageUrl: user.user_metadata?.avatar_url || "",
          email: user.email || "",
        };
        setProfileData(data);
        setEditForm(data);
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: editForm.name, avatar_url: editForm.imageUrl }
      });
      if (!error) {
        setProfileData(editForm);
        window.dispatchEvent(new Event('user_profile_updated'));
      }
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return null;

  return (
    <div style={{ fontFamily: fonts.sans, color: colors.text, maxWidth: "600px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px" }}>
        <h2 style={{ fontFamily: fonts.serif, fontSize: "28px", fontWeight: "bold", borderBottom: `1px solid ${colors.accent}`, paddingBottom: "12px" }}>
          個人設定
        </h2>
      </header>

      {/* プロフィール編集エリア */}
      <div style={{ background: colors.card, borderRadius: "16px", border: `1px solid ${colors.border}`, padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {/* ... (既存のプロフィール画像・表示名表示部分はそのまま) ... */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div 
            onClick={isEditing ? () => {
              const url = prompt("画像URLを入力してください", editForm.imageUrl);
              if (url !== null) setEditForm(prev => ({ ...prev, imageUrl: url }));
            } : undefined}
            style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: colors.innerCard, border: `2px solid ${colors.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", cursor: isEditing ? "pointer" : "default", position: "relative" }}
          >
            {editForm.imageUrl ? <img src={editForm.imageUrl} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "40px" }}>👤</span>}
            {isEditing && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>変更</div>}
          </div>
          <span style={{ fontSize: "12px", color: colors.subtext }}>{profileData.email}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: colors.subtext, marginBottom: "8px" }}>表示名</label>
            {isEditing ? (
              <input name="name" value={editForm.name} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `1px solid ${colors.border}`, outline: "none", backgroundColor: colors.innerCard }} />
            ) : (
              <div style={{ fontSize: "20px", fontWeight: "bold", fontFamily: fonts.serif }}>{profileData.name}</div>
            )}
          </div>
          <div style={{ paddingTop: "16px", display: "flex", justifyContent: "center" }}>
            <button onClick={handleEditToggle} style={{ padding: "10px 32px", borderRadius: "999px", border: isEditing ? "none" : `1px solid ${colors.accent}`, background: isEditing ? colors.accent : "transparent", color: isEditing ? "#fff" : colors.accent, fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
              {isEditing ? "変更を保存する" : "プロフィールを編集"}
            </button>
          </div>
        </div>
      </div>

      {/* 詳細設定エリア */}
      <div style={{ marginTop: "40px", padding: "0 16px" }}>
        <h3 style={{ fontSize: "14px", color: colors.subtext, marginBottom: "16px", fontWeight: "bold" }}>詳細設定</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", padding: "12px 0", borderBottom: `1px solid ${colors.border}` }}>
            <span>通知設定</span>
            <span style={{ color: colors.subtext }}>未設定 ＞</span>
          </div>
          
          <div 
            onClick={() => setShowLogoutModal(true)} // ★ window.confirm をやめてモーダルを開く
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", padding: "12px 0", borderBottom: `1px solid ${colors.border}`, color: "#d9534f", cursor: "pointer" }}
          >
            <span>ログアウト</span>
            <span>🚪</span>
          </div>
        </div>
      </div>

      {/* ★ カスタム確認ダイアログ */}
      {showLogoutModal && (
        <div onClick={() => setShowLogoutModal(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: colors.bg, borderRadius: "20px", padding: "32px", width: "340px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🕯️</div>
            <h3 style={{ fontFamily: fonts.serif, fontSize: "18px", marginBottom: "12px", color: colors.text }}>書斎を後にしますか？</h3>
            <p style={{ fontSize: "13px", color: colors.subtext, lineHeight: "1.6", marginBottom: "28px" }}>
              ログアウトすると、次回の閲覧には<br />再ログインが必要になります。
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${colors.border}`, background: "#fff", color: colors.subtext, fontSize: "14px", cursor: "pointer", fontWeight: "bold" }}>
                とどまる
              </button>
              <button onClick={handleLogout} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#d9534f", color: "#fff", fontSize: "14px", cursor: "pointer", fontWeight: "bold" }}>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;