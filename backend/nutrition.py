# Nutrition database for common foods
NUTRITION_DB = {
    "pizza": {
        "calories": 266, "protein": 11, "carbs": 33,
        "fat": 10, "fiber": 2, "sugar": 3,
        "sodium": 598, "serving": "1 slice (100g)"
    },
    "burger": {
        "calories": 295, "protein": 17, "carbs": 24,
        "fat": 14, "fiber": 1, "sugar": 5,
        "sodium": 396, "serving": "1 burger (150g)"
    },
    "salad": {
        "calories": 20, "protein": 1, "carbs": 3,
        "fat": 0, "fiber": 2, "sugar": 1,
        "sodium": 10, "serving": "1 cup (100g)"
    },
    "rice": {
        "calories": 130, "protein": 3, "carbs": 28,
        "fat": 0, "fiber": 0, "sugar": 0,
        "sodium": 1, "serving": "1 cup cooked (186g)"
    },
    "dal bhat": {
        "calories": 350, "protein": 14, "carbs": 60,
        "fat": 6, "fiber": 8, "sugar": 2,
        "sodium": 400, "serving": "1 plate (400g)"
    },
    "momo": {
        "calories": 280, "protein": 12, "carbs": 35,
        "fat": 10, "fiber": 2, "sugar": 1,
        "sodium": 450, "serving": "8 pieces (200g)"
    },
    "chow mein": {
        "calories": 290, "protein": 9, "carbs": 42,
        "fat": 9, "fiber": 3, "sugar": 4,
        "sodium": 520, "serving": "1 plate (250g)"
    },
    "chicken": {
        "calories": 239, "protein": 27, "carbs": 0,
        "fat": 14, "fiber": 0, "sugar": 0,
        "sodium": 82, "serving": "100g"
    },
    "egg": {
        "calories": 155, "protein": 13, "carbs": 1,
        "fat": 11, "fiber": 0, "sugar": 1,
        "sodium": 124, "serving": "2 eggs (100g)"
    },
    "banana": {
        "calories": 89, "protein": 1, "carbs": 23,
        "fat": 0, "fiber": 3, "sugar": 12,
        "sodium": 1, "serving": "1 medium (118g)"
    },
    "apple": {
        "calories": 52, "protein": 0, "carbs": 14,
        "fat": 0, "fiber": 2, "sugar": 10,
        "sodium": 1, "serving": "1 medium (182g)"
    },
    "bread": {
        "calories": 265, "protein": 9, "carbs": 49,
        "fat": 3, "fiber": 3, "sugar": 5,
        "sodium": 491, "serving": "2 slices (60g)"
    },
    "pasta": {
        "calories": 220, "protein": 8, "carbs": 43,
        "fat": 1, "fiber": 3, "sugar": 1,
        "sodium": 1, "serving": "1 cup cooked (140g)"
    },
    "sushi": {
        "calories": 200, "protein": 9, "carbs": 38,
        "fat": 1, "fiber": 1, "sugar": 4,
        "sodium": 430, "serving": "6 pieces (150g)"
    },
    "steak": {
        "calories": 271, "protein": 26, "carbs": 0,
        "fat": 18, "fiber": 0, "sugar": 0,
        "sodium": 59, "serving": "100g"
    },
    "soup": {
        "calories": 80, "protein": 4, "carbs": 10,
        "fat": 2, "fiber": 2, "sugar": 3,
        "sodium": 800, "serving": "1 bowl (240g)"
    },
    "sandwich": {
        "calories": 350, "protein": 18, "carbs": 40,
        "fat": 12, "fiber": 3, "sugar": 6,
        "sodium": 780, "serving": "1 sandwich (200g)"
    },
    "ice cream": {
        "calories": 207, "protein": 4, "carbs": 24,
        "fat": 11, "fiber": 0, "sugar": 21,
        "sodium": 80, "serving": "1 scoop (100g)"
    },
    "chocolate": {
        "calories": 546, "protein": 5, "carbs": 60,
        "fat": 31, "fiber": 7, "sugar": 48,
        "sodium": 24, "serving": "1 bar (100g)"
    },
    "coffee": {
        "calories": 2, "protein": 0, "carbs": 0,
        "fat": 0, "fiber": 0, "sugar": 0,
        "sodium": 2, "serving": "1 cup (240ml)"
    },
}

def get_nutrition(food_name):
    """Get nutrition data for a food item"""
    food_lower = food_name.lower()

    # Direct match
    if food_lower in NUTRITION_DB:
        data = NUTRITION_DB[food_lower].copy()
        data['name'] = food_name
        return data

    # Partial match
    for key in NUTRITION_DB:
        if key in food_lower or food_lower in key:
            data = NUTRITION_DB[key].copy()
            data['name'] = food_name
            return data

    # Default if not found
    return {
        "name": food_name,
        "calories": 200,
        "protein": 8,
        "carbs": 25,
        "fat": 8,
        "fiber": 2,
        "sugar": 5,
        "sodium": 300,
        "serving": "1 serving (100g)",
        "estimated": True
    }