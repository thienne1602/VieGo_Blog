"""
Decode JWT token to check user_id
"""
import jwt
import sys

if len(sys.argv) < 2:
    print("Usage: python decode_token.py <token>")
    print("\nToken can be found in browser console:")
    print("localStorage.getItem('access_token_3000')")
    sys.exit(1)

token = sys.argv[1]

# VieGo uses HS256 with a secret key
# We need to know the secret to decode, but we can decode without verification
try:
    # Decode without verification (just to see content)
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("\n✅ JWT Token Decoded:")
    print(f"   User ID (sub): {decoded.get('sub')}")
    print(f"   Full payload: {decoded}")
except Exception as e:
    print(f"❌ Error decoding token: {e}")
