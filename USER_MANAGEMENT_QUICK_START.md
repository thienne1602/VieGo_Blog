# User Management Quick Start Guide

## 🎯 Overview

The Admin Dashboard now includes comprehensive user management capabilities. This guide will help you quickly get started with managing users.

## 🚀 Accessing User Management

1. **Login as Admin/Moderator**

   ```
   http://localhost:3000/login
   ```

   Use admin credentials from your database

2. **Navigate to Admin Dashboard**

   ```
   http://localhost:3000/dashboard/admin
   ```

3. **Click "Quản Lý Users" in sidebar**

## ✨ Available Actions

### 1. View User Details 👁️

**Purpose:** See complete user profile and statistics

**Steps:**

1. Click the blue **Eye icon** next to any user
2. View modal shows:
   - Profile information (avatar, name, email, location)
   - Role and status badges
   - User statistics (points, level, posts)
   - Bio and additional details
3. Click "Edit User" to modify or "Close" to exit

**Tip:** Great for quickly checking user information before taking actions

---

### 2. Edit User Profile ✏️

**Purpose:** Modify user information and change roles

**Steps:**

1. Click the green **Edit icon** next to any user
2. Edit any of these fields:
   - Full Name
   - Email Address (required)
   - Bio (multi-line text)
   - Location
   - User Role (User, Moderator, Admin, Seller)
3. Review warning if role is changed
4. Click "Save Changes"

**Role Options:**

- **User:** Regular user (default)
- **Moderator:** Can moderate content
- **Admin:** Full system access
- **Seller:** Can sell tours/NFTs

**Warning:** Changing roles affects user permissions immediately!

---

### 3. Ban User 🚫

**Purpose:** Temporarily disable user access

**Steps:**

1. Click the orange **Ban icon** next to an active user
2. Read confirmation modal:
   - "Ban User"
   - Warning message about access restriction
3. Click "Confirm" to proceed or "Cancel" to abort
4. User status changes to "Banned"
5. Success toast notification appears

**Effect:** User cannot login or access the platform

---

### 4. Unban User ✅

**Purpose:** Restore user access

**Steps:**

1. Click the green **CheckCircle icon** next to a banned user
2. Action is immediate (no confirmation needed)
3. User status changes to "Active"
4. Success toast notification appears

**Effect:** User can login and access the platform again

---

### 5. Delete User 🗑️

**Purpose:** Remove user from the system

**Steps:**

1. Click the red **Trash icon** next to any user
2. Read confirmation modal:
   - "Delete User"
   - Warning: "This action cannot be undone and will remove all their content"
3. Click "Confirm" to proceed or "Cancel" to abort
4. User is removed (soft delete)
5. Success toast notification appears

**Note:** This is a soft delete - user is marked inactive but data is preserved

---

## 🔍 Search & Filter

### Search Users

- Type in search box to find users by:
  - Username
  - Email address
  - Full name
- Search updates automatically as you type

### Filter by Role

- Select from dropdown:
  - Tất cả roles (All)
  - Admin
  - Moderator
  - User
  - Seller

### Filter by Status

- Select from dropdown:
  - Tất cả status (All)
  - Active
  - Banned

### Pagination

- Navigate through pages using Previous/Next buttons
- Shows: "Page X of Y (Z users)"

---

## 💡 Best Practices

### Before Editing Users

1. ✅ View user details first to understand their activity
2. ✅ Check posts count before deleting
3. ✅ Consider banning instead of deleting for first offenses

### When Changing Roles

1. ⚠️ Understand permission differences
2. ⚠️ Admin role gives full system access
3. ⚠️ Changes take effect immediately
4. ✅ Test with lower-risk roles first

### When Banning Users

1. 📝 Document reason for ban (external notes)
2. 🔄 Use ban for temporary restrictions
3. ✅ Can be reversed with unban
4. 📧 Consider notifying user (future feature)

### When Deleting Users

1. ⚠️ Use as last resort
2. 💾 Data is soft-deleted (preserved)
3. 🔍 Review user's content first
4. ⏰ Consider ban as alternative

---

## 🎨 UI Elements Guide

### Status Badges

- 🟢 **Green "Active"** - User can access platform
- 🔴 **Red "Banned"** - User access disabled

### Role Badges

- 🔴 **Red "Admin"** - Full system access
- 🟡 **Yellow "Moderator"** - Content moderation
- 🟢 **Green "User"** - Regular user
- 🟣 **Purple "Seller"** - Can sell items

