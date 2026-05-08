import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebaseプロジェクトの設定
// （値はFirebaseコンソールの「プロジェクトの設定」から取得できます）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Firestoreのデータベースインスタンス（db）をエクスポート
export const db = getFirestore(app);