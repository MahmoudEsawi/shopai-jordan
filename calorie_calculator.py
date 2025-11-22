#!/usr/bin/env python3
"""
AI-Powered Calorie Calculator
Calculates daily calorie needs based on user profile using BMR/TDEE formulas
"""

from groq_assistant import GroqAIAssistant


class CalorieCalculator:
    """Calculate daily calorie needs based on user profile"""
    
    def __init__(self):
        self.assistant = GroqAIAssistant()
    
    def calculate_bmr(self, weight_kg: float, height_cm: float, age: int, gender: str) -> float:
        """
        Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
        """
        if gender.lower() in ['male', 'm']:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:  # female
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        
        return bmr
    
    def calculate_tdee(self, bmr: float, activity_level: str) -> float:
        """
        Calculate Total Daily Energy Expenditure (TDEE) based on activity level
        """
        activity_multipliers = {
            'sedentary': 1.2,      # Little or no exercise
            'light': 1.375,        # Light exercise 1-3 days/week
            'moderate': 1.55,      # Moderate exercise 3-5 days/week
            'active': 1.725,       # Hard exercise 6-7 days/week
            'very_active': 1.9     # Very hard exercise, physical job
        }
        
        multiplier = activity_multipliers.get(activity_level.lower(), 1.2)
        return bmr * multiplier
    
    def calculate_goal_calories(self, tdee: float, goal: str, target_weight_kg: float = None, 
                                current_weight_kg: float = None) -> float:
        """
        Calculate daily calorie goal based on weight goal
        """
        if goal.lower() in ['lose', 'weight_loss', 'lose_weight']:
            # 1 kg = 7700 calories, so 0.5kg/week = 3850 cal/week = 550 cal/day deficit
            # Safe deficit: 500-1000 cal/day
            deficit = 500  # Moderate deficit for 0.5kg/week
            return max(tdee - deficit, 1200)  # Minimum 1200 calories
        elif goal.lower() in ['gain', 'weight_gain', 'gain_weight', 'bulk']:
            # Surplus for weight gain
            surplus = 500
            return tdee + surplus
        else:  # maintain
            return tdee
    
    def calculate_macro_goals(self, calories: float, goal: str) -> dict:
        """
        Calculate macro goals based on calories and goal
        """
        if goal.lower() in ['lose', 'weight_loss', 'lose_weight']:
            # Higher protein for weight loss: 30% protein, 30% fat, 40% carbs
            protein_percent = 0.30
            fat_percent = 0.30
            carbs_percent = 0.40
        elif goal.lower() in ['gain', 'weight_gain', 'gain_weight', 'bulk']:
            # Higher carbs for weight gain: 25% protein, 25% fat, 50% carbs
            protein_percent = 0.25
            fat_percent = 0.25
            carbs_percent = 0.50
        else:  # maintain
            # Balanced: 25% protein, 30% fat, 45% carbs
            protein_percent = 0.25
            fat_percent = 0.30
            carbs_percent = 0.45
        
        # 1g protein = 4 cal, 1g carbs = 4 cal, 1g fat = 9 cal
        protein_g = (calories * protein_percent) / 4
        carbs_g = (calories * carbs_percent) / 4
        fats_g = (calories * fat_percent) / 9
        
        return {
            'protein_g': round(protein_g, 1),
            'carbs_g': round(carbs_g, 1),
            'fats_g': round(fats_g, 1)
        }
    
    def calculate_calories_with_ai(self, profile: dict) -> dict:
        """
        Use AI to calculate personalized calorie goals
        """
        weight = profile.get('current_weight_kg', 70)
        height = profile.get('height_cm', 170)
        age = profile.get('age', 30)
        gender = profile.get('gender', 'male')
        activity = profile.get('activity_level', 'moderate')
        goal = profile.get('goal', 'maintain')
        target_weight = profile.get('target_weight_kg')
        
        # Calculate BMR and TDEE
        bmr = self.calculate_bmr(weight, height, age, gender)
        tdee = self.calculate_tdee(bmr, activity)
        
        # Calculate goal calories
        goal_calories = self.calculate_goal_calories(tdee, goal, target_weight, weight)
        
        # Calculate macro goals
        macro_goals = self.calculate_macro_goals(goal_calories, goal)
        
        return {
            'bmr': round(bmr, 0),
            'tdee': round(tdee, 0),
            'daily_calorie_goal': round(goal_calories, 0),
            'daily_protein_goal': macro_goals['protein_g'],
            'daily_carbs_goal': macro_goals['carbs_g'],
            'daily_fats_goal': macro_goals['fats_g'],
            'activity_level': activity,
            'goal': goal
        }
    
    def get_weekly_summary(self, user_id: int, start_date: str = None) -> dict:
        """
        Get weekly calorie summary with deficit/surplus
        Note: This would need access to user_db, so it's better to implement in web_app
        """
        # This is a placeholder - actual implementation would query the database
        return {
            'total_calories': 0,
            'total_deficit': 0,
            'average_daily_calories': 0,
            'days': []
        }

