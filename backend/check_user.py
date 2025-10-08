from models.user import User, db
from main import app

app.app_context().push()

# Get first user
user = User.query.first()
if user:
    print(f'User: {user.username}')
    print(f'User ID: {user.id}')
    
    # Check columns
    columns = [c.name for c in User.__table__.columns]
    print(f'\nDatabase columns: {columns}')
    
    # Check if columns exist
    print(f'\nHas is_verified in DB: {"is_verified" in columns}')
    print(f'Has email_verified in DB: {"email_verified" in columns}')
    
    # Try to access
    try:
        print(f'\nUser is_verified value: {user.is_verified}')
    except Exception as e:
        print(f'Error accessing is_verified: {e}')
    
    try:
        print(f'User password check works: {user.check_password("test")}')
    except Exception as e:
        print(f'Error checking password: {e}')
else:
    print('No users found')
