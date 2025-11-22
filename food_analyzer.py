#!/usr/bin/env python3
"""
AI-Powered Food Analyzer
Uses Groq AI to analyze food and provide nutritional information
"""

from groq_assistant import GroqAIAssistant
import re


class FoodAnalyzer:
    """Analyze food items and extract nutritional information"""
    
    def __init__(self):
        self.assistant = GroqAIAssistant()
    
    def analyze_food(self, food_description: str, quantity_g: float = None) -> dict:
        """
        Analyze food description and return nutritional information
        
        Args:
            food_description: Description of food (e.g., "grilled chicken breast 200g")
            quantity_g: Weight in grams (optional, will try to extract from description)
        
        Returns:
            Dictionary with nutritional information
        """
        # Extract quantity if not provided
        if quantity_g is None:
            quantity_g = self._extract_quantity(food_description)
        
        # Clean food name
        food_name = self._clean_food_name(food_description)
        
        # Use AI to get nutritional info
        prompt = f"""Analyze this food item and provide nutritional information per 100g:
Food: {food_name}
Quantity: {quantity_g}g

Provide a JSON response with:
- calories_per_100g (number)
- protein_per_100g (number in grams)
- carbs_per_100g (number in grams)
- fats_per_100g (number in grams)
- fiber_per_100g (number in grams, optional)

Format: {{"calories_per_100g": 250, "protein_per_100g": 25, "carbs_per_100g": 0, "fats_per_100g": 15, "fiber_per_100g": 0}}

Only return the JSON, no other text."""

        try:
            response = self.assistant.chat(prompt)
            message = response.get('message', '')
            
            # Extract JSON from response
            json_match = re.search(r'\{[^}]+\}', message)
            if json_match:
                import json
                nutrition = json.loads(json_match.group())
                
                # Calculate for actual quantity
                factor = quantity_g / 100.0
                
                return {
                    "success": True,
                    "food_name": food_name,
                    "quantity_g": quantity_g,
                    "calories": round(nutrition.get('calories_per_100g', 0) * factor, 1),
                    "protein_g": round(nutrition.get('protein_per_100g', 0) * factor, 1),
                    "carbs_g": round(nutrition.get('carbs_per_100g', 0) * factor, 1),
                    "fats_g": round(nutrition.get('fats_per_100g', 0) * factor, 1),
                    "fiber_g": round(nutrition.get('fiber_per_100g', 0) * factor, 1),
                    "calories_per_100g": nutrition.get('calories_per_100g', 0),
                    "protein_per_100g": nutrition.get('protein_per_100g', 0),
                    "carbs_per_100g": nutrition.get('carbs_per_100g', 0),
                    "fats_per_100g": nutrition.get('fats_per_100g', 0),
                    "fiber_per_100g": nutrition.get('fiber_per_100g', 0)
                }
            else:
                # Fallback: try to extract numbers from text
                return self._extract_nutrition_from_text(message, quantity_g, food_name)
        except Exception as e:
            print(f"Error analyzing food: {e}")
            return {
                "success": False,
                "error": str(e),
                "food_name": food_name,
                "quantity_g": quantity_g
            }
    
    def _extract_quantity(self, text: str) -> float:
        """Extract quantity in grams from text"""
        # Look for patterns like "200g", "200 g", "200 grams", "0.5kg", etc.
        patterns = [
            r'(\d+\.?\d*)\s*(?:kg|kilograms?)\s*',
            r'(\d+\.?\d*)\s*(?:g|grams?)\s*',
            r'(\d+\.?\d*)\s*(?:ml|milliliters?)\s*',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                value = float(match.group(1))
                if 'kg' in match.group(0):
                    return value * 1000
                return value
        
        # Default to 100g if not found
        return 100.0
    
    def _clean_food_name(self, text: str) -> str:
        """Clean food name by removing quantity information"""
        # Remove quantity patterns
        text = re.sub(r'\d+\.?\d*\s*(?:kg|g|grams?|kilograms?|ml|milliliters?)\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def _extract_nutrition_from_text(self, text: str, quantity_g: float, food_name: str) -> dict:
        """Fallback: try to extract nutrition from AI text response"""
        # Try to find numbers that might be nutrition values
        calories_match = re.search(r'(\d+)\s*(?:calories?|kcal)', text, re.IGNORECASE)
        protein_match = re.search(r'(\d+\.?\d*)\s*(?:g|grams?)\s*(?:protein|prot)', text, re.IGNORECASE)
        
        calories = float(calories_match.group(1)) if calories_match else 0
        protein = float(protein_match.group(1)) if protein_match else 0
        
        # Estimate per 100g
        factor = 100.0 / quantity_g if quantity_g > 0 else 1
        calories_per_100g = calories * factor
        
        return {
            "success": True,
            "food_name": food_name,
            "quantity_g": quantity_g,
            "calories": round(calories, 1),
            "protein_g": round(protein, 1),
            "carbs_g": 0,
            "fats_g": 0,
            "fiber_g": 0,
            "calories_per_100g": round(calories_per_100g, 1),
            "protein_per_100g": round(protein * factor, 1),
            "carbs_per_100g": 0,
            "fats_per_100g": 0,
            "fiber_per_100g": 0
        }
    
    def get_food_suggestions(self, query: str) -> list:
        """Get food suggestions based on query"""
        # This could search the product database or use AI
        # For now, return common foods
        common_foods = [
            "Chicken Breast", "Salmon", "Eggs", "Greek Yogurt",
            "Oatmeal", "Brown Rice", "Sweet Potato", "Broccoli",
            "Spinach", "Banana", "Apple", "Almonds"
        ]
        
        query_lower = query.lower()
        return [food for food in common_foods if query_lower in food.lower()][:5]

