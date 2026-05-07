// src/pages/Account.tsx
import React, { useState } from "react";

// カラーパレットとフォント設定（Layout.tsxと共通）
const colors = {
  bg: "#F8F6F0",
  text: "#3D3328",
  subtext: "#A39B8B",
  accent: "#A68A61",
  border: "#E6E0D4",
  card: "#FCFAEF",
  btnText: "#FFFFFF",
};

const fonts = {
  serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
  sans: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
};

const Account = () => {
  // ── 状態管理（モックデータ） ──
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "NAME",
    imageUrl: "", // 初期状態は空（アイコン表示）
  });

  const [editForm, setEditForm] = useState(profileData);

  // ── ハンドラー ──
  const handleEditToggle = () => {
    if (isEditing) {
      // 保存処理（実際はここでAPIを叩く）
      setProfileData(editForm);
    } else {
      // 編集開始時に現在のデータをフォームにセット
      setEditForm(profileData);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    // 実際はファイル選択ダイアログを開き、プレビューを表示する処理
    // ここでは簡易的にプロンプトでURLを入力させる
    const url = prompt(
      "画像URLを入力してください（クリアする場合はキャンセルまたは空欄）",
      editForm.imageUrl,
    );
    if (url !== null) {
      setEditForm((prev) => ({ ...prev, imageUrl: url }));
    }
  };

  return (
    <div style={{ fontFamily: fonts.sans, color: colors.text }}>
      <h2
        style={{
          fontFamily: fonts.serif,
          borderBottom: `1px solid ${colors.accent}`,
          paddingBottom: "8px",
          marginBottom: "32px",
        }}
      >
        アカウント
      </h2>
    </div>
  );
};

export default Account;
