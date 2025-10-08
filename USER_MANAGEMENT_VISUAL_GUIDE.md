# User Management Visual Guide

## 🎨 UI Overview

### Users Table Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  👥 Danh Sách Người Dùng (150)                                          │
├──────────┬────────┬───────┬─────────┬────────┬──────────────────────────┤
│   User   │  Role  │ Posts │ Joined  │ Status │        Actions           │
├──────────┼────────┼───────┼─────────┼────────┼──────────────────────────┤
│ 👤 John  │ [User] │   12  │ Jan 15  │ Active │ 👁️ ✏️ 🚫 🗑️              │
│ @john    │        │       │  2024   │        │                          │
├──────────┼────────┼───────┼─────────┼────────┼──────────────────────────┤
│ 👤 Sarah │ [Admin]│   45  │ Dec 01  │ Active │ 👁️ ✏️ 🚫 🗑️              │
│ @sarah   │        │       │  2023   │        │                          │
├──────────┼────────┼───────┼─────────┼────────┼──────────────────────────┤
│ 👤 Mike  │ [Mod]  │   8   │ Mar 20  │ Banned │ 👁️ ✏️ ✅ 🗑️              │
│ @mike    │        │       │  2024   │        │                          │
└──────────┴────────┴───────┴─────────┴────────┴──────────────────────────┘
```

---

## 🔍 View User Details Modal

```
╔══════════════════════════════════════════════════════════════╗
║  👥 User Details                                       [X]   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────┐                                                  ║
║  │        │   John Doe                                       ║
║  │  👤    │   @johndoe                                       ║
║  │        │   [User] [Active]                                ║
║  └────────┘                                                  ║
║                                                              ║
║  ┌──────────────┬──────────────┐                            ║
║  │ Email        │ Location     │                            ║
║  │ john@mail.com│ Vietnam      │                            ║
║  └──────────────┴──────────────┘                            ║
║                                                              ║
║  ┌──────────────┬──────────────┐                            ║
║  │ Posts        │ Joined       │                            ║
║  │ 12           │ Jan 15, 2024 │                            ║
║  └──────────────┴──────────────┘                            ║
║                                                              ║
║  Bio:                                                        ║
║  Travel enthusiast and food blogger...                       ║
║                                                              ║
║  ╔════════════════════════════════════════╗                 ║
║  ║  Points: 150  │  Level: 2  │  Posts: 12 ║                 ║
║  ╚════════════════════════════════════════╝                 ║
║                                                              ║
║                          [Edit User]  [Close]               ║
╚══════════════════════════════════════════════════════════════╝
```

---

## ✏️ Edit User Modal

```
╔══════════════════════════════════════════════════════════════╗
║  ✏️ Edit User Profile                                  [X]   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌────────┐                                                  ║
║  │  👤    │   @johndoe                                       ║
║  └────────┘   User ID: 123                                   ║
║                                                              ║
║  Full Name                                                   ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ John Doe                                               │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  Email Address *                                             ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ john@example.com                                       │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  Bio                                                         ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ Travel enthusiast and food blogger                     │ ║
║  │                                                        │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  Location                                                    ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ Ho Chi Minh City, Vietnam                              │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  User Role                                                   ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ Moderator                               ▼              │ ║
║  └────────────────────────────────────────────────────────┘ ║
║  ⚠️ Warning: Changing user role will affect permissions     ║
║                                                              ║
║                              [Cancel]  [Save Changes]       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## ⚠️ Confirmation Modal (Ban User)

```
╔═══════════════════════════════════════════════════╗
║  ⚠️ Ban User                                      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Are you sure you want to ban this user?          ║
║  They will not be able to access the platform.    ║
║                                                   ║
║                        [Cancel]  [Confirm]        ║
╚═══════════════════════════════════════════════════╝
```

---

## 🗑️ Confirmation Modal (Delete User)

