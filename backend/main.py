import os
import base64
import uuid
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from gemini_logic import analyze_image_with_gemini

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/collections")
async def get_collections():
    # まだ実装していない場合は、とりあえず空リストを返すことで 404 を防ぎます
    return {"collections": []}

@app.get("/photos")
async def get_photos():
    try:
        # 確実にタグを取得するためのセレクト文
        # リレーション名が 'exhibit_tags' であることを確認してください
        res = supabase.table("exhibits").select(
            "id, user_id, image_url, text, created_at, exhibit_tags(tags(name))"
        ).order("created_at", desc=True).execute()

        # デバッグ用：Supabaseから届いた生のデータ構造をターミナルに表示
        # タグが出ない原因が「リレーション名の不一致」なら、ここで空のデータが見えるはずです
        if res.data:
            print(f"Debug Raw Data (Row 0): {res.data[0]}")

        formatted = []
        for row in res.data:
            tag_names = []
            # exhibit_tags が取得できているか確認
            ex_tags = row.get("exhibit_tags")
            if ex_tags and isinstance(ex_tags, list):
                for et in ex_tags:
                    # tagsテーブルのnameを取り出す
                    tag_obj = et.get("tags")
                    if tag_obj and "name" in tag_obj:
                        tag_names.append(tag_obj["name"])

            formatted.append({
                "id": str(row["id"]),
                "userId": str(row.get("user_id")),
                "imageUrl": row.get("image_url", ""),
                "memo": row.get("text", ""),
                "tags": tag_names,
                "aiTags": tag_names,
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
    print("\n--- 保存プロセス開始 ---")
    try:
        # 1. ユーザーID取得
        auth_token = authorization.split(" ")[1] if authorization else None
        user_res = supabase.auth.get_user(auth_token)
        current_user_id = user_res.user.id
        print(f"UserID: {current_user_id}")

        # 2. 画像保存
        contents = await file.read()
        file_path = f"{uuid.uuid4()}.jpg"
        supabase.storage.from_("images").upload(file_path, contents)
        image_url = supabase.storage.from_("images").get_public_url(file_path)
        print(f"ImageURL: {image_url}")

        # 3. AI解析呼び出し
        image_base64 = base64.b64encode(contents).decode("utf-8")
        ai_tags = analyze_image_with_gemini(image_base64)
        print(f"AI解析結果: {ai_tags}")

        # 4. exhibitレコード作成
        db_res = supabase.table("exhibits").insert({
            "user_id": current_user_id,
            "image_url": image_url,
            "text": text
        }).execute()
        
        exhibit_id = db_res.data[0]["id"]
        print(f"Exhibit作成完了 ID: {exhibit_id}")

        # 5. タグ保存ループ (ここが動いているかチェック)
        if not ai_tags:
            print("警告: AIタグが空のため、タグ保存をスキップします。")

        for t_name in ai_tags:
            print(f"処理中のタグ: {t_name}")
            # タグの存在確認
            tag_data = supabase.table("tags").select("id").eq("name", t_name).execute()
            
            if not tag_data.data:
                print(f"新規タグとして登録: {t_name}")
                new_tag = supabase.table("tags").insert({"name": t_name}).execute()
                tag_id = new_tag.data[0]["id"]
            else:
                tag_id = tag_data.data[0]["id"]
            
            # 中間テーブル紐付け
            print(f"中間テーブルに紐付け試行: exhibit:{exhibit_id}, tag:{tag_id}")
            link_res = supabase.table("exhibit_tags").insert({
                "exhibit_id": exhibit_id,
                "tag_id": tag_id
            }).execute()
            print(f"紐付け結果: {link_res.data}")

        print("--- 保存プロセス完了 ---\n")
        return {"status": "success"}

    except Exception as e:
        print(f"！！！致命的なエラー発生！！！: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 開発時は全て許可。本番はVercelのURLを指定するのが安全
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
