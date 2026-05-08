import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def analyze_image_with_gemini(image_data_base64, existing_tags=[]):
    print("--- Gemini解析プロセス開始 ---")
    
    # モデルの特定（ユーザー様の元のロジックを維持）
    target_model = None
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        for name in ["models/gemini-1.5-flash-latest", "models/gemini-1.5-flash", "models/gemini-1.5-pro"]:
            if name in available_models:
                target_model = name
                break
        if not target_model:
            target_model = available_models[0]
    except Exception as e:
        print(f"モデル一覧取得エラー: {e}")
        target_model = "models/gemini-1.5-flash-latest"

    model = genai.GenerativeModel(target_model)

    if "," in image_data_base64:
        image_data_base64 = image_data_base64.split(",")[1]

    # ★ 既存のタグがある場合、プロンプトに組み込む
    tags_context = ""
    if existing_tags:
        tags_context = f"\n[既存のタグリスト]\n{', '.join(existing_tags)}\n"

    prompt = f"""
この画像を分析し、あなたの「偏愛」を感じるキーワードを3つ抽出してください。

【重要ルール】
1. 以下の [既存のタグリスト] を確認し、画像の内容がリスト内のタグと「同じ意味」であれば、新しく作らずに必ずリスト内の表記を使用してください。
   （例：リストに「3Dプリンタ」があり、画像がそれに関連する場合、「3Dプリント」ではなく「3Dプリンタ」とする）
2. リストに適切なタグがない場合のみ、新しいタグを生成してください。
3. 出力は必ず ["タグ1", "タグ2", "タグ3"] というJSONのリスト形式のみを返してください。
{tags_context}
"""

    try:
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_data_base64}
        ])

        print(f"Gemini生の応答: {response.text}")
        
        json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if json_match:
            tags = json.loads(json_match.group())
            print(f"抽出成功（正規化済）: {tags}")
            return tags
            
    except Exception as e:
        print(f"Gemini解析エラー詳細: {e}")
    
    return []