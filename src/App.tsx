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
import { supabase } from "./lib/supabase.ts";

function App() {
  const { getToken } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await getToken();
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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

  if (isAuthenticated === null) return null;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* ホーム画面（既存のガード） */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
          />
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} /> 
          
          {/* ★ ログイン必須ページにガードを適用 */}
          <Route 
            path="/photos" 
            element={isAuthenticated ? <Photos /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/zukan" 
            element={isAuthenticated ? <Zukan /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/record" 
            element={isAuthenticated ? <Record /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/account" 
            element={isAuthenticated ? <Account /> : <Navigate to="/login" replace />} 
          />

          {/* ログインなしでも見れるページ */}
          <Route path="/observation" element={<Observation />} />
          <Route path="/user/:userId" element={<UserProfile />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;