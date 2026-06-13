import base64
import json
import requests
import os
import io

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from nutrition import get_nutrition

# -------------------- LOAD ENV --------------------
# Railway provides env variables directly
# No need for dotenv in production
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not found. Check your .env file")

# -------------------- APP INIT --------------------
app = Flask(__name__)
CORS(app, origins="*", 
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "OPTIONS"])

# -------------------- SAFE API CALL --------------------
def call_groq(payload):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.post(GROQ_URL, headers=headers, json=payload)
    data = response.json()

    if "choices" not in data:
        raise Exception(f"Groq API Error: {data}")

    return data["choices"][0]["message"]["content"]


# -------------------- FOOD IMAGE ANALYSIS --------------------
def analyze_food_image(base64_image):
    prompt = """You are a food recognition and nutrition expert.
Analyze this food image carefully.
Respond ONLY with this exact JSON format, no extra text:
{
  "foods": [
    {
      "name": "food name",
      "confidence": 95,
      "portion": "estimated portion size",
      "quantity": 1
    }
  ],
  "meal_type": "breakfast or lunch or dinner or snack",
  "cuisine": "cuisine type",
  "health_score": 7,
  "description": "brief description of the meal"
}"""

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    }

    text = call_groq(payload)
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


# -------------------- RECOMMENDATIONS --------------------
def get_ai_recommendations(foods, total):
    prompt = f"""You are a nutrition expert. Based on this meal give recommendations.

Foods eaten: {[f['name'] for f in foods]}
Total calories: {total['calories']}
Total protein: {total['protein']}g
Total carbs: {total['carbs']}g
Total fat: {total['fat']}g

Respond ONLY with this exact JSON format, no extra text:
{{
  "recommendations": [
    "recommendation 1",
    "recommendation 2",
    "recommendation 3"
  ],
  "health_tips": "brief health tip",
  "exercise_to_burn": "what exercise burns these calories",
  "missing_nutrients": ["nutrient1", "nutrient2"],
  "overall_rating": "Excellent or Good or Fair or Poor"
}}"""

    payload = {
        "model": "llama-3.3-70b-versatile",
        "max_tokens": 500,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    text = call_groq(payload)
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


# -------------------- MAIN ROUTE --------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        image_data = data.get("image")

        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        # Remove base64 header if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Validate and convert image to JPEG
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))

        # Convert to RGB and save as JPEG
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        else:
            img = img.convert("RGB")

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        buffer.seek(0)

        # Re-encode as base64
        image_data = base64.b64encode(
            buffer.read()
        ).decode("utf-8")

        # Analyze with Groq Vision
        food_result = analyze_food_image(image_data)

        # Get nutrition for each food
        foods_with_nutrition = []
        total = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }

        for food in food_result.get("foods", []):
            nutrition = get_nutrition(food["name"])
            qty = food.get("quantity", 1)

            # Multiply by quantity
            nutrition["calories"] *= qty
            nutrition["protein"] *= qty
            nutrition["carbs"] *= qty
            nutrition["fat"] *= qty

            foods_with_nutrition.append({
                **food,
                "nutrition": nutrition
            })

            # Add to totals
            for key in total:
                total[key] += nutrition.get(key, 0)

        # Get AI recommendations
        recommendations = get_ai_recommendations(
            foods_with_nutrition, total
        )

        return jsonify({
            "success": True,
            "foods": foods_with_nutrition,
            "total_nutrition": total,
            "meal_info": {
                "type": food_result.get("meal_type", "meal"),
                "cuisine": food_result.get("cuisine", "unknown"),
                "health_score": food_result.get("health_score", 5),
                "description": food_result.get("description", "")
            },
            "recommendations": recommendations
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- HEALTH CHECK --------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"})


# -------------------- RUN --------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)