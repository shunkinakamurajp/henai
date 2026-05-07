import os
import base64
import uuid
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client

# AI解析ロジックのインポート
from gemini_logic import analyze_image_with_gemini

load_dotenv()

app = FastAPI()

# --- CORS設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase 接続設定 ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/photos")
async def get_photos():
    """
    データベースから画像一覧を取得し、Reactが期待する形式に整形する
    """
    try:
        # exhibitsテーブルから、中間テーブル経由でタグ名(name)をJOINして取得
        res = supabase.table("exhibits").select(
            "id, user_id, image_url, text, created_at, exhibit_tags(tags(name))"
        ).execute()

        formatted = []
        for row in res.data:
            # ネストされたタグ情報をリスト形式に変換
            tags = [et["tags"]["name"] for et in row.get("exhibit_tags", []) if et.get("tags")]
            formatted.append({
                "id": str(row["id"]),
                "userId": str(row.get("user_id")),
                "imageUrl": row.get("image_url", ""),
                "memo": row.get("text", ""),
                "tags": tags,
                "aiTags": tags,
                "date": str(row.get("created_at", ""))[:10],
            })
        return {"photos": formatted}
    except Exception as e:
        print(f"Fetch Error: {e}")
        return {"photos": []}

@app.get("/collections")
async def get_collections():
    return {"collections": []}

@app.post("/save")
async def save_exhibit(
    file: UploadFile = File(...),
    text: str = Form(""),
    tags: str = Form("[]"),
    authorization: str = Header(None)
):
    """
    1. imagesバケットへ保存 -> 2. Gemini解析 -> 3. exhibits登録 -> 4. タグの紐付け
    """
    try:
        # 1. ユーザー認証の検証
        if not authorization:
            raise HTTPException(status_code=401, detail="ログインが必要です")
        token = authorization.replace("Bearer ", "")
        user_info = supabase.auth.get_user(token)
        current_user_id = user_info.user.id

        # 2. Supabase Storage (imagesバケット) へのアップロード
        contents = await file.read()
        file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
        file_path = f"{uuid.uuid4()}.{file_ext}"
        
        # バケット名を "images" に設定
        supabase.storage.from_("images").upload(file_path, contents)
        image_url = supabase.storage.from_("images").get_public_url(file_path)

        # 3. Gemini API で画像からタグを抽出
        image_base64 = base64.b64encode(contents).decode("utf-8")
        api_key = os.getenv("GEMINI_API_KEY")
        ai_tags = analyze_image_with_gemini(api_key, image_base64)

        try:
            user_tags_list = json.loads(tags)
        except:
            user_tags_list = []
        all_tags = list(set(ai_tags + user_tags_list))

        # 4. exhibits テーブルへのレコード挿入
        db_res = supabase.table("exhibits").insert({
            "user_id": current_user_id,
            "image_url": image_url,
            "text": text
        }).execute()
        
        if not db_res.data:
            raise Exception("exhibitsテーブルへの保存に失敗しました")
        exhibit_id = db_res.data[0]["id"]

        # 5. tagsテーブルと中間テーブルへの登録
        for t_name in all_tags:
            if not t_name: continue
            
            # 既存タグの確認
            tag_data = supabase.table("tags").select("id").eq("name", t_name).execute()
            if not tag_data.data:
                new_tag = supabase.table("tags").insert({"name": t_name}).execute()
                tag_id = new_tag.data[0]["id"]
            else:
                tag_id = tag_data.data[0]["id"]

            # 画像とタグを中間テーブルで紐付け
            supabase.table("exhibit_tags").insert({
                "exhibit_id": exhibit_id,
                "tag_id": tag_id
            }).execute()

        return {"status": "success", "id": exhibit_id, "ai_tags": ai_tags}

    except Exception as e:
        print(f"Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)