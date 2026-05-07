import { useState, useEffect } from "react";
import { PhotoMaterial, Collection } from "../types";

const API_BASE_URL = "https://henaizukan-database.onrender.com";

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
      const [photosRes, collectionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/photos`),
        fetch(`${API_BASE_URL}/collections`),
      ]);

      if (!photosRes.ok) {
        throw new Error(`写真の取得に失敗しました: ${photosRes.status}`);
      }

      if (!collectionsRes.ok) {
        throw new Error(`コレクションの取得に失敗しました: ${collectionsRes.status}`);
      }

      const photosData = await photosRes.json();
      const collectionsData = await collectionsRes.json();

      setPhotos(photosData.photos || []);
      setCollections(collectionsData.collections || []);
    } catch (err: any) {
      console.error("データの取得に失敗しました:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初回マウント時にデータを取得
  useEffect(() => {
    fetchData();
  }, []);

  // 新しい写真を追加する関数
  const addPhoto = async (
    selectedFile: File,
    text: string,
    tags: string[] = [],
    token?: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("text", text);
      formData.append("tags", tags.join(","));

      const res = await fetch(`${API_BASE_URL}/save`, {
        method: "POST",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`写真の追加に失敗しました: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      await fetchData();

      return { success: true, data };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // 新しいコレクションを追加する関数
  const addCollection = async (
    newCollection: Omit<Collection, "id" | "authorId" | "createdAt"> & {
      imageIds: string[];
    },
    token?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: newCollection.title,
          content: newCollection.content,
          thumbnailUrl: newCollection.thumbnailUrl,
          imageIds: newCollection.imageIds,
          aiTags: newCollection.aiTags || [],
        }),
      });

      if (!res.ok) {
        throw new Error(`コレクションの追加に失敗しました: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      await fetchData();

      return { success: true, data };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // コレクション更新APIはまだFastAPI側に未実装なので一旦未対応
  const updateCollection = async () => {
    return {
      success: false,
      error: "updateCollection は現在バックエンド未実装です。",
    };
  };

  return {
    photos,
    collections,
    loading,
    error,
    refetch: fetchData,
    addPhoto,
    addCollection,
    updateCollection,
  };
};