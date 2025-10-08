"""
JWT Utilities
Helper functions for JWT token handling
"""
from flask_jwt_extended import get_jwt_identity

def get_current_user_id():
    """
    Get current user ID from JWT token
    Handles both string and integer identity
    Returns integer user_id
    """
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return int(identity)
    return identity
