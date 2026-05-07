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
    try:
        # タグ情報をJOINして取得
        res = supabase.table("exhibits").select(
            "id, user_id, image_url, text, created_at, exhibit_tags(tags(name))"
        ).order("created_at", desc=True).execute()

        formatted = []
        for row in res.data:
            # ★ 重要：ネストされたタグ情報を ["タグ1", "タグ2"] 形式に整形
            tag_names = []
            exhibit_tags = row.get("exhibit_tags", [])
            if exhibit_tags:
                for et in exhibit_tags:
                    tag_obj = et.get("tags")
                    if tag_obj and "name" in tag_obj:
                        tag_names.append(tag_obj["name"])

            formatted.append({
                "id": str(row["id"]),
                "userId": str(row.get("user_id")),
                "imageUrl": row.get("image_url", ""),
                "memo": row.get("text", ""),
                "tags": tag_names,      # ここを tag_names に変更
                "aiTags": tag_names,    # ここを tag_names に変更
                "date": str(row.get("created_at", ""))[:10],
            })
        return {"photos": formatted}
    except Exception as e:
        print(f"Fetch Error: {e}")
        return {"photos": []}

@app.post("/save")
async def save_exhibit(
    file: UploadFile = File(...),
    text: str = Form(""),
    tags: str = Form("[]"),
    authorization: str = Header(None)
):
    try:
        # 1. ユーザーIDの取得 (UUIDエラー 22P02 の対策)
        auth_token = authorization.split(" ")[1] if authorization else None
        user_info = supabase.auth.get_user(auth_token)
        current_user_id = user_info.user.id # 本物のUUIDを使用
        
        # 2. 画像の読み込みとAI解析
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")
        
        # ★ 引数を1つにして呼び出し
        ai_tags = analyze_image_with_gemini(image_base64)
        print(f"解析成功: {ai_tags}")

        # 3. DB保存 (exhibits)
        # ※画像URLは本来Storageに保存しますが、テスト用にプレースホルダ
        image_url = f"https://your-storage-url.com/{file.filename}" 

        db_res = supabase.table("exhibits").insert({
            "user_id": current_user_id,
            "image_url": image_url,
            "text": text
        }).execute()
        
        exhibit_id = db_res.data[0]["id"]

        # 4. タグの保存ロジック (既存のループ処理をそのまま使用)
        # ai_tags が空でなければ、ここでDBに保存されます
        # ...
        
        return {"status": "success", "id": exhibit_id}
    except Exception as e:
        print(f"致命的なエラー発生: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/collections")
async def get_collections():
    return {"collections": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)