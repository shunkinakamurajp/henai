import { useState, useEffect } from "react";
import { PhotoMaterial, Collection } from "../types/index";
import { useAuth } from "./useAuth";

const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
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

  const addPhoto = async (file: File, text: string, tags: string[]) => {
    const token = await getToken();
    if (!token) throw new Error("セッションが切れています。再ログインしてください。");

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
        throw new Error(errorData.detail || "サーバーでの保存に失敗しました");
      }

      const result = await response.json();
      await fetchData(); // 最新のリストに更新
      return result;
    } catch (err: any) {
      console.error("アップロードエラー:", err);
      throw err;
    }
  };

  const updatePhoto = async (id: string | number, updates: Partial<PhotoMaterial>) => {
    console.log(`写真(ID: ${id})の更新予約:`, updates);
  };

  return { photos, collections, loading, error, addPhoto, updatePhoto, refetch: fetchData };
};