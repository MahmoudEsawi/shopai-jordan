#!/usr/bin/env python3
"""
Recipe Suggestions
Provides recipe recommendations based on shopping lists and event types
"""

from typing import Dict, List, Optional


class RecipeSuggestions:
    """Generate recipe suggestions based on shopping lists"""
    
    def __init__(self):
        self.recipes = {
            "bbq": [
                {
                    "name": "Classic BBQ Ribeye Steak",
                    "description": "Perfectly grilled ribeye with herbs and spices",
                    "ingredients": ["ribeye steak", "salt", "pepper", "garlic", "olive oil"],
                    "prep_time": "10 min",
                    "cook_time": "15 min",
                    "servings": 4,
                    "difficulty": "Easy"
                },
                {
                    "name": "Grilled Chicken Shish Tawook",
                    "description": "Traditional Middle Eastern grilled chicken",
                    "ingredients": ["chicken breast", "yogurt", "garlic", "lemon", "spices"],
                    "prep_time": "30 min",
                    "cook_time": "20 min",
                    "servings": 6,
                    "difficulty": "Medium"
                },
                {
                    "name": "BBQ Lamb Chops",
                    "description": "Tender lamb chops with mint and rosemary",
                    "ingredients": ["lamb chops", "mint", "rosemary", "garlic", "olive oil"],
                    "prep_time": "15 min",
                    "cook_time": "12 min",
                    "servings": 4,
                    "difficulty": "Easy"
                }
            ],
            "breakfast": [
                {
                    "name": "Traditional Jordanian Breakfast",
                    "description": "Complete breakfast spread with hummus, falafel, and more",
                    "ingredients": ["hummus", "falafel", "bread", "olives", "labneh", "zaatar", "tomatoes", "cucumbers"],
                    "prep_time": "20 min",
                    "cook_time": "15 min",
                    "servings": 6,
                    "difficulty": "Easy"
                },
                {
                    "name": "Hummus with Falafel",
                    "description": "Classic Middle Eastern breakfast combination",
                    "ingredients": ["hummus", "falafel", "bread", "tahini", "olive oil"],
                    "prep_time": "10 min",
                    "cook_time": "10 min",
                    "servings": 4,
                    "difficulty": "Easy"
                },
                {
                    "name": "Labneh with Zaatar",
                    "description": "Creamy labneh topped with zaatar and olive oil",
                    "ingredients": ["labneh", "zaatar", "olive oil", "bread", "olives"],
                    "prep_time": "5 min",
                    "cook_time": "0 min",
                    "servings": 4,
                    "difficulty": "Very Easy"
                }
            ],
            "dinner": [
                {
                    "name": "Traditional Mansaf",
                    "description": "Jordan's national dish with lamb and yogurt",
                    "ingredients": ["lamb", "yogurt", "rice", "bread", "almonds", "pine nuts"],
                    "prep_time": "30 min",
                    "cook_time": "2 hours",
                    "servings": 8,
                    "difficulty": "Hard"
                },
                {
                    "name": "Chicken Maqluba",
                    "description": "Upside-down rice and chicken dish",
                    "ingredients": ["chicken", "rice", "eggplant", "tomatoes", "onions", "spices"],
                    "prep_time": "45 min",
                    "cook_time": "1 hour",
                    "servings": 6,
                    "difficulty": "Medium"
                },
                {
                    "name": "Grilled Chicken with Tabbouleh",
                    "description": "Healthy grilled chicken with fresh tabbouleh salad",
                    "ingredients": ["chicken", "tabbouleh", "bread", "lemon", "olive oil"],
                    "prep_time": "20 min",
                    "cook_time": "25 min",
                    "servings": 4,
                    "difficulty": "Easy"
                }
            ],
            "party": [
                {
                    "name": "Mixed Appetizer Platter",
                    "description": "Variety of Middle Eastern appetizers",
                    "ingredients": ["hummus", "falafel", "tabbouleh", "fattoush", "olives", "bread"],
                    "prep_time": "30 min",
                    "cook_time": "15 min",
                    "servings": 10,
                    "difficulty": "Easy"
                },
                {
                    "name": "BBQ Party Platter",
                    "description": "Mixed grilled meats and salads",
                    "ingredients": ["chicken", "beef", "vegetables", "salads", "bread", "sauces"],
                    "prep_time": "45 min",
                    "cook_time": "30 min",
                    "servings": 12,
                    "difficulty": "Medium"
                }
            ]
        }
    
    def get_suggestions(self, event_type: str, num_people: int, items: List[Dict]) -> List[Dict]:
        """Get recipe suggestions based on event type and shopping list"""
        
        # Get recipes for event type
        event_recipes = self.recipes.get(event_type, self.recipes["bbq"])
        
        # Filter recipes based on available ingredients
        available_ingredients = [item.get("product_name", "").lower() for item in items]
        
        suggested = []
        for recipe in event_recipes:
            # Check if we have most ingredients
            recipe_ingredients = [ing.lower() for ing in recipe["ingredients"]]
            matches = sum(1 for ing in recipe_ingredients 
                         if any(ing in avail or avail in ing for avail in available_ingredients))
            
            match_percentage = (matches / len(recipe_ingredients)) * 100 if recipe_ingredients else 0
            
            # Adjust servings if needed
            recipe_copy = recipe.copy()
            if recipe_copy["servings"] < num_people:
                recipe_copy["servings"] = num_people
                recipe_copy["scaled"] = True
            
            recipe_copy["match_percentage"] = round(match_percentage, 0)
            suggested.append(recipe_copy)
        
        # Sort by match percentage
        suggested.sort(key=lambda x: x["match_percentage"], reverse=True)
        
        return suggested[:3]  # Return top 3 suggestions
    
    def get_recipe_details(self, recipe_name: str, event_type: str) -> Optional[Dict]:
        """Get detailed recipe information"""
        event_recipes = self.recipes.get(event_type, self.recipes["bbq"])
        
        for recipe in event_recipes:
            if recipe["name"].lower() == recipe_name.lower():
                return recipe
        
        return None

