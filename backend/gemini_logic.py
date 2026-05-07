# src/gemini_logic.py
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# 引数を「image_data_base64」の1つだけに修正
# src/gemini_logic.py

def analyze_image_with_gemini(image_data_base64):
    """
    画像から『偏愛』タグを3つ抽出する
    """
    # 最新の安定版モデルを指定
    model = genai.GenerativeModel('gemini-1.5-flash')

    if "," in image_data_base64:
        header, image_data_base64 = image_data_base64.split(",")
        mime_type = header.split(";")[0].split(":")[1]
    else:
        mime_type = "image/jpeg"

    try:
        # API呼び出し
        response = model.generate_content([
            "この画像から「偏愛」を感じるキーワードを3つ抽出してください。必ず [\"タグ1\", \"タグ2\", \"タグ3\"] というJSONのリスト形式だけで出力してください。",
            {"mime_type": mime_type, "data": image_data_base64}
        ])

        if not response.text:
            return []

        json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

    except Exception as e:
        print(f"Gemini解析エラー: {e}")
    
    # ★ 修正ポイント: エラー時は空のリストを返す
    # これにより、フロントエンドの polling が「まだ解析が終わっていない」と正しく判断できます
    return []