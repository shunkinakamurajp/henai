import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import Photos from "./pages/Photos.tsx";
import Observation from "./pages/Observation.tsx";
import Zukan from "./pages/Zukan.tsx";
import Record from "./pages/Record.tsx";
import Account from "./pages/Account.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { supabase } from "./lib/supabase.ts"; // 追加

function App() {
  const { getToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. 現在のトークンをチェックする関数
    const checkUser = async () => {
      try {
        const token = await getToken();
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      }
    };

    // 初回チェック
    checkUser();

    // 2. ★ 認証状態の変化をリアルタイムに監視するリスナーを追加
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("App Auth Event:", event);
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [getToken]);

  // 認証状態が確定するまで待機（nullの時は何も表示しない）
  if (isAuthenticated === null) return null;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* isAuthenticated が true に更新されていれば Home が表示されます。
            もしどうしても飛ばされる場合は、一旦ここを element={<Home />} にして
            動作確認をしてみてください。
          */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
          />
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} /> 
          
          <Route path="/photos" element={<Photos />} />
          <Route path="/observation" element={<Observation />} />
          <Route path="/zukan" element={<Zukan />} />
          <Route path="/record" element={<Record />} />
          <Route path="/account" element={<Account />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;