import { useState } from "react";
import { supabase } from "../lib/supabase";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  // ログイン
  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session };
  };

  // ★ アカウント作成（新規追加）
  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    // 1. Supabase Auth にユーザーを登録
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username }, // メタデータにユーザー名を保存
      },
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    // 2. プロフィールテーブル(profiles)にユーザー情報を登録（ER図の定義に合わせる）
    if (data.user) {
      const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ 
        id: data.user.id, 
        username: username, // ※ DBのカラム名が "name" ならここを name に変更してください
      }, {
        onConflict: 'id' // idが重複した場合は更新する
      });
    
    if (profileError) {
      console.error("Profile Error Detail:", profileError); // デバッグ用に詳細を表示
      setLoading(false);
      return { success: false, error: "プロフィール作成に失敗しました" };
    }
  }

  setLoading(false);
  return { success: true };
};

  const logout = async () => { await supabase.auth.signOut(); };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return { login, signUp, logout, getToken, loading };
};