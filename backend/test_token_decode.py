"""
Test script to decode and validate JWT token from frontend
"""
from main import app
from flask_jwt_extended import decode_token
import sys

def test_token(token_string):
    """Test if a token is valid"""
    with app.app_context():
        try:
            # Decode the token
            decoded = decode_token(token_string)
            print("=" * 60)
            print("TOKEN DECODED SUCCESSFULLY")
            print("=" * 60)
            print(f"User ID (sub): {decoded.get('sub')}")
            print(f"Type: {decoded.get('type')}")
            print(f"Issued at (iat): {decoded.get('iat')}")
            print(f"Expires (exp): {decoded.get('exp')}")
            print(f"JTI: {decoded.get('jti')}")
            print(f"Fresh: {decoded.get('fresh')}")
            print("=" * 60)
            print("TOKEN IS VALID ✓")
            return True
        except Exception as e:
            print("=" * 60)
            print("TOKEN VALIDATION FAILED")
            print("=" * 60)
            print(f"Error: {e}")
            print(f"Error type: {type(e).__name__}")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_token_decode.py <token>")
        print("Or paste token when prompted:")
        token = input("Token: ").strip()
    else:
        token = sys.argv[1]
    
    test_token(token)
