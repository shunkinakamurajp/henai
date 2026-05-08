import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def get_best_model():
    """
    環境で利用可能な最適なモデル名を返すヘルパー関数
    """
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        # 優先度の高い順に試行
        for name in ["models/gemini-1.5-flash", "gemini-1.5-flash", "models/gemini-1.5-pro", "models/gemini-1.5-flash-latest"]:
            if name in available_models:
                return name
        return available_models[0] if available_models else "gemini-1.5-flash"
    except Exception as e:
        print(f"モデル一覧取得エラー: {e}")
        return "gemini-1.5-flash"

def analyze_image_with_gemini(image_data_base64, existing_tags=[]):
    print("--- Gemini画像解析プロセス開始 ---")
    
    target_model = get_best_model()
    model = genai.GenerativeModel(target_model)

    if "," in image_data_base64:
        image_data_base64 = image_data_base64.split(",")[1]

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
        
        json_match = re.search(r'\[.*\]', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
            
    except Exception as e:
        print(f"Gemini解析エラー詳細: {e}")
    
    return []

def analyze_tags_tendency(tags_list):
    """
    タグのリストからユーザーの傾向をプロファイリングする
    """
    print("--- Gemini傾向分析プロセス開始 ---")
    
    target_model = get_best_model()
    model = genai.GenerativeModel(target_model)
    
    tags_string = ", ".join(tags_list)
    prompt = f"""
あなたは「偏愛図鑑」の司書です。
ユーザーが記録した以下のタグ一覧から、その人の感性の傾向や美学を分析してください。

タグリスト: {tags_string}

【出力ルール】
1. 「【称号】：本文」という形式で出力してください。
2. 称号は10文字程度、本文は150文字程度の文学的で洞察に満ちた表現にしてください。
3. 単なる統計報告ではなく、ユーザーの「視点」や「こだわり」を読み解くプロファイリングを行ってください。
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"傾向分析エラー: {e}")
        return "【静かなる観測者】：あなたの記録は、日常の中に潜む微かな光を捉えようとしています。"