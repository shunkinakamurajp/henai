import { useState, useEffect, useMemo } from "react";
import { PhotoMaterial, Collection } from "../types/index";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

// --- 修正箇所：ここにあった1回目の宣言を削除しました ---

declare global {
  interface ImportMetaEnv {
    readonly VITE_PYTHON_API_URL?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// 宣言はここ1回だけにします
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

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
        setPhotos([]);
        setCollections([]);
        setCurrentUserId(null);
      } else if (event === 'SIGNED_IN') {
        fetchData();
      }
    });

    const timer = setInterval(() => {
      setPhotos(currentPhotos => {
        const needsUpdate = currentPhotos.some(p => !p.tags || p.tags.length === 0);
        if (needsUpdate) {
          fetchData(true);
        }
        return currentPhotos;
      });
    }, 5000);

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

  const updatePhoto = async (id: string | number, updates: any) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    window.dispatchEvent(new Event('items_updated'));
  };

  return { photos, myPhotos, otherPhotos, currentUserId, collections, loading, error, addPhoto, refetch: fetchData, updatePhoto };
};