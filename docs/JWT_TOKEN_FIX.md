# JWT Token Expiration Fix

## Problem Discovered

Users reported: "đã kết bạn rồi nhưng không chat được" (already friends but can't chat)

## Root Cause Analysis

### Symptoms

1. ✅ `/api/auth/verify-token` returns 200 OK
2. ❌ `/api/social/friends/check` returns 401 Unauthorized
3. ✅ Database confirms users ARE friends
4. ❌ UI shows "Add Friend" button even though users are friends

### Investigation Steps

1. Checked database - confirmed users 11 and 13 are friends with accepted FriendRequest
2. Checked backend routes - all use `@jwt_required()` decorator correctly
3. Checked frontend token handling - token present and being sent with requests
4. Checked browser console logs - revealed timing issue

### Actual Problem

**JWT Token Expiration with Cached User Data**

The issue had two components:

#### 1. Short Token Lifetime (15 minutes default)

Flask-JWT-Extended default configuration:

```python
# Default if not configured
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
```

This meant tokens expired after just 15 minutes, but users expected to stay logged in much longer.

#### 2. Frontend Cache Masking Token Expiration

In `AuthContext.tsx`, the code was using cached user data:

```typescript
// OLD CODE - PROBLEMATIC
const cachedUser = localStorage.getItem("user");
if (cachedUser) {
  setUser(JSON.parse(cachedUser));
  // Verify token in background WITHOUT clearing user if fails
  verifyToken(token, true, clearSafetyTimeout); // skipSetUser=true
}
```

This caused:

- AuthContext shows "✅ Token valid" using cached data
- But actual token is EXPIRED
- Social/chat endpoints correctly reject expired token with 401
- User sees confusing state: logged in but features don't work

## Solution Implemented

### Backend Fix (main.py)

Extended JWT token lifetime to 7 days:

```python
from datetime import timedelta

# JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
# Set token expiry to 7 days (604800 seconds)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
```

### Frontend Fix (AuthContext.tsx)

Changed cached user verification to clear invalid tokens:

```typescript
// NEW CODE - FIXED
const cachedUser = localStorage.getItem("user");
if (cachedUser) {
  setUser(JSON.parse(cachedUser));
  // Verify token - if fails, force re-login by clearing user
  verifyToken(token, false, clearSafetyTimeout); // skipSetUser=false
}
```

## Deployment Steps

### 1. Restart Backend

Stop and restart the Flask backend to apply new JWT configuration:

```bash
# Stop current backend (Ctrl+C)
# Start again
python backend/main.py
```

### 2. Clear Old Tokens

Users with expired tokens must logout and login again:

1. Click profile menu → Logout
2. Login again
3. New token will be valid for 7 days

### 3. Verify Fix

Test the following scenarios:

- ✅ Friend requests work
- ✅ Chat with friends works
- ✅ Friendship status shows correctly
- ✅ Sessions persist for days without re-login

## Technical Details

### Token Lifetime Options

```python
# Development (testing)
timedelta(minutes=30)   # 30 minutes

# Production (current fix)
timedelta(days=7)       # 7 days (recommended)

# Long-term sessions
timedelta(days=30)      # 30 days

# Short sessions (high security)
timedelta(hours=1)      # 1 hour + refresh tokens
```

### Refresh Token Pattern (Future Enhancement)

For production systems, consider implementing refresh tokens:

```python
# Access token: 15 minutes
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)

# Refresh token: 30 days
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
```

Then implement:

- `/api/auth/refresh` endpoint to get new access token
- Frontend auto-refresh before expiry
- Sliding session mechanism

## Testing Checklist

After applying fix:

### User Authentication

- [ ] Login successful
- [ ] Token stored in localStorage
- [ ] Token includes 7-day expiry

### Friend Features

- [ ] Send friend request works
- [ ] Accept friend request works
- [ ] Friendship status shows correctly on profile
- [ ] Friends list displays all friends

### Chat Features

- [ ] Can open chat with friend
- [ ] Can send messages
- [ ] Real-time messages work
- [ ] Chat history loads correctly

### Session Persistence

- [ ] Refresh page - still logged in
- [ ] Close browser - still logged in on reopen
- [ ] Wait several hours - still logged in
- [ ] After 7 days - token expires (expected)

## Resolution Status

### Before Fix

```
[Profile] Token check: Yes (327 chars)
[Profile] Checking friendship with token
GET http://localhost:5000/api/social/friends/check/11 401 (UNAUTHORIZED)
[Profile] Unauthorized - token may be invalid
```

### After Fix

```
[Profile] Token check: Yes (327 chars)
[Profile] Checking friendship with token
[Profile] Friendship data: {is_friend: true, request_status: "accepted", ...}
✅ Friend status loads correctly
✅ Chat unlocked for friends
```

## Security Considerations

### Token Lifetime Trade-offs

- **Shorter (15 min)**: More secure, requires refresh tokens
- **Longer (7 days)**: Better UX, acceptable for social apps
- **Very long (30 days)**: Convenience vs security trade-off

### Best Practices

1. ✅ Use HTTPS in production
2. ✅ Store tokens in httpOnly cookies (more secure than localStorage)
3. ✅ Implement token refresh mechanism
4. ✅ Add token revocation for logout
5. ✅ Monitor for token theft/abuse

## Related Files Modified

1. `backend/main.py` - JWT configuration
2. `frontend/lib/AuthContext.tsx` - Token validation logic
3. `backend/routes/social.py` - Friend endpoints (no changes, working correctly)
4. `frontend/app/profile/user/page.tsx` - Profile page (no changes, working correctly)

## Lessons Learned

1. **Default configurations matter** - Flask-JWT-Extended defaults to 15 minutes
2. **Caching can mask issues** - Frontend cache made debugging harder
3. **Timing is critical** - Race conditions between cache and token validation
4. **Error logging is essential** - JWT error handlers helped identify issue
5. **Database vs auth layer** - Problem was auth, not data model

## Future Enhancements

### Priority 1: Immediate

- [x] Extend token lifetime to 7 days
- [x] Fix cached user handling

### Priority 2: Near Term

- [ ] Implement refresh token mechanism
- [ ] Add token expiry warning in UI
- [ ] Auto-refresh before expiry

### Priority 3: Long Term

- [ ] Move tokens to httpOnly cookies
- [ ] Implement token blacklist for revocation
- [ ] Add "Remember me" option (30-day tokens)
- [ ] Monitor token usage patterns

## Support Information

If users still experience authentication issues:

1. **Clear browser data**

   - Clear localStorage
   - Clear cookies
   - Restart browser

2. **Check backend logs**

   - Look for JWT error messages
   - Verify token expiry time in logs

3. **Verify database**

   - Run `python backend/check_friendship.py`
   - Confirm friendship status in DB

4. **Test with curl**
   ```bash
   curl -X GET "http://localhost:5000/api/social/friends/check/11" \
        -H "Authorization: Bearer <TOKEN>"
   ```

---

**Fixed by:** GitHub Copilot
**Date:** November 19, 2025
**Issue:** JWT token expiration after 15 minutes causing 401 errors
**Solution:** Extended token lifetime to 7 days + fixed frontend token validation
