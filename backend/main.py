import os
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

# 別ファイルで作成したAI解析ロジックを読み込み
from gemini_logic import analyze_image_with_gemini, analyze_user_trends_and_title

# .envファイルから環境変数（APIキーやDB接続情報）を読み込む
load_dotenv()[cite: 1]

app = FastAPI()

# --- CORS設定 (フロントエンドからの通信を許可) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase 接続設定 ---
# .env に記載した URL と KEY を使用します
SUPABASE_URL = os.environ.get("SUPABASE_URL")[cite: 1]
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")[cite: 1]

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ 警告: Supabase の接続情報が .env に設定されていません。")
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- リクエストモデルの定義 ---
class TrendRequest(BaseModel):
    tag_history: list[str]

# --- エンドポイントの実装 ---

@app.get("/")
def read_root():
    return {"message": "Henai Zukan Backend API is running"}

@app.post("/api/analyze-trends")
async def get_trends(request: TrendRequest):
    """
    過去のタグ履歴から、AIがユーザーの「称号」と「分析文」を生成する
    """
    try:
        # gemini_logic.py の関数を呼び出し
        result = analyze_user_trends_and_title(request.tag_history)
        return result
    except Exception as e:
        print(f"Error in analyze-trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save")
async def save_exhibit(
    file: UploadFile = File(...),
    text: str = Form(""),
    tags: str = Form(""),
    authorization: str = Header(None)
):
    """
    画像をアップロードし、AIでタグを生成し、Supabaseに一括保存する
    """
    try:
        # 1. 送られてきた画像ファイルを読み込み、Gemini用にBase64変換
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")
        
        # 2. Gemini API を使って AI タグを抽出
        api_key = os.getenv("GEMINI_API_KEY")[cite: 1]
        ai_tags = analyze_image_with_gemini(api_key, image_base64)
        
        # 3. Supabase のデータベース (exhibits テーブル) へ保存
        # データベース担当者が作成したテーブル名・カラム名に合わせています
        db_response = supabase.table("exhibits").insert({
            "description": text,        # ユーザーが入力した説明文
            "user_tags": tags,          # ユーザーが手動で入れたタグ
            "ai_tags": ai_tags,         # AIが自動生成したタグ (今回の目玉機能)
            "created_at": "now()"       # 現在時刻
        }).execute()

        # 4. フロントエンドへ結果を返す
        return {
            "status": "success",
            "ai_tags": ai_tags,
            "data": db_response.data
        }

    except Exception as e:
        print(f"Error in /save: {e}")
        raise HTTPException(status_code=500, detail=f"保存に失敗しました: {str(e)}")

# サーバー起動 (uvicorn main:app --reload で実行可能)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)