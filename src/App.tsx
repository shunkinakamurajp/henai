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

function App() {
  const { getToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await getToken();
        // デバッグ用：トークンが正しく取得できているかコンソールで確認してください
        console.log("Auth Check - Token found:", !!token);
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error("Auth Check Error:", error);
        setIsAuthenticated(false);
      }
    };
    checkUser();
  }, [getToken]);

  // 認証状態が確定するまで（nullの間）は、何も描画せずに待機する
  if (isAuthenticated === null) {
    return null; 
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* ログイン済みなら Home、未ログインなら Login へ飛ばす
            もし「ログインなしでもホームを見せたい」場合は、
            element={<Home />} に書き換えてください。
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

          {/* 定義されていないパスに来たらホームにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;