```
╔═══════════════════════════════════════════════════╗
║  ⚠️ Delete User                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Are you sure you want to delete this user?       ║
║  This action cannot be undone and will remove     ║
║  all their content.                               ║
║                                                   ║
║                        [Cancel]  [Confirm]        ║
╚═══════════════════════════════════════════════════╝
```

---

## 🎨 Action Button Color Codes

### Active User Actions

```
┌────────────────────────────────────────┐
│  👁️ View    - Blue    (info)           │
│  ✏️ Edit    - Green   (success)        │
│  🚫 Ban     - Orange  (warning)        │
│  🗑️ Delete  - Red     (danger)         │
└────────────────────────────────────────┘
```

### Banned User Actions

```
┌────────────────────────────────────────┐
│  👁️ View    - Blue    (info)           │
│  ✏️ Edit    - Green   (success)        │
│  ✅ Unban   - Green   (success)        │
│  🗑️ Delete  - Red     (danger)         │
└────────────────────────────────────────┘
```

---

## 📊 Role Badge Colors

```
┌─────────────────────────────────────┐
│  [Admin]      - Red background      │
│  [Moderator]  - Yellow background   │
│  [User]       - Green background    │
│  [Seller]     - Purple background   │
└─────────────────────────────────────┘
```

---

## 🎯 Status Badge Colors

```
┌─────────────────────────────────────┐
│  [Active]     - Green background    │
│  [Banned]     - Red background      │
└─────────────────────────────────────┘
```

---

## 🔔 Toast Notifications

### Success Toast (Green)

```
╔═════════════════════════════════════════════════╗
║  ✅ User updated successfully              [X]  ║
╚═════════════════════════════════════════════════╝
```

### Error Toast (Red)

```
╔═════════════════════════════════════════════════╗
║  ❌ Failed to update user                  [X]  ║
╚═════════════════════════════════════════════════╝
```

---

## 🖱️ Hover Effects

### Button Hover States

```
Normal State:       Hover State:
┌──────────┐        ┌──────────┐
│    👁️    │   →    │    👁️    │  (Blue background)
└──────────┘        └──────────┘

┌──────────┐        ┌──────────┐
│    ✏️    │   →    │    ✏️    │  (Green background)
└──────────┘        └──────────┘

┌──────────┐        ┌──────────┐
│    🚫    │   →    │    🚫    │  (Orange background)
└──────────┘        └──────────┘

┌──────────┐        ┌──────────┐
│    🗑️    │   →    │    🗑️    │  (Red background)
└──────────┘        └──────────┘
```

---

## 🎬 Animation Sequence

### Modal Opening

```
Step 1: Background fades in (0.3s)
┌─────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  Black overlay: 0% → 50%
└─────────────────────────────┘

Step 2: Modal scales up (0.3s)
        ╔═══════╗
        ║       ║  Scale: 0.9 → 1.0
        ╚═══════╝  Opacity: 0 → 100%

Step 3: Content renders
╔═════════════════════════════╗
║  [Modal Content]            ║
╚═════════════════════════════╝
```

### Toast Notification

```
Step 1: Slide in from top
       ↓
╔═════════════════════════════╗
║  ✅ Success message          ║
╚═════════════════════════════╝

Step 2: Stay visible (3 seconds)

Step 3: Fade out
       ↑
```

---

## 📱 Responsive Design

### Desktop View (1920px)

```
┌──────────────────────────────────────────────────────┐
│  Sidebar │         Main Content Area                 │
│          │                                            │
│  [Nav]   │  ┌────────────────────────────────────┐   │
│          │  │  Users Table (Full Width)          │   │
│  [Nav]   │  │                                    │   │
│          │  │  [User Row 1]                      │   │
│  [Nav]   │  │  [User Row 2]                      │   │
│          │  │  [User Row 3]                      │   │
│  [Nav]   │  └────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Tablet View (768px)

```
┌──────────────────────────────────────┐
│  Sidebar │   Main Content            │
│          │                            │
│  [Nav]   │  ┌──────────────────────┐ │
│          │  │  Users Table         │ │
│  [Nav]   │  │  (Scrollable)        │ │
│          │  │                      │ │
│  [Nav]   │  └──────────────────────┘ │
└──────────────────────────────────────┘
```

### Mobile View (375px)

```
┌─────────────────────┐
│  ☰  VieGo Admin     │
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │ Users Table   │  │
│  │ (Horizontal   │  │
│  │  Scroll)      │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

