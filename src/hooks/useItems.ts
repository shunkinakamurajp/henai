import { useState, useEffect } from 'react';
import { PhotoMaterial, Collection } from '../types/index.ts';
import initialData from '../data.json'; // 初期データ[cite: 1]

export const useItems = () => {
  const [photos, setPhotos] = useState<PhotoMaterial[]>(initialData.photos ?? []);
  const [collections, setCollections] = useState<Collection[]>(initialData.collections ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログインユーザーID (ハッカソン用。将来は認証システムから取得)[cite: 1, 7]
  const currentUserId = "u1"; 

  // --- DB/API連携の準備 ---
  useEffect(() => {
    // 実際のAPIがある場合はここでfetchを行う[cite: 3, 5, 8]
    // const fetchData = async () => { ... };
    // fetchData();
  }, []);

  // --- ユーザー識別によるフィルタリング ---
  // 自分のデータのみ（Photos, Zukan, Layoutの分析用）[cite: 5, 7, 9, 10]
  const myPhotos = photos.filter(p => String(p.userId) === currentUserId);
  
  // 自分以外のデータ（Observationの観測用）[cite: 4, 14]
  const othersPhotos = photos.filter(p => String(p.userId) !== currentUserId);

  const addPhoto = (newPhoto: PhotoMaterial) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const updatePhoto = (id: string | number, patch: Partial<PhotoMaterial>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  return {
    photos,
    collections,
    myPhotos,
    othersPhotos,
    currentUserId,
    loading,
    error,
    addPhoto,
    updatePhoto,
  };
};