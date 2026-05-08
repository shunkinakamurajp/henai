import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js"; // 型定義を追加

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null); // ★現在のユーザー状態を保持

  // ★ 認証状態を監視するエフェクトを追加
  useEffect(() => {
    // 1. 初回マウント時に現在のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. ログイン・ログアウトなどの状態変化をリッスンする
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null); // 状態が変わるたびに user を更新
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ログイン
  const login = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true, session: data.session };
  };

  // アカウント作成
  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username },
      },
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: data.user.id, 
          username: username,
        }, {
          onConflict: 'id'
        });
    
      if (profileError) {
        console.error("Profile Error Detail:", profileError);
        setLoading(false);
        return { success: false, error: "プロフィール作成に失敗しました" };
      }
    }

    setLoading(false);
    return { success: true };
  };

  const logout = async () => { 
    await supabase.auth.signOut(); 
    setUser(null); // 明示的にnullにする
  };

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  // ★ user を戻り値に追加
  return { user, login, signUp, logout, getToken, loading };
};