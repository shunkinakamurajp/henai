import { useState, useEffect, useMemo } from "react";
import { PhotoMaterial, Collection } from "../types/index";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

const API_BASE_URL = "http://localhost:8000";

/**
 * データの取得と「自分/他者」のフィルタリングを一括管理するカスタムフック
 */
export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Supabase Auth から現在のユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // 2. バックエンドから全データを取得
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
      console.error("データの読み込みに失敗しました:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 自分自身の投稿のみ (Home, Photos, Zukan用)
  const myPhotos = useMemo(() => 
    photos.filter(p => String(p.userId) === currentUserId), 
  [photos, currentUserId]);

  // 自分以外の投稿のみ (Observation用)
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
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const result = await response.json();
      await fetchData(); 
      return result;
    } catch (err: any) {
      console.error("アップロードエラー:", err);
      throw err;
    }
  };

  const updatePhoto = async (id: string | number, updates: Partial<PhotoMaterial>) => {
    // 現在はフロントのみ。必要に応じてAPI実装
    console.log(`写真(ID: ${id})の更新予約:`, updates);
  };

  return { 
    photos, 
    myPhotos, 
    otherPhotos, 
    currentUserId, 
    collections, 
    loading, 
    error, 
    addPhoto, 
    updatePhoto, 
    refetch: fetchData 
  };
};