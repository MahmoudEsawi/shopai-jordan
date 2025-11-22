#!/usr/bin/env python3
"""
Payment Service
Handles Stripe payment integration
"""

import os
import stripe
from typing import Dict, Optional, Any
from dotenv import load_dotenv

load_dotenv()

# Initialize Stripe (set your secret key in environment)
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')


class PaymentService:
    """Handles payment processing with Stripe"""
    
    def __init__(self):
        self.stripe_enabled = bool(stripe.api_key)
        if not self.stripe_enabled:
            print("Warning: Stripe API key not set. Payment features will be disabled.")
    
    def create_payment_intent(self, amount: float, currency: str = 'jod', 
                              metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a Stripe payment intent
        
        Args:
            amount: Amount in currency's smallest unit (e.g., fils for JOD)
            currency: Currency code (default: 'jod')
            metadata: Additional metadata to attach
        
        Returns:
            Payment intent object or error
        """
        if not self.stripe_enabled:
            return {
                "success": False,
                "error": "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
            }
        
        try:
            # Convert JOD to fils (multiply by 1000)
            # For other currencies, adjust multiplier
            amount_in_smallest_unit = int(amount * 1000) if currency.lower() == 'jod' else int(amount * 100)
            
            intent_params = {
                'amount': amount_in_smallest_unit,
                'currency': currency.lower(),
                'payment_method_types': ['card'],
            }
            
            if metadata:
                intent_params['metadata'] = metadata
            
            intent = stripe.PaymentIntent.create(**intent_params)
            
            return {
                "success": True,
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency
            }
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Payment error: {str(e)}"
            }
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a payment intent"""
        if not self.stripe_enabled:
            return {
                "success": False,
                "error": "Stripe is not configured"
            }
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "success": True,
                "status": intent.status,
                "payment_intent_id": intent.id,
                "amount": intent.amount / 1000 if intent.currency == 'jod' else intent.amount / 100,
                "currency": intent.currency
            }
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def handle_webhook(self, payload: bytes, signature: str, webhook_secret: str) -> Dict[str, Any]:
        """
        Handle Stripe webhook events
        
        Args:
            payload: Raw webhook payload
            signature: Stripe signature header
            webhook_secret: Webhook signing secret
        
        Returns:
            Event data or error
        """
        if not self.stripe_enabled:
            return {
                "success": False,
                "error": "Stripe is not configured"
            }
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            
            # Handle the event
            if event['type'] == 'payment_intent.succeeded':
                payment_intent = event['data']['object']
                return {
                    "success": True,
                    "event_type": "payment_intent.succeeded",
                    "payment_intent_id": payment_intent['id'],
                    "status": payment_intent['status'],
                    "amount": payment_intent['amount'] / 1000 if payment_intent['currency'] == 'jod' else payment_intent['amount'] / 100
                }
            elif event['type'] == 'payment_intent.payment_failed':
                payment_intent = event['data']['object']
                return {
                    "success": False,
                    "event_type": "payment_intent.payment_failed",
                    "payment_intent_id": payment_intent['id'],
                    "error": payment_intent.get('last_payment_error', {}).get('message', 'Payment failed')
                }
            else:
                return {
                    "success": True,
                    "event_type": event['type'],
                    "message": f"Unhandled event type: {event['type']}"
                }
        except ValueError as e:
            return {
                "success": False,
                "error": f"Invalid payload: {str(e)}"
            }
        except stripe.error.SignatureVerificationError as e:
            return {
                "success": False,
                "error": f"Invalid signature: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Webhook error: {str(e)}"
            }
    
    def is_enabled(self) -> bool:
        """Check if Stripe is enabled"""
        return self.stripe_enabled

