// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useItems } from '../hooks/useItems.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { supabase } from '../lib/supabase.ts';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { photos, myPhotos, collections } = useItems(); 
  const { getToken } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('GUEST'); // デフォルトはGUEST
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("書斎の記録を読み解いています...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const LEFT_FULL   = 220;
  const LEFT_MINI   = 72;
  const RIGHT_WIDTH = 280;

  const BREAK_COLLAPSE_LEFT = 1300;
  const BREAK_CLOSE_RIGHT   = 1000;

  // 左サイドバー用
  const [userOverride,  setUserOverride]  = useState<boolean | null>(null);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  
  // ★追加・修正：右サイドバー用（左と同じ仕組みにする）
  const [rightOverride, setRightOverride] = useState<boolean | null>(null);
  const [autoRightOpen, setAutoRightOpen] = useState(true);

  const isLeftCollapsed = userOverride !== null ? userOverride : autoCollapsed;
  const isRightOpen = rightOverride !== null ? rightOverride : autoRightOpen;

  useEffect(() => {
    // 共通の更新処理
    const update = async () => {
      // 1. ウィンドウサイズの判定
      const w = window.innerWidth;
      setAutoCollapsed(w < BREAK_COLLAPSE_LEFT);
      setAutoRightOpen(w >= BREAK_CLOSE_RIGHT);

      // トークンチェック
      const token = await getToken();
      setIsLoggedIn(!!token);

      // ユーザー情報の取得
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
      // display_name を優先して表示
        const name = user.user_metadata?.display_name || 'USER';
        setUsername(name);
      } else {
        setUsername('GUEST');
      }
    };

    update();

    // プロフィール更新イベントを監視
    window.addEventListener('user_profile_updated', update);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUsername('GUEST');
      } else {
        update();
      }
    });

    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('user_profile_updated', update); // クリーンアップ
      authListener.subscription.unsubscribe();
    };
  }, [getToken]);

  const colors = {
    bg:      '#F8F6F0',
    text:    '#3D3328',
    subtext: '#A39B8B',
    accent:  '#A68A61',
    border:  '#E6E0D4',
    card:    '#FCFAEF',
  };

  const fonts = {
    serif: '"Noto Serif JP", "Hiragino Mincho ProN", serif',
    sans:  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
  };

  const allNavItems = [
    { path: '/',            label: 'ホーム',   icon: '🏠' },
    { path: '/photos',      label: 'フォト',   icon: '🖼️' },
    { path: '/zukan',       label: '図鑑',     icon: '📖' },
    { path: '/observation', label: '観測',     icon: '🔭' },
    { path: '/record',      label: '記録する', icon: '✏️' },
    { path: '/signup',      label: '新規登録', icon: '📝' },
    { path: '/login',       label: 'ログイン', icon: '🔑' },
  ];

  // ナビゲーションのフィルタリング
  const navItems = isLoggedIn
    ? allNavItems.filter(item => item.path !== '/signup' && item.path !== '/login')
    : allNavItems.filter(item => item.path !== '/record');

  // ── 統計・AI処理 ──
  const allTags = [...myPhotos.flatMap(p => p.tags || []), ...collections.flatMap(c => c.aiTags || [])];
  const tagCounts = allTags.reduce((acc, tag) => {
    const cleanTag = String(tag).replace(/^#/, "");
    acc[cleanTag] = (acc[cleanTag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTagsData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const chartColors = ["#A68A61", "#C2A878", "#8B7355", "#D4C4A8", "#6B5B45"];
  const totalCount = topTagsData.reduce((sum, data) => sum + data.count, 0);
  let currentPercent = 0;
  const gradientString = topTagsData.map((data, index) => {
    const percent = (data.count / (totalCount || 1)) * 100;
    const color = chartColors[index % chartColors.length];
    const part = `${color} ${currentPercent}% ${currentPercent + percent}%`;
    currentPercent += percent;
    return part;
  }).join(", ");

  // 1. 関数の外、またはコンポーネント内で useRef を定義
const lastAnalyzedCount = React.useRef(0);

// ...

useEffect(() => {
  const fetchAnalysis = async () => {
    // すでに分析中、またはタグの数に変更がない場合は何もしない
    if (isAnalyzing || totalCount === lastAnalyzedCount.current || totalCount < 2) {
      return;
    }

    lastAnalyzedCount.current = totalCount; // 現在の数を記録（リクエスト前にロック）
    setIsAnalyzing(true);

    try {
      const apiUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/analyze-tendency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: topTagsData.map(t => t.tag) }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error("AI分析の取得に失敗:", err);
      // エラー時は記録を戻して、次回再試行できるようにする
      lastAnalyzedCount.current = 0; 
    } finally {
      setIsAnalyzing(false);
    }
  };

  fetchAnalysis();
}, [totalCount]);

  const profileImageUrl = ""; 

  return (
    <div style={{
      display: 'flex', height: '100dvh', width: '100%',
      backgroundColor: colors.bg, color: colors.text,
      fontFamily: fonts.sans, overflow: 'hidden', position: 'relative',
    }}>
      {/* サイドバー復活ボタン */}
      {isLeftCollapsed && (
        <button
          onClick={() => setUserOverride(false)}
          style={{
            position: 'absolute', left: `${LEFT_MINI + 16}px`, top: '20px', zIndex: 100,
            background: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', color: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        > ▶ </button>
      )}

      {/* 右サイドバー復活ボタン */}
      {!isRightOpen && (
        <button
          onClick={() => setRightOverride(true)}
          style={{
            position: 'absolute', right: '20px', top: '20px', zIndex: 100,
            background: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', color: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        > ◀ </button>
      )}

      {/* 1. 左サイドバー */}
      <aside style={{
        width: isLeftCollapsed ? `${LEFT_MINI}px` : `${LEFT_FULL}px`,
        borderRight: `1px solid ${colors.border}`, padding: '20px 8px',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        backgroundColor: colors.bg, overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 40,
      }}>
        <div style={{
          display: 'flex', justifyContent: isLeftCollapsed ? 'center' : 'space-between',
          alignItems: 'center', marginBottom: '40px', padding: '0 4px', height: '44px',
        }}>
          {isLeftCollapsed ? (
            <Link to="/" style={{ textDecoration: 'none' }}><span>📚</span></Link>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px' }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.1em', fontFamily: fonts.serif }}>偏愛図鑑</span>
              </Link>
              <button onClick={() => setUserOverride(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.subtext }}>◀</button>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '0 4px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path} to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: isLeftCollapsed ? 'center' : 'flex-start',
                  gap: isLeftCollapsed ? '0' : '12px', padding: '12px 16px', borderRadius: '12px',
                  textDecoration: 'none', color: isActive ? colors.accent : colors.subtext,
                  backgroundColor: isActive ? 'rgba(166, 138, 97, 0.1)' : 'transparent',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
                {!isLeftCollapsed && <span style={{ fontWeight: '500' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* アカウント表示部分 */}
        <div style={{ padding: '20px 8px', borderTop: `1px solid ${colors.border}`, marginTop: '20px' }}>
          <Link to="/account" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: isLeftCollapsed ? 'center' : 'flex-start',
              gap: '12px', marginBottom: isLeftCollapsed ? '0' : '16px',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profileImageUrl ? <img src={profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px' }}>👤</span>}
              </div>
              {!isLeftCollapsed && <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{username}</div>}
            </div>
          </Link>

          {!isLeftCollapsed && !isLoggedIn && (
            <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
              <Link to="/signup" style={{ fontSize: '12px', color: colors.accent, textDecoration: 'none', fontWeight: 'bold' }}>✨ 新規登録はこちら</Link>
            </div>
          )}

          {!isLeftCollapsed && aiAnalysis && aiAnalysis.includes('：') && (
            <div style={{ paddingLeft: '4px', marginTop: '-8px', marginBottom: '8px' }}>
              <div style={{ 
                fontSize: '11px', 
                color: colors.accent, 
                fontWeight: 'bold',
                letterSpacing: '0.05em' 
              }}>
                {aiAnalysis.split('：')[0].replace(/【|】/g, '')}
              </div>
            </div>
          )}

          {!isLeftCollapsed && isLoggedIn && (
            <button 
              onClick={() => setShowLogoutModal(true)} // ★ 直接 signOut せずモーダルを開く
              style={{
                marginTop: '16px', padding: '8px 12px', fontSize: '12px', color: colors.subtext,
                background: 'none', border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer',
                width: '100%', textAlign: 'left'
              }}
            > 🚪 ログアウト </button>
          )}
        </div>
      </aside>

      {/* 2. メインコンテンツ */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
        <div style={{ padding: '40px clamp(20px, 5vw, 60px)', maxWidth: '1000px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* 3. 右サイドバー */}
      <aside style={{
        width: isRightOpen ? `${RIGHT_WIDTH}px` : '0px',
        borderLeft: isRightOpen ? `1px solid ${colors.border}` : 'none',
        backgroundColor: 'rgba(248, 246, 240, 0.8)',
        flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s ease',
        display: 'flex', flexDirection: 'column', zIndex: 20,
      }}>
        <div style={{ minWidth: `${RIGHT_WIDTH}px`, height: '100%', position: 'relative', padding: '70px 24px 24px' }}>
          <button onClick={() => setRightOverride(false)} style={{ position: 'absolute', top: '20px', left: '16px', background: 'none', border: 'none', cursor: 'pointer', color: colors.subtext }}>▶</button>
          
          <section style={{ marginBottom: '40px' }}>
            <h4 style={{ color: colors.subtext, marginBottom: '20px', fontSize: '13px' }}>記録の傾向</h4>
            {topTagsData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: `conic-gradient(${gradientString})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalCount}</span>
                    <span style={{ fontSize: '10px' }}>Total</span>
                  </div>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topTagsData.map((data, i) => (
                    <div key={data.tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: chartColors[i % chartColors.length] }} />
                        <span style={{ fontWeight: '500' }}>#{data.tag}</span>
                      </div>
                      <span>{data.count} 件</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <span style={{ fontSize: '12px', color: colors.subtext }}>データ収集中...</span>}
          </section>

          <section>
            <h4 style={{ color: colors.subtext, marginBottom: '16px', fontSize: '13px' }}>AI傾向分析</h4>
            <div style={{ 
              fontSize: '12px', backgroundColor: 'white', padding: '18px', 
              borderRadius: '16px', border: `1px solid ${colors.border}`, 
              lineHeight: '1.8', minHeight: '80px',
              transition: 'all 0.3s', opacity: isAnalyzing ? 0.6 : 1
            }}>
            {isAnalyzing ? (
              <div style={{ textAlign: 'center', color: colors.subtext }}>司書が思索に耽っています...</div>
            ) : (
            <>
            {/* 「：」がある場合は称号として強調表示する */}
            {aiAnalysis && aiAnalysis.includes('：') ? (
            <>
            <div style={{ fontWeight: 'bold', color: colors.accent, marginBottom: '6px', fontSize: '14px' }}>
              {aiAnalysis.split('：')[0].replace(/【|】/g, '')}
            </div>
            <div style={{ color: colors.text }}>{aiAnalysis.split('：')[1]}</div>
            </>
            ) : (
            <div>{aiAnalysis}</div>
            )}
            </>
            )}
            </div>
          </section>
        </div>
      </aside>

      {/* 3. ★ ログアウト確認モーダル (最下部に追加) */}
      {showLogoutModal && (
        <div 
          onClick={() => setShowLogoutModal(false)} 
          style={{ 
            position: "fixed", inset: 0, zIndex: 2000, 
            background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", 
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              background: colors.bg, borderRadius: "20px", padding: "32px", 
              width: "340px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", 
              border: `1px solid ${colors.border}`, fontFamily: fonts.sans 
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🕯️</div>
            <h3 style={{ fontFamily: fonts.serif, fontSize: "18px", marginBottom: "12px", color: colors.text }}>
              書斎を後にしますか？
            </h3>
            <p style={{ fontSize: "13px", color: colors.subtext, lineHeight: "1.6", marginBottom: "28px" }}>
              ログアウトすると、次回の閲覧には<br />再ログインが必要になります。
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={() => setShowLogoutModal(false)} 
                style={{ 
                  flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${colors.border}`, 
                  background: "#fff", color: colors.subtext, fontSize: "14px", cursor: "pointer", fontWeight: "bold" 
                }}
              >
                とどまる
              </button>
              <button 
                onClick={() => {
                  supabase.auth.signOut();
                  setShowLogoutModal(false);
                }} 
                style={{ 
                  flex: 1, padding: "12px", borderRadius: "12px", border: "none", 
                  background: "#d9534f", color: "#fff", fontSize: "14px", cursor: "pointer", fontWeight: "bold" 
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;