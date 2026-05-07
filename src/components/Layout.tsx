// src/components/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useItems } from '../hooks/useItems.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { supabase } from '../lib/supabase.ts';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { photos, collections } = useItems(); 
  const { getToken } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('GUEST');

  const LEFT_FULL   = 220;
  const LEFT_MINI   = 72;
  const RIGHT_WIDTH = 280;

  const BREAK_COLLAPSE_LEFT = 1300;
  const BREAK_CLOSE_RIGHT   = 1000;

  const [userOverride,  setUserOverride]  = useState<boolean | null>(null);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [isRightOpen,   setIsRightOpen]   = useState(true);

  const isLeftCollapsed = userOverride !== null ? userOverride : autoCollapsed;

 useEffect(() => {
  // 共通の更新処理を定義
  const update = async () => {
    // 1. ウィンドウサイズの判定
    const w = window.innerWidth;
    setAutoCollapsed(w < BREAK_COLLAPSE_LEFT);
    setIsRightOpen(w >= BREAK_CLOSE_RIGHT);

    // 2. ログイン状態の確認
    const token = await getToken();
    setIsLoggedIn(!!token);

    // 3. ユーザー情報の取得（Supabase）
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let name = user.user_metadata?.display_name || 'USER';
      const { data: profile } = await supabase.from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
        
      if (profile?.username) name = profile.username;
      setUsername(name);
    }
  };

  // 初回マウント時に実行
  update();

  // 認証状態の変化を監視
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    setIsLoggedIn(!!session);
    update(); // ログイン・ログアウト時にも情報を更新
  });

  // リサイズイベントの登録
  window.addEventListener('resize', update);

  // クリーンアップ処理
  return () => {
    window.removeEventListener('resize', update);
    authListener.subscription.unsubscribe();
  };
}, []); // 空の依存配列でマウント時のみ実行

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

  // ログイン済みの場合は、パスが '/signup' のものを除外する
  const navItems = isLoggedIn
    ? allNavItems.filter(item => item.path !== '/signup' && item.path !== '/login')
    : allNavItems.filter(item => item.path !== '/record');
  // ── ページごとのコンテキストに応じた擬似AI処理 ──
  
  let targetTags: string[] = [];
  let pageContext = "";

  if (location.pathname.startsWith('/photos')) {
    targetTags = photos.flatMap(p => p.tags || []);
    pageContext = "フォト";
  } else if (location.pathname.startsWith('/zukan')) {
    targetTags = collections.flatMap(c => c.aiTags || []);
    pageContext = "図鑑";
  } else {
    targetTags = [
      ...photos.flatMap(p => p.tags || []), 
      ...collections.flatMap(c => c.aiTags || [])
    ];
    pageContext = "全体";
  }

  // 1. タグの出現回数をカウント
  const tagCounts = targetTags.reduce((acc, tag) => {
    const cleanTag = tag.replace(/^#/, "");
    acc[cleanTag] = (acc[cleanTag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 2. グラフ用にデータ配列を作成しソート
  const topTagsData = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // ── 円グラフ描画用の計算 ──
  // アースカラーのグラデーションパレット
  const chartColors = ["#A68A61", "#C2A878", "#8B7355", "#D4C4A8", "#6B5B45"];
  
  // 合計値を計算
  const totalCount = topTagsData.reduce((sum, data) => sum + data.count, 0);

  // CSSの conic-gradient 用の文字列を生成
  let currentPercent = 0;
  const gradientString = topTagsData.map((data, index) => {
    const percent = (data.count / (totalCount || 1)) * 100;
    const color = chartColors[index % chartColors.length];
    const part = `${color} ${currentPercent}% ${currentPercent + percent}%`;
    currentPercent += percent;
    return part;
  }).join(", ");

  // 3. AIサジェスト文の生成
  const topTrend = topTagsData.length > 0 ? topTagsData[0].tag : null;
  const aiSuggestion = topTrend 
    ? `現在の${pageContext}の記録を見ると、「${topTrend}」への関心が特に高まっているようです。過去のアーカイブと組み合わせて、新しい発見を探してみませんか？`
    : `まだ${pageContext}のデータが少ないようです。日常の気になるものを記録して、あなたの偏愛の傾向を分析しましょう。`;

  // 4. 左下のAI称号生成
  const allTagsCounts = [...photos.flatMap(p => p.tags || []), ...collections.flatMap(c => c.aiTags || [])].reduce<Record<string, number>>((acc, tag) => {
    const cleanTag = String(tag).replace(/^#/, "");
    acc[cleanTag] = (acc[cleanTag] || 0) + 1;
    return acc;
  }, {});
  
  const overallTopTags = Object.entries(allTagsCounts as Record<string, number>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => tag);

  const aiTitles = overallTopTags.length >= 2 
    ? [`${overallTopTags[0]}の探求者`, `${overallTopTags[1]}の愛好家`] 
    : ["AIによる称号", "AIによる称号"];

  const profileImageUrl = ""; 

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: fonts.sans,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── 左サイドバー復活ボタン ── */}
      {isLeftCollapsed && (
        <button
          onClick={() => setUserOverride(false)}
          style={{
            position: 'absolute',
            left: `${LEFT_MINI + 16}px`, 
            top: '20px',
            zIndex: 100,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            color: colors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ▶
        </button>
      )}

      {/* ── 1. 左サイドバー ── */}
      <aside style={{
        width: isLeftCollapsed ? `${LEFT_MINI}px` : `${LEFT_FULL}px`,
        borderRight: `1px solid ${colors.border}`,
        padding: '20px 8px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 40,
      }}>

        {/* ヘッダー部分 */}
        <div style={{
          display: 'flex',
          justifyContent: isLeftCollapsed ? 'center' : 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          padding: '0 4px',
          height: '44px',
        }}>
          {isLeftCollapsed ? (
            <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <span style={{ fontSize: '22px' }}>📚</span>
            </Link>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.1em', fontFamily: fonts.serif }}>
                  偏愛図鑑
                </span>
              </Link>
              <button
                onClick={() => setUserOverride(true)}
                title="サイドバーを閉じる"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.subtext, fontSize: '20px', flexShrink: 0 }}
              >
                ◀
              </button>
            </div>
          )}
        </div>

        {/* メニューリスト */}
        <nav style={{ flex: 1, padding: '0 4px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isLeftCollapsed ? 'center' : 'flex-start',
                  gap: isLeftCollapsed ? '0' : '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: isActive ? colors.accent : colors.subtext,
                  backgroundColor: isActive ? 'rgba(166, 138, 97, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                  marginBottom: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</span>
                {!isLeftCollapsed && <span style={{ fontWeight: '500' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* ── アカウント表示部分 ── */}
        <div style={{
          padding: '20px 8px',
          borderTop: `1px solid ${colors.border}`,
          marginTop: '20px',
        }}>
          <Link 
            to="/account" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isLeftCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              marginBottom: isLeftCollapsed ? '0' : '16px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {/* プロフィール画像 */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.border,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <span style={{ fontSize: '20px', color: colors.subtext }}>👤</span>
                )}
              </div>

              {!isLeftCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {username}
                  </div>
                </div>
        )}
            </div>
          </Link>

          {/* isLoggedIn が false の時だけ表示する */}
          {!isLeftCollapsed && !isLoggedIn && (
            <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
              <Link to="/signup" style={{ 
                fontSize: '12px', 
                color: colors.accent, 
                textDecoration: 'none',
                fontWeight: 'bold' 
              }}>
                ✨ 新規登録はこちら
              </Link>
            </div>
          )}

          {/* 称号リスト */}
          {!isLeftCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
              {aiTitles.map((title, i) => (
                <div key={i} style={{ fontSize: '11px', color: colors.subtext }}>
                  {title}
                </div>
              ))}
            </div>
          )}
          {/* ログアウトボタン（ログイン中のみ表示） */}
          {!isLeftCollapsed && isLoggedIn && (
          <button 
            onClick={() => supabase.auth.signOut()}
            style={{
            marginTop: '16px',
            padding: '8px 12px',
            fontSize: '12px',
            color: colors.subtext,
            background: 'none',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
  >         🚪 ログアウト
          </button>
          )}
        </div>
      </aside>

      {/* ── 2. 中央メインコンテンツ ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }}>
        <div style={{
          padding: '40px clamp(20px, 5vw, 60px)',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {children}
        </div>
      </main>

      {/* ── 右サイドバー復活ボタン ── */}
      {!isRightOpen && (
        <button
          onClick={() => setIsRightOpen(true)}
          style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 100,
            background: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}
        >
          ◀
        </button>
      )}

      {/* ── 3. 右サイドバー ── */}
      <aside style={{
        width: isRightOpen ? `${RIGHT_WIDTH}px` : '0px',
        borderLeft: isRightOpen ? `1px solid ${colors.border}` : 'none',
        backgroundColor: 'rgba(248, 246, 240, 0.8)',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}>
        <div style={{ minWidth: `${RIGHT_WIDTH}px`, height: '100%', position: 'relative' }}>
          <button
            onClick={() => setIsRightOpen(false)}
            style={{
              position: 'absolute', top: '20px', left: '16px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.subtext, fontSize: '20px',
            }}
          >
            ▶
          </button>

          <div style={{ padding: '70px 24px 24px' }}>
            
            {/* ── 自分の傾向（円グラフ表示） ── */}
            <section style={{ marginBottom: '40px' }}>
              <h4 style={{ color: colors.subtext, marginBottom: '20px', fontSize: '13px' }}>
                {pageContext}の傾向
              </h4>
              
              {topTagsData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                  
                  {/* 円グラフ（ドーナツチャート） */}
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: `conic-gradient(${gradientString})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}>
                    {/* ドーナツの穴（中央のくり抜き） */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      backgroundColor: colors.bg, // サイドバーの背景と馴染ませる
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, lineHeight: 1, marginBottom: '2px' }}>
                        {totalCount}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.subtext }}>Total</span>
                    </div>
                  </div>

                  {/* 凡例（タグとカウント） */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topTagsData.map((data, index) => (
                      <div key={data.tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: chartColors[index % chartColors.length]
                          }} />
                          <span style={{ color: colors.text, fontWeight: '500' }}>#{data.tag}</span>
                        </div>
                        <span style={{ color: colors.subtext }}>{data.count} 件</span>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <span style={{ fontSize: '12px', color: colors.subtext }}>
                  データ収集中...
                </span>
              )}
            </section>

            {/* ── AIによるサジェスト（動的表示） ── */}
            <section>
              <h4 style={{ color: colors.subtext, marginBottom: '16px', fontSize: '13px' }}>
                AIによるサジェスト
              </h4>
              <div style={{
                fontSize: '12px', color: colors.text,
                backgroundColor: 'white', padding: '16px',
                borderRadius: '12px', border: `1px solid ${colors.border}`,
                lineHeight: '1.6',
              }}>
                {aiSuggestion}
              </div>
            </section>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default Layout;