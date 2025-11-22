#!/usr/bin/env python3
"""
Standardized API Error Handler
Provides consistent error responses across all endpoints
"""

from flask import jsonify
from typing import Optional, Dict, Any


class APIError(Exception):
    """Base API Error class"""
    def __init__(self, message: str, status_code: int = 400, details: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class BadRequestError(APIError):
    """400 Bad Request"""
    def __init__(self, message: str = "Bad Request", details: Optional[str] = None):
        super().__init__(message, 400, details)


class UnauthorizedError(APIError):
    """401 Unauthorized"""
    def __init__(self, message: str = "Authentication required", details: Optional[str] = None):
        super().__init__(message, 401, details)


class ForbiddenError(APIError):
    """403 Forbidden"""
    def __init__(self, message: str = "Forbidden", details: Optional[str] = None):
        super().__init__(message, 403, details)


class NotFoundError(APIError):
    """404 Not Found"""
    def __init__(self, message: str = "Resource not found", details: Optional[str] = None):
        super().__init__(message, 404, details)


class InternalServerError(APIError):
    """500 Internal Server Error"""
    def __init__(self, message: str = "Internal server error", details: Optional[str] = None):
        super().__init__(message, 500, details)


def error_response(error: APIError, include_details: bool = True) -> tuple:
    """
    Create standardized error response
    
    Args:
        error: APIError instance
        include_details: Whether to include details (only in development)
    
    Returns:
        Tuple of (response, status_code)
    """
    response = {
        "message": error.message,
        "statusCode": error.status_code
    }
    
    # Only include details in development or if explicitly requested
    import os
    if include_details and (os.getenv('FLASK_ENV') == 'development' or error.details):
        response["Details"] = error.details or str(error)
    
    return jsonify(response), error.status_code


def handle_error(error: Exception) -> tuple:
    """
    Handle any exception and return standardized error response
    
    Args:
        error: Exception instance
    
    Returns:
        Tuple of (response, status_code)
    """
    if isinstance(error, APIError):
        return error_response(error)
    
    # Handle other exceptions
    import os
    is_development = os.getenv('FLASK_ENV') == 'development'
    
    response = {
        "message": "Internal server error",
        "statusCode": 500
    }
    
    if is_development:
        response["Details"] = str(error)
    
    return jsonify(response), 500


def success_response(data: Any = None, message: Optional[str] = None, status_code: int = 200) -> tuple:
    """
    Create standardized success response
    
    Args:
        data: Response data
        message: Optional success message
        status_code: HTTP status code
    
    Returns:
        Tuple of (response, status_code)
    """
    response = {"success": True}
    
    if message:
        response["message"] = message
    
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response["data"] = data
    
    return jsonify(response), status_code

