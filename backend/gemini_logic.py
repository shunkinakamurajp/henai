import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def analyze_image_with_gemini(image_data_base64):
    print("--- Gemini解析プロセス開始 ---")
    
    # --- 使えるモデル名を自動で特定する ---
    target_model = None
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        # flash-latest -> flash -> pro の順で優先して探す
        for name in ["models/gemini-1.5-flash-latest", "models/gemini-1.5-flash", "models/gemini-1.5-pro"]:
            if name in available_models:
                target_model = name
                break
        if not target_model:
            target_model = available_models[0] # 何も見つからなければ一番上のものを使う
        print(f"使用するモデル: {target_model}")
    except Exception as e:
        print(f"モデル一覧取得エラー: {e}")
        target_model = "models/gemini-1.5-flash-latest" # フォールバック

    model = genai.GenerativeModel(target_model)

    if "," in image_data_base64:
        image_data_base64 = image_data_base64.split(",")[1]

    try:
        # 解析リクエスト
        response = model.generate_content([
            "この画像から「偏愛」を感じるキーワードを3つ抽出してください。必ず [\"タグ1\", \"タグ2\", \"タグ3\"] というJSONのリスト形式だけで出力してください。",
            {"mime_type": "image/jpeg", "data": image_data_base64}
        ])

        print(f"Gemini生の応答: {response.text}")
        
        json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if json_match:
            tags = json.loads(json_match.group())
            print(f"抽出成功: {tags}")
            return tags
            
    except Exception as e:
        print(f"Gemini解析エラー詳細: {e}")
    
    return []