### Action Buttons

- 👁️ Blue - View Details
- ✏️ Green - Edit Profile
- 🚫 Orange - Ban User
- ✅ Green - Unban User
- 🗑️ Red - Delete User

All buttons have hover effects and tooltips!

---

## 🔔 Notifications

### Success Messages (Green)

- "User updated successfully"
- "User banned successfully"
- "User unbanned successfully"
- "User deleted successfully"

### Error Messages (Red)

- "Failed to update user"
- "Failed to perform action"
- "Failed to load users"

### Auto-dismiss

- All toasts disappear after 3 seconds
- Can be manually closed with X button

---

## ⚡ Keyboard Shortcuts & Tips

### Quick Actions

- **ESC key** - Close any open modal
- **Enter key** - Submit forms
- **Tab key** - Navigate between form fields

### Efficiency Tips

1. Use search to quickly find users
2. Combine filters for precise results
3. View details before editing
4. Use ban instead of delete when possible
5. Edit multiple fields in one save

---

## 🐛 Troubleshooting

### Modal Won't Open

- **Cause:** JavaScript error or state issue
- **Solution:** Refresh page (F5)

### Changes Not Saving

- **Cause:** Network error or validation
- **Solution:** Check email field is filled, retry

### Can't See Edit Button

- **Cause:** Not logged in as admin
- **Solution:** Login with admin credentials

### Filters Not Working

- **Cause:** Backend connection issue
- **Solution:** Check backend is running on port 5000

---

## 🔒 Security Notes

1. **Authentication Required**

   - All actions require valid JWT token
   - Token stored in localStorage

2. **Authorization Levels**

   - Admin: Full access to all features
   - Moderator: Can manage users and content

3. **Action Logging**

   - All actions should be logged (future feature)
   - Audit trail for compliance

4. **Data Protection**
   - Soft deletes preserve data
   - No permanent data loss
   - Can be recovered by database admin

---

## 📊 Testing Checklist

Use this checklist to verify all features:

- [ ] Login as admin
- [ ] Navigate to Users management
- [ ] Search for a user
- [ ] Filter by role
- [ ] Filter by status
- [ ] View user details
- [ ] Edit user profile
- [ ] Change user role
- [ ] Ban a user
- [ ] Unban the same user
- [ ] Delete a user (on test account only!)
- [ ] Check pagination works
- [ ] Verify toast notifications
- [ ] Test modal animations
- [ ] Confirm form validation

---

## 🎓 Training Scenarios

### Scenario 1: New User Needs Upgrade

**Goal:** Promote user to moderator

1. Search for user by username
2. Click View to verify their activity
3. Click Edit
4. Change role to "Moderator"
5. Note the warning message
6. Click Save Changes
7. Verify role badge changed to yellow

### Scenario 2: Spam Account

**Goal:** Ban spammer and clean up

1. Search for spam account
2. Click View to see post count
3. Click Ban with confirmation
4. Verify status changed to "Banned"
5. User can no longer login

### Scenario 3: User Info Update

**Goal:** Correct user information

1. Find user with wrong email
2. Click Edit
3. Update email address
4. Add missing location
5. Update bio
6. Save changes
7. Verify updates in table

### Scenario 4: Policy Violation

**Goal:** Warn then ban user

1. View user details
2. Check violation severity
3. First time: Edit profile to add warning note
4. Repeat: Ban user
5. Document reason externally

---

## 📱 Mobile Responsive

The user management interface is fully responsive:

- ✅ Tables scroll horizontally on mobile
- ✅ Modals adapt to screen size
- ✅ Touch-friendly buttons
- ✅ Readable on tablets

---

## 🔄 Next Steps

After mastering user management:

1. **Content Management** - Manage posts and comments
2. **Reports System** - Handle user reports
3. **Analytics** - View user activity trends
4. **Settings** - Configure system parameters

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend is running
3. Check JWT token is valid
4. Review USER_MANAGEMENT_FEATURES.md for details
5. Check network tab for API responses

---

## 🎉 Summary

You now have complete control over user management with:

- ✅ Professional modal interfaces
- ✅ Comprehensive edit capabilities
- ✅ Safe deletion with confirmations
- ✅ Powerful search and filters
- ✅ Real-time status updates

**Happy Managing! 🚀**
