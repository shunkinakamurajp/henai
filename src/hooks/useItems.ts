import { useState, useEffect } from "react";
import { PhotoMaterial, Collection } from "../types/index";

// 接続先をローカルのPythonサーバーに変更
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 現在のPythonサーバーにはまだ取得用エンドポイントがないため、
      // 起動時のエラーを防ぐために一時的に空配列をセットする運用も可能です
      const [photosRes, collectionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/photos`),
        fetch(`${API_BASE_URL}/collections`),
      ]);

      if (photosRes.ok) setPhotos(await photosRes.json());
      if (collectionsRes.ok) setCollections(await collectionsRes.json());
    } catch (err: any) {
      console.error("データ取得エラー（サーバー未起動の可能性があります）:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pythonサーバーの /save エンドポイントへ送信する関数
  const addPhoto = async (file: File, text: string, tags: string[]) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);
    formData.append("tags", JSON.stringify(tags));

    try {
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("サーバーへの保存に失敗しました");

      const result = await response.json();
      // 保存成功後、最新のデータを再取得して画面を更新
      fetchData();
      return result;
    } catch (err: any) {
      console.error("送信エラー:", err);
      throw err;
    }
  };

  return { photos, collections, loading, error, addPhoto, refetch: fetchData };
};