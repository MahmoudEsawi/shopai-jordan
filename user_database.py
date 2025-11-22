#!/usr/bin/env python3
"""
User Database Manager
Handles user authentication, profiles, and food/weight tracking data
"""

import sqlite3
import hashlib
import secrets
from typing import Dict, Optional, List, Any
from datetime import datetime, date
import json


class UserDatabase:
    """SQLite database for users and their tracking data"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self.conn = None
        self.init_database()
    
    def init_database(self):
        """Initialize database schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        cursor = self.conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login TEXT,
                is_active INTEGER DEFAULT 1
            )
        """)
        
        # User profiles (goals, preferences)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id INTEGER PRIMARY KEY,
                full_name TEXT,
                age INTEGER,
                gender TEXT,
                height_cm REAL,
                current_weight_kg REAL,
                target_weight_kg REAL,
                activity_level TEXT,
                goal TEXT,
                daily_calorie_goal INTEGER,
                daily_protein_goal REAL,
                daily_carbs_goal REAL,
                daily_fats_goal REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Food logs (what user ate)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS food_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                food_name TEXT NOT NULL,
                meal_type TEXT NOT NULL,
                quantity_g REAL NOT NULL,
                calories REAL,
                protein_g REAL,
                carbs_g REAL,
                fats_g REAL,
                fiber_g REAL,
                logged_at TEXT NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Weight tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weight_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                weight_kg REAL NOT NULL,
                logged_at TEXT NOT NULL,
                date TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Water intake
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS water_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount_ml INTEGER NOT NULL,
                logged_at TEXT NOT NULL,
                date TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date)")
        
        self.conn.commit()
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """Create a new user"""
        try:
            password_hash = self.hash_password(password)
            created_at = datetime.now().isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
            """, (username, email, password_hash, created_at))
            
            user_id = cursor.lastrowid
            
            # Create default profile
            cursor.execute("""
                INSERT INTO user_profiles (user_id, created_at, updated_at)
                VALUES (?, ?, ?)
            """, (user_id, created_at, created_at))
            
            self.conn.commit()
            
            return {
                "success": True,
                "user_id": user_id,
                "username": username
            }
        except sqlite3.IntegrityError as e:
            if "username" in str(e):
                return {"success": False, "error": "Username already exists"}
            elif "email" in str(e):
                return {"success": False, "error": "Email already exists"}
            return {"success": False, "error": str(e)}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user and return user data"""
        password_hash = self.hash_password(password)
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, username, email, created_at
            FROM users
            WHERE (username = ? OR email = ?) AND password_hash = ? AND is_active = 1
        """, (username, username, password_hash))
        
        user = cursor.fetchone()
        
        if user:
            # Update last login
            cursor.execute("""
                UPDATE users SET last_login = ? WHERE id = ?
            """, (datetime.now().isoformat(), user['id']))
            self.conn.commit()
            
            return {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "created_at": user['created_at']
            }
        
        return None
    
    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user profile"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM user_profiles WHERE user_id = ?
        """, (user_id,))
        
        profile = cursor.fetchone()
        if profile:
            return dict(profile)
        return None
    
    def update_user_profile(self, user_id: int, **kwargs) -> bool:
        """Update user profile"""
        try:
            allowed_fields = [
                'full_name', 'age', 'gender', 'height_cm', 'current_weight_kg',
                'target_weight_kg', 'activity_level', 'goal', 'daily_calorie_goal',
                'daily_protein_goal', 'daily_carbs_goal', 'daily_fats_goal'
            ]
            
            updates = []
            values = []
            
            for key, value in kwargs.items():
                if key in allowed_fields:
                    updates.append(f"{key} = ?")
                    values.append(value)
            
            if not updates:
                return False
            
            values.append(datetime.now().isoformat())  # updated_at
            values.append(user_id)
            
            cursor = self.conn.cursor()
            cursor.execute(f"""
                UPDATE user_profiles
                SET {', '.join(updates)}, updated_at = ?
                WHERE user_id = ?
            """, values)
            
            self.conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating profile: {e}")
            return False
    
    def log_food(self, user_id: int, food_name: str, meal_type: str, 
                 quantity_g: float, calories: float = None,
                 protein_g: float = None, carbs_g: float = None,
                 fats_g: float = None, fiber_g: float = None,
                 notes: str = None) -> Dict[str, Any]:
        """Log a food entry"""
        try:
            now = datetime.now()
            logged_at = now.isoformat()
            date_str = now.date().isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO food_logs 
                (user_id, food_name, meal_type, quantity_g, calories, protein_g, 
                 carbs_g, fats_g, fiber_g, logged_at, date, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, food_name, meal_type, quantity_g, calories, protein_g,
                  carbs_g, fats_g, fiber_g, logged_at, date_str, notes))
            
            log_id = cursor.lastrowid
            self.conn.commit()
            
            return {
                "success": True,
                "log_id": log_id,
                "message": "Food logged successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_food_logs(self, user_id: int, date_str: str = None) -> List[Dict[str, Any]]:
        """Get food logs for a user"""
        cursor = self.conn.cursor()
        
        if date_str:
            cursor.execute("""
                SELECT * FROM food_logs
                WHERE user_id = ? AND date = ?
                ORDER BY logged_at DESC
            """, (user_id, date_str))
        else:
            cursor.execute("""
                SELECT * FROM food_logs
                WHERE user_id = ?
                ORDER BY logged_at DESC
                LIMIT 100
            """, (user_id,))
        
        logs = cursor.fetchall()
        return [dict(log) for log in logs]
    
    def get_daily_summary(self, user_id: int, date_str: str = None) -> Dict[str, Any]:
        """Get daily nutrition summary"""
        if not date_str:
            date_str = date.today().isoformat()
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT 
                SUM(calories) as total_calories,
                SUM(protein_g) as total_protein,
                SUM(carbs_g) as total_carbs,
                SUM(fats_g) as total_fats,
                SUM(fiber_g) as total_fiber
            FROM food_logs
            WHERE user_id = ? AND date = ?
        """, (user_id, date_str))
        
        summary = cursor.fetchone()
        
        # Get water intake
        cursor.execute("""
            SELECT SUM(amount_ml) as total_water
            FROM water_logs
            WHERE user_id = ? AND date = ?
        """, (user_id, date_str))
        
        water = cursor.fetchone()
        
        return {
            "date": date_str,
            "calories": summary['total_calories'] or 0,
            "protein_g": summary['total_protein'] or 0,
            "carbs_g": summary['total_carbs'] or 0,
            "fats_g": summary['total_fats'] or 0,
            "fiber_g": summary['total_fiber'] or 0,
            "water_ml": water['total_water'] or 0
        }
    
    def log_weight(self, user_id: int, weight_kg: float, notes: str = None) -> Dict[str, Any]:
        """Log weight entry"""
        try:
            now = datetime.now()
            logged_at = now.isoformat()
            date_str = now.date().isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO weight_logs (user_id, weight_kg, logged_at, date, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, weight_kg, logged_at, date_str, notes))
            
            log_id = cursor.lastrowid
            
            # Update current weight in profile
            cursor.execute("""
                UPDATE user_profiles SET current_weight_kg = ?, updated_at = ?
                WHERE user_id = ?
            """, (weight_kg, logged_at, user_id))
            
            self.conn.commit()
            
            return {
                "success": True,
                "log_id": log_id,
                "message": "Weight logged successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_weight_logs(self, user_id: int, limit: int = 30) -> List[Dict[str, Any]]:
        """Get weight logs for a user"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM weight_logs
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT ?
        """, (user_id, limit))
        
        logs = cursor.fetchall()
        return [dict(log) for log in logs]
    
    def log_water(self, user_id: int, amount_ml: int) -> Dict[str, Any]:
        """Log water intake"""
        try:
            now = datetime.now()
            logged_at = now.isoformat()
            date_str = now.date().isoformat()
            
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO water_logs (user_id, amount_ml, logged_at, date)
                VALUES (?, ?, ?, ?)
            """, (user_id, amount_ml, logged_at, date_str))
            
            log_id = cursor.lastrowid
            self.conn.commit()
            
            return {
                "success": True,
                "log_id": log_id,
                "message": "Water logged successfully"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_water_logs(self, user_id: int, date_str: str = None) -> List[Dict[str, Any]]:
        """Get water logs for a user"""
        cursor = self.conn.cursor()
        
        if date_str:
            cursor.execute("""
                SELECT * FROM water_logs
                WHERE user_id = ? AND date = ?
                ORDER BY logged_at DESC
            """, (user_id, date_str))
        else:
            cursor.execute("""
                SELECT * FROM water_logs
                WHERE user_id = ?
                ORDER BY logged_at DESC
                LIMIT 100
            """, (user_id,))
        
        logs = cursor.fetchall()
        return [dict(log) for log in logs]
    
    def delete_food_log(self, user_id: int, log_id: int) -> bool:
        """Delete a food log entry"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                DELETE FROM food_logs
                WHERE id = ? AND user_id = ?
            """, (log_id, user_id))
            
            self.conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            return False