---

## 🎨 Color Palette

### Primary Colors

```
Blue    - #2563EB  (Primary actions)
Green   - #10B981  (Success/Active)
Orange  - #F59E0B  (Warning)
Red     - #EF4444  (Danger/Error)
Yellow  - #F59E0B  (Moderator badge)
Purple  - #8B5CF6  (Seller badge)
```

### Neutral Colors

```
Gray-50  - #F9FAFB  (Backgrounds)
Gray-100 - #F3F4F6  (Borders)
Gray-600 - #4B5563  (Secondary text)
Gray-900 - #111827  (Primary text)
```

---

## 🖼️ Modal Layouts

### Layout Hierarchy

```
Root Container (100vw x 100vh)
└── Overlay (Black 50% opacity)
    └── Modal Container (centered)
        ├── Header Section
        │   ├── Icon + Title
        │   └── Close Button
        ├── Content Section
        │   ├── Form/Information
        │   └── Additional Details
        └── Footer Section
            └── Action Buttons
```

---

## 🎯 User Journey Visualization

### Edit User Flow

```
Table Row
    ↓
[Click Edit Button]
    ↓
Modal Opens (Animation)
    ↓
Fill Form Fields
    ↓
[Click Save]
    ↓
Loading State
    ↓
Success Toast
    ↓
Modal Closes (Animation)
    ↓
Table Refreshes
```

### Ban User Flow

```
Table Row
    ↓
[Click Ban Button]
    ↓
Confirmation Modal Opens
    ↓
Read Warning
    ↓
[Click Confirm]
    ↓
API Call
    ↓
Success Toast
    ↓
Status Badge Updates (Green → Red)
    ↓
Button Changes (Ban → Unban)
```

---

## 📐 Spacing & Sizing

### Modal Dimensions

```
EditUserModal:    max-w-2xl  (672px)
ViewUserModal:    max-w-3xl  (768px)
ConfirmModal:     max-w-md   (448px)
```

### Button Sizes

```
Icon Buttons:     w-4 h-4  (16px)
Regular Buttons:  px-4 py-2
Large Buttons:    px-6 py-3
```

### Spacing

```
Between buttons:  space-x-2  (8px)
Modal padding:    p-6       (24px)
Form fields:      space-y-4 (16px)
```

---

## 🎨 Typography

### Font Sizes

```
Heading (h1):     text-2xl  (24px)
Heading (h3):     text-xl   (20px)
Heading (h4):     text-lg   (18px)
Body:             text-base (16px)
Small:            text-sm   (14px)
Tiny:             text-xs   (12px)
```

### Font Weights

```
Bold:       font-bold      (700)
Semibold:   font-semibold  (600)
Medium:     font-medium    (500)
Regular:    font-normal    (400)
```

---

## 📊 Data Display Formats

### Date Format

```
Created At:  Jan 15, 2024  (vi-VN locale)
Updated At:  15/01/2024    (dd/mm/yyyy)
```

### Numbers

```
Points:      1,234        (with thousands separator)
Posts Count: 12           (integer)
Level:       2            (integer)
```

---

## 🎯 Focus States

### Form Inputs

```
Normal:   border-gray-300
Focus:    ring-2 ring-blue-500 border-transparent
Error:    border-red-500 ring-2 ring-red-500
```

### Buttons

```
Normal:   background color
Focus:    outline ring
Active:   darker shade
Disabled: opacity-50 cursor-not-allowed
```

---

This visual guide provides a complete overview of the user management interface design and user experience flow.
