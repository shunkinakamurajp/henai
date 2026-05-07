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
      const token = await getToken();
      setIsAuthenticated(!!token);
    };
    checkUser();
  }, [getToken]);

  // 認証状態の確認が終わるまで何も表示しない（リダイレクトのチラつき防止）
  if (isAuthenticated === null) return null;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* HOME（/）をログインなしで見れるようにしたい場合は、
            以下を element={<Home />} に書き換えてください 
          */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
          />
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} /> 
          
          <Route path="/photos" element={<Photos />} />
          <Route path="/observation" element={<Observation />} />
          <Route path="/zukan" element={<Zukan />} />
          <Route path="/record" element={<Record />} />
          <Route path="/account" element={<Account />} />
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;