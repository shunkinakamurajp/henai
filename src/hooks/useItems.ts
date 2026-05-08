import { useState, useEffect, useMemo } from "react";
import { PhotoMaterial, Collection } from "../types/index";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

const API_BASE_URL = "http://localhost:8000";

export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const [photosRes, collectionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/photos`),
        fetch(`${API_BASE_URL}/collections`),
      ]);

      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data.photos || []);
      }
      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        setCollections(data.collections || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // 初回ロード

    const handleItemsUpdated = () => {
      fetchData(true);
    };
    window.addEventListener('items_updated', handleItemsUpdated);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setPhotos([]);      // 写真データを空にする
        setCollections([]); // 図鑑データを空にする
        setCurrentUserId(null); // ユーザーIDを消す
      } else if (event === 'SIGNED_IN') {
        fetchData(); // ログインしたら即座に取得
      }
    });
    // 5秒おきに裏側でチェック
    const timer = setInterval(() => {
      setPhotos(currentPhotos => {
        const needsUpdate = currentPhotos.some(p => !p.tags || p.tags.length === 0);
        if (needsUpdate) {
          fetchData(true); // silentモードで更新
        }
        return currentPhotos;
      });
    }, 5000);

    // ★修正：return ブロック（ {} ）で囲んで両方実行されるようにしました
    return () => {
      clearInterval(timer);
      window.removeEventListener('items_updated', handleItemsUpdated);
    };
  }, []);

  const myPhotos = useMemo(() => 
    photos.filter(p => String(p.userId) === currentUserId), 
  [photos, currentUserId]);

  const otherPhotos = useMemo(() => 
    photos.filter(p => String(p.userId) !== currentUserId), 
  [photos, currentUserId]);

  const addPhoto = async (file: File, text: string, tags: string[]) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);
    formData.append("tags", JSON.stringify(tags));

    try {
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("アップロード失敗");
      await fetchData(true); 
      return await response.json();
    } catch (err: any) {
      throw err;
    }
  };

  // ★追加：テキスト編集などの際に呼ばれる更新用関数
  const updatePhoto = async (id: string | number, updates: any) => {
    // 画面上の State を即座に更新する
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    // サイドメニュー等の統計に更新を通知
    window.dispatchEvent(new Event('items_updated'));

    // ※将来的にバックエンド（DB）も更新する場合は、ここに fetch 処理を追加します
  };

  // ★追加：return の最後に updatePhoto を含める
  return { photos, myPhotos, otherPhotos, currentUserId, collections, loading, error, addPhoto, refetch: fetchData, updatePhoto };
};