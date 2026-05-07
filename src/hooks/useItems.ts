import { useState, useEffect } from 'react';
import { PhotoMaterial, Collection } from '../types';

// .env ファイルから Supabase の環境変数を読み込む
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE_URL = `${SUPABASE_URL}/rest/v1`;

// REST API 用の共通ヘッダー
const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // データベースから情報を取得する関数
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Promise.all で photos と collections を並列取得（パフォーマンス向上）
      const [photosRes, collectionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/photos?select=*`, { headers }),
        fetch(`${API_BASE_URL}/collections?select=*`, { headers })
      ]);

      if (!photosRes.ok) throw new Error(`写真の取得に失敗しました: ${photosRes.status}`);
      if (!collectionsRes.ok) throw new Error(`コレクションの取得に失敗しました: ${collectionsRes.status}`);

      const photosData = await photosRes.json();
      const collectionsData = await collectionsRes.json();

      // データが空の場合の安全対策（APIがエラーではなくnullを返した場合に備えてフォールバック）
      setPhotos(photosData || []);
      setCollections(collectionsData || []);
    } catch (err: any) {
      console.error('データの取得に失敗しました:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にデータを取得
  useEffect(() => {
    fetchData();
  }, []);

  // --- データの追加・更新処理 ---

  // 新しい写真を追加する関数
  const addPhoto = async (newPhoto: Omit<PhotoMaterial, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/photos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newPhoto)
      });
      if (!res.ok) throw new Error('写真の追加に失敗しました');
      
      const data = await res.json();
      // 画面の表示を即座に更新する
      setPhotos(prev => [...prev, ...data]);
      return { success: true, data };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // 新しいコレクションを追加する関数
  const addCollection = async (newCollection: Omit<Collection, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newCollection)
      });
      if (!res.ok) throw new Error('コレクションの追加に失敗しました');
      
      const data = await res.json();
      setCollections(prev => [...prev, ...data]);
      return { success: true, data };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // コレクションの情報を更新する関数
  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('コレクションの更新に失敗しました');
      
      const data = await res.json();
      // 更新されたIDに一致するstateのデータだけを上書き
      setCollections(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      return { success: true, data };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  return { 
    photos, 
    collections, 
    loading, 
    error, 
    refetch: fetchData, // 任意のタイミングで再取得できるようにエクスポート
    addPhoto,
    addCollection,
    updateCollection
  };
};