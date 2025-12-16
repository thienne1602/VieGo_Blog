# Hướng Dẫn Sử Dụng GIF Stickers - VieGo Blog

## 📁 Vị trí các GIF Stickers

Tất cả GIF stickers được lưu trong thư mục: `/frontend/public/assets/stickers/`

## 🎨 Danh sách GIF có sẵn:

1. **đăng nhập.gif** - Hiển thị khi người dùng đăng nhập
2. **đăng kí.gif** - Hiển thị khi người dùng đăng ký
3. **đăng xuất.gif** - Hiển thị khi người dùng đăng xuất
4. **đang tải.gif** - Loading animation nhỏ
5. **đang tải 2.gif** - Loading animation lớn hơn
6. **đặt thành công.gif** - Hiển thị khi đặt tour thành công
7. **vị trí.gif** - Icon vị trí động

## 💡 Cách sử dụng trong Components

### 1. Sử dụng trực tiếp trong JSX/TSX:

```tsx
<img
  src="/assets/stickers/dang-tai-2.gif"
  alt="Loading"
  className="w-24 h-24 object-contain"
/>
```

### 2. Sử dụng LoadingGif Component:

```tsx
import LoadingGif from "@/components/common/LoadingGif";

// Trong component:
<LoadingGif size="lg" message="Đang tải..." />;
```

**Sizes có sẵn:**

- `sm`: 32x32px (w-8 h-8)
- `md`: 64x64px (w-16 h-16) - Default
- `lg`: 96x96px (w-24 h-24)
- `xl`: 128x128px (w-32 h-32)

### 3. Trong các trang đã được cập nhật:

#### Welcome Page (`/welcome`)

- Hiển thị GIF đăng nhập/đăng ký tùy theo tab
- Loading GIF khi submit form

#### Home Page (`/`)

- Loading GIF khi kiểm tra authentication

#### Booking Success Modal

- GIF đặt tour thành công

#### Booking Page

- Loading GIF khi tải thông tin tour

## 🎨 Màu sắc Pastel mới

Website đã được cập nhật với bộ màu pastel sinh động:

### Primary Colors:

- **Pastel Mint Green** (#A8D5BA) - Màu chủ đạo
- **Pastel Pink** (#FFB6C1) - Màu accent
- **Pastel Lavender** (#B4A7D6) - Màu phụ
- **Pastel Peach** (#FFD4A3) - Màu tertiary
- **Pastel Sky Blue** (#A3D5FF) - Màu info

### Neutral Colors:

- **Warm Off-White** (#FAF9F6) - Background

## 📋 Các vị trí đã áp dụng GIF:

✅ Trang Welcome/Login/Register
✅ Trang Home (Loading state)
✅ Booking Success Modal
✅ Booking Page (Loading state)
✅ LoadingGif Component (tái sử dụng)

## 🚀 Gợi ý vị trí có thể áp dụng thêm:

- [ ] Profile page (loading states)
- [ ] Tour list page (loading states)
- [ ] Messages/Chat (sending states)
- [ ] Post creation/editing (uploading states)
- [ ] Map components (vị trí.gif)
- [ ] Logout confirmation modal (đăng xuất.gif)
- [ ] Settings page (các animations khác)

## 💻 Best Practices:

1. **Kích thước**: Sử dụng size phù hợp với context

   - Loading toàn trang: `lg` hoặc `xl`
   - Loading inline: `sm` hoặc `md`

2. **Alt text**: Luôn thêm alt text mô tả cho accessibility

3. **Performance**: GIF được optimize, không cần lazy loading cho các GIF nhỏ

4. **Dark mode**: GIF hoạt động tốt với cả light và dark mode

## 🎯 Ví dụ sử dụng:

### Loading State:

```tsx
{
  loading && (
    <div className="flex flex-col items-center">
      <img
        src="/assets/stickers/dang-tai-2.gif"
        alt="Loading"
        className="w-24 h-24 object-contain mb-2"
      />
      <p className="text-gray-600">Đang xử lý...</p>
    </div>
  );
}
```

### Success Message:

```tsx
{
  success && (
    <div className="text-center">
      <img
        src="/assets/stickers/dat-thanh-cong.gif"
        alt="Success"
        className="w-32 h-32 mx-auto mb-4"
      />
      <h3 className="text-2xl font-bold">Thành công!</h3>
    </div>
  );
}
```

### Location Marker:

```tsx
<div className="flex items-center gap-2">
  <img src="/assets/stickers/vị trí.gif" alt="Location" className="w-6 h-6" />
  <span>Hà Nội, Việt Nam</span>
</div>
```

---

**Note**: Tất cả các thay đổi đã được áp dụng với bộ màu pastel mới trong Tailwind config và global CSS.
