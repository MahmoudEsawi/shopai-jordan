#!/usr/bin/env python3
"""
Smart Shopping List Builder
Builds accurate lists without duplication, with correct prices
"""

import re
from typing import Dict, List, Optional
from product_database import ProductDatabase


class SmartListBuilder:
    """Build accurate shopping lists with no duplicates"""
    
    def __init__(self):
        self.db = ProductDatabase()
        
        # Event templates
        self.templates = {
            "bbq": {
                "categories": {
                    "meat": {"priority": 1, "products": 2, "multiplier": 0.5},
                    "vegetables": {"priority": 2, "products": 2, "multiplier": 0.3},
                    "bread": {"priority": 3, "products": 1, "multiplier": 0.2},
                    "condiments": {"priority": 4, "products": 2, "multiplier": 0},
                    "drinks": {"priority": 5, "products": 2, "multiplier": 1.5},
                    "charcoal": {"priority": 6, "products": 1, "multiplier": 0},
                }
            },
            "dinner": {
                "categories": {
                    "meat": {"priority": 1, "products": 1, "multiplier": 0.3},
                    "vegetables": {"priority": 2, "products": 2, "multiplier": 0.2},
                    "salads": {"priority": 3, "products": 2, "multiplier": 0.15},
                    "bread": {"priority": 4, "products": 1, "multiplier": 0.15},
                    "drinks": {"priority": 5, "products": 2, "multiplier": 1},
                    "dessert": {"priority": 6, "products": 1, "multiplier": 0.1},
                }
            },
            "party": {
                "categories": {
                    "snacks": {"priority": 1, "products": 2, "multiplier": 0.2},
                    "drinks": {"priority": 2, "products": 3, "multiplier": 2},
                    "dessert": {"priority": 3, "products": 1, "multiplier": 0.1},
                }
            },
            "breakfast": {
                "categories": {
                    "bread": {"priority": 1, "products": 2, "multiplier": 0.2},
                    "condiments": {"priority": 2, "products": 3, "multiplier": 0.1},
                    "vegetables": {"priority": 3, "products": 2, "multiplier": 0.15},
                    "drinks": {"priority": 4, "products": 2, "multiplier": 1},
                    "snacks": {"priority": 5, "products": 1, "multiplier": 0.1},
                }
            }
        }
    
    def build_list(self, user_request: str) -> Dict:
        """Build shopping list from user request"""
        
        # Parse request
        num_people = self._extract_people(user_request)
        budget = self._extract_budget(user_request)
        event_type = self._extract_event_type(user_request)
        dietary = self._extract_dietary(user_request)
        specific_products = self._extract_specific_products(user_request)
        healthy_only = self._extract_healthy_filter(user_request)
        gluten_free = self._extract_gluten_free_filter(user_request)
        min_protein = self._extract_min_protein(user_request)
        max_calories = self._extract_max_calories(user_request)
        
        # Get template
        template = self.templates.get(event_type, self.templates["bbq"])
        
        # Build list
        shopping_list = {
            "items": [],
            "total_cost": 0.0,
            "num_people": num_people,
            "event_type": event_type,
            "budget": budget,
            "dietary": dietary
        }
        
        # Get all products with filters
        all_products = self.db.search_products(
            limit=200,
            healthy_only=healthy_only,
            gluten_free=gluten_free,
            min_protein=min_protein,
            max_calories=max_calories
        )
        
        # Select products by category
        seen_ids = set()
        
        # First, add specifically requested products
        for product_name in specific_products:
            found = False
            # Search for products matching the name
            for product in all_products:
                if product['id'] in seen_ids:
                    continue
                # Check if product name matches (more flexible matching)
                product_db_name = product.get('name', '').lower()
                if (product_name.lower() in product_db_name or 
                    product_db_name.startswith(product_name.lower()) or
                    any(word in product_db_name for word in product_name.lower().split())):
                    seen_ids.add(product['id'])
                    quantity = self._calculate_quantity_for_product(product_name, num_people, event_type)
                    item = {
                        "product_name": product['name'],
                        "category": product.get('category', 'condiments'),
                        "quantity": quantity,
                        "unit_price": product.get('price', 0),
                        "total_price": round(product.get('price', 0) * quantity, 2),
                        "product_url": product.get('product_url'),
                        "image_url": product.get('image_url'),
                        # Nutritional information
                        "calories_per_100g": product.get('calories_per_100g'),
                        "protein_per_100g": product.get('protein_per_100g'),
                        "carbs_per_100g": product.get('carbs_per_100g'),
                        "fats_per_100g": product.get('fats_per_100g'),
                        "fiber_per_100g": product.get('fiber_per_100g'),
                        # Dietary facts
                        "is_gluten_free": bool(product.get('is_gluten_free', 0)),
                        "is_vegetarian": bool(product.get('is_vegetarian', 0)),
                        "is_vegan": bool(product.get('is_vegan', 0)),
                        "is_healthy": bool(product.get('is_healthy', 0)),
                        "is_organic": bool(product.get('is_organic', 0))
                    }
                    shopping_list["items"].append(item)
                    shopping_list["total_cost"] = round(shopping_list["total_cost"] + item["total_price"], 2)
                    found = True
                    break
            
            # If not found in DB, search using database search
            if not found:
                search_results = self.db.search_products(query=product_name, limit=5)
                for product in search_results:
                    if product['id'] in seen_ids:
                        continue
                    seen_ids.add(product['id'])
                    quantity = self._calculate_quantity_for_product(product_name, num_people, event_type)
                    item = {
                        "product_name": product['name'],
                        "category": product.get('category', 'condiments'),
                        "quantity": quantity,
                        "unit_price": product.get('price', 0),
                        "total_price": round(product.get('price', 0) * quantity, 2),
                        "product_url": product.get('product_url'),
                        "image_url": product.get('image_url'),
                        # Nutritional information
                        "calories_per_100g": product.get('calories_per_100g'),
                        "protein_per_100g": product.get('protein_per_100g'),
                        "carbs_per_100g": product.get('carbs_per_100g'),
                        "fats_per_100g": product.get('fats_per_100g'),
                        "fiber_per_100g": product.get('fiber_per_100g'),
                        # Dietary facts
                        "is_gluten_free": bool(product.get('is_gluten_free', 0)),
                        "is_vegetarian": bool(product.get('is_vegetarian', 0)),
                        "is_vegan": bool(product.get('is_vegan', 0)),
                        "is_healthy": bool(product.get('is_healthy', 0)),
                        "is_organic": bool(product.get('is_organic', 0))
                    }
                    shopping_list["items"].append(item)
                    shopping_list["total_cost"] = round(shopping_list["total_cost"] + item["total_price"], 2)
                    found = True
                    break
            
            # If still not found, create a placeholder item
            if not found:
                quantity = self._calculate_quantity_for_product(product_name, num_people, event_type)
                # Set appropriate default prices
                default_prices = {
                    'hummus': 2.50,
                    'falafel': 3.50,
                    'bread': 1.50,
                    'labneh': 2.00,
                    'zaatar': 1.50,
                    'olives': 2.00,
                    'eggs': 3.00,
                    'cheese': 5.00
                }
                default_price = default_prices.get(product_name.lower(), 3.0)
                item = {
                    "product_name": product_name.title(),
                    "category": "condiments",
                    "quantity": quantity,
                    "unit_price": default_price,
                    "total_price": round(default_price * quantity, 2),
                    "product_url": f"https://www.talabat.com/jordan/search?q={product_name.replace(' ', '+')}",
                    "image_url": None,
                    # Nutritional information (defaults)
                    "calories_per_100g": None,
                    "protein_per_100g": None,
                    "carbs_per_100g": None,
                    "fats_per_100g": None,
                    "fiber_per_100g": None,
                    # Dietary facts (defaults)
                    "is_gluten_free": False,
                    "is_vegetarian": False,
                    "is_vegan": False,
                    "is_healthy": False,
                    "is_organic": False
                }
                shopping_list["items"].append(item)
                shopping_list["total_cost"] = round(shopping_list["total_cost"] + item["total_price"], 2)
        
        # Then add products from template
        for category, config in sorted(template["categories"].items(), key=lambda x: x[1]["priority"]):
            # Find products in this category
            category_products = [
                p for p in all_products 
                if category.lower() in p.get('category', '').lower() 
                and p['id'] not in seen_ids
                and self._matches_dietary(p, dietary)
            ]
            
            # Pick top N products
            for product in category_products[:config["products"]]:
                seen_ids.add(product['id'])
                
                # Calculate quantity
                multiplier = config["multiplier"]
                if multiplier == 0:
                    quantity = 1  # Equipment/supplies
                else:
                    quantity = max(1, int(num_people * multiplier))
                
                item = {
                    "product_name": product['name'],
                    "category": category,
                    "quantity": quantity,
                    "unit_price": product.get('price', 0),
                    "total_price": round(product.get('price', 0) * quantity, 2),
                    "product_url": product.get('product_url'),
                    "image_url": product.get('image_url')
                }
                
                shopping_list["items"].append(item)
                shopping_list["total_cost"] = round(shopping_list["total_cost"] + item["total_price"], 2)
        
        # Optimize for budget
        if budget and shopping_list["total_cost"] > budget:
            shopping_list = self._fit_budget(shopping_list, budget)
        
        return shopping_list
    
    def _extract_specific_products(self, text: str) -> List[str]:
        """Extract specifically mentioned products"""
        text_lower = text.lower()
        products = []
        
        # Common product keywords
        product_keywords = {
            'hummus': 'hummus',
            'falafel': 'falafel',
            'bread': 'bread',
            'khubz': 'bread',
            'labneh': 'labneh',
            'zaatar': 'zaatar',
            'za\'atar': 'zaatar',
            'olives': 'olives',
            'eggs': 'eggs',
            'cheese': 'cheese',
            'tomatoes': 'tomatoes',
            'cucumbers': 'cucumbers',
            'tea': 'tea',
            'coffee': 'coffee'
        }
        
        # Check for "include" or "with" patterns
        include_pattern = r'(?:include|with|need|want|add)\s+([^,\.]+?)(?:,|\.|$)'
        matches = re.findall(include_pattern, text_lower)
        
        for match in matches:
            words = match.strip().split()
            for word in words:
                if word in product_keywords:
                    products.append(product_keywords[word])
        
        # Also check direct mentions
        for keyword, product in product_keywords.items():
            if keyword in text_lower and product not in products:
                products.append(product)
        
        return list(set(products))  # Remove duplicates
    
    def _calculate_quantity_for_product(self, product_name: str, num_people: int, event_type: str) -> int:
        """Calculate quantity for specific product"""
        product_lower = product_name.lower()
        
        # Product-specific calculations
        if 'hummus' in product_lower:
            return max(1, int(num_people / 3))  # 1 container per 3 people
        elif 'falafel' in product_lower:
            return max(1, int(num_people * 2))  # 2 falafel per person
        elif 'bread' in product_lower or 'khubz' in product_lower:
            return max(1, int(num_people / 2))  # 1 pack per 2 people
        elif 'eggs' in product_lower:
            return max(1, int(num_people / 2))  # 1 egg per 2 people (dozen)
        elif 'cheese' in product_lower:
            return max(1, int(num_people / 4))  # 1 block per 4 people
        else:
            return max(1, int(num_people / 3))  # Default: 1 per 3 people
    
    def _extract_people(self, text: str) -> int:
        """Extract number of people"""
        match = re.search(r'(\d+)\s*(?:people|persons|guests|pax)', text, re.I)
        return int(match.group(1)) if match else 4
    
    def _extract_budget(self, text: str) -> Optional[float]:
        """Extract budget"""
        match = re.search(r'budget[:\s]+(\d+)', text, re.I)
        return float(match.group(1)) if match else None
    
    def _extract_event_type(self, text: str) -> str:
        """Extract event type"""
        text_lower = text.lower()
        if 'breakfast' in text_lower or 'morning meal' in text_lower:
            return 'breakfast'
        elif 'bbq' in text_lower or 'barbecue' in text_lower or 'grill' in text_lower:
            return 'bbq'
        elif 'dinner' in text_lower:
            return 'dinner'
        elif 'party' in text_lower or 'celebration' in text_lower:
            return 'party'
        elif 'traditional' in text_lower or 'jordanian' in text_lower:
            return 'dinner'
        return 'bbq'
    
    def _extract_dietary(self, text: str) -> str:
        """Extract dietary preferences"""
        text_lower = text.lower()
        if 'vegetarian' in text_lower or 'veg only' in text_lower:
            return 'vegetarian'
        elif 'no beef' in text_lower:
            return 'no-beef'
        elif 'no chicken' in text_lower:
            return 'no-chicken'
        return 'all'
    
    def _extract_healthy_filter(self, text: str) -> bool:
        """Extract healthy food filter"""
        text_lower = text.lower()
        return 'healthy' in text_lower and ('food' in text_lower or 'only' in text_lower)
    
    def _extract_gluten_free_filter(self, text: str) -> bool:
        """Extract gluten-free filter"""
        text_lower = text.lower()
        return 'gluten-free' in text_lower or 'gluten free' in text_lower
    
    def _extract_min_protein(self, text: str) -> Optional[float]:
        """Extract minimum protein requirement"""
        import re
        match = re.search(r'minimum\s+(\d+(?:\.\d+)?)\s*g\s*protein', text, re.I)
        if match:
            return float(match.group(1))
        return None
    
    def _extract_max_calories(self, text: str) -> Optional[float]:
        """Extract maximum calories requirement"""
        import re
        match = re.search(r'maximum\s+(\d+(?:\.\d+)?)\s*calories', text, re.I)
        if match:
            return float(match.group(1))
        return None
    
    def _matches_dietary(self, product: Dict, dietary: str) -> bool:
        """Check if product matches dietary restrictions"""
        if dietary == 'all':
            return True
        
        product_name = product.get('name', '').lower()
        category = product.get('category', '').lower()
        
        if dietary == 'vegetarian':
            return 'meat' not in category and 'chicken' not in product_name and 'beef' not in product_name and 'lamb' not in product_name
        elif dietary == 'no-beef':
            return 'beef' not in product_name
        elif dietary == 'no-chicken':
            return 'chicken' not in product_name
        
        return True
    
    def _fit_budget(self, shopping_list: Dict, budget: float) -> Dict:
        """Fit shopping list within budget"""
        
        items = shopping_list["items"]
        
        # Sort by priority: essentials first
        essential_order = ['meat', 'bread', 'vegetables', 'drinks', 'condiments', 'dessert']
        
        def get_priority(item):
            try:
                return essential_order.index(item['category'])
            except:
                return 999
        
        items.sort(key=get_priority)
        
        # Keep adding until budget reached
        optimized = []
        total = 0.0
        
        for item in items:
            if total + item["total_price"] <= budget:
                optimized.append(item)
                total = round(total + item["total_price"], 2)
        
        shopping_list["items"] = optimized
        shopping_list["total_cost"] = total
        shopping_list["optimized"] = True
        
        return shopping_list


if __name__ == "__main__":
    print("🧪 Testing Smart List Builder\n")
    
    builder = SmartListBuilder()
    
    # Test
    result = builder.build_list("I want a BBQ for 14 people, budget 100 JOD")
    
    print(f"📋 Shopping List:")
    print(f"  People: {result['num_people']}")
    print(f"  Budget: {result['budget']} JOD")
    print(f"  Items: {len(result['items'])}")
    print(f"  Total: {result['total_cost']} JOD")
    
    print(f"\n📦 Items:")
    for item in result['items']:
        print(f"  • {item['product_name']}")
        print(f"    {item['quantity']} × {item['unit_price']} = {item['total_price']} JOD")
    
    print(f"\n✅ Total: {result['total_cost']} JOD")
    print(f"{'✅ Within budget!' if result['total_cost'] <= result['budget'] else '⚠️ Over budget'}")

