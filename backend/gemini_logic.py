import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# .envファイルを読み込む
load_dotenv()

# APIキーの設定（image_839c76.pngで有効化したプロジェクトのキーを使用）
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def analyze_image_with_gemini(api_key_unused, image_data_base64):
    """
    画像から『偏愛』タグを3つ抽出する
    """
    # 404エラー対策として '-latest' を付与
    model = genai.GenerativeModel('gemini-1.5-flash-latest')

    # Base64データのプレフィックスを除去
    if "," in image_data_base64:
        image_data_base64 = image_data_base64.split(",")[1]

    image_parts = [{
        "mime_type": "image/jpeg",
        "data": image_data_base64
    }]

    prompt = "この画像から「偏愛」を感じるキーワードを3つ抽出してください。必ず [\"タグ1\", \"タグ2\", \"タグ3\"] というJSONのリスト形式だけで出力してください。"
    
    try:
        response = model.generate_content([prompt, image_parts[0]])
        json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"画像解析エラー: {e}")
    
    return ["解析中"]

def analyze_user_trends_and_title(tag_history):
    """
    過去のタグ履歴から傾向と称号を生成する
    """
    if not tag_history:
        return {"trend": "データ収集中...", "title": "見習い観測者"}

    tags_str = ", ".join(tag_history)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    
    prompt = f"""
    あなたは「偏愛図鑑」の司書です。以下のタグ履歴を持つユーザーを分析し、JSONで答えてください。
    タグ履歴: {tags_str}
    出力形式: {{"trend": "30字以内の要約", "title": "ユニークな称号"}}
    """
    
    try:
        response = model.generate_content(prompt)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"傾向分析エラー: {e}")
            
    return {"trend": "あなたの個性を見守っています", "title": "静かなる探求者"}