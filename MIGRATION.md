# Chuyển Database Supabase → Firebase (Firestore)

Tài liệu hướng dẫn các bước thủ công cần làm. Phần code đã được viết sẵn.

## 1. Tạo Firebase project

1. Truy cập https://console.firebase.google.com → **Add project**.
2. Tên gợi ý: `hoc-vien-manager`. Không bật Google Analytics (không cần).
3. Sau khi tạo xong, vào **Build → Firestore Database → Create database**:
   - Chọn **Production mode**.
   - Location: `asia-southeast1` (Singapore, gần VN nhất).
4. Vào **Build → Authentication → Get started**:
   - Bật provider **Email/Password**.
   - Tab **Users → Add user**:
     - Email: `nguyenthanhdat.lamson@gmail.com`
     - Password: `Cqt@263`

## 2. Lấy Firebase Web config

Firebase Console → ⚙️ **Project settings** → tab **General** → cuộn xuống **Your apps** → bấm biểu tượng `</>` (Web) → đặt nickname bất kỳ → **Register app** → copy object `firebaseConfig`.

Tạo file `.env` ở thư mục gốc dựa trên [.env.example](.env.example):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=hoc-vien-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hoc-vien-manager
VITE_FIREBASE_STORAGE_BUCKET=hoc-vien-manager.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...

# giữ lại 2 dòng Supabase cũ để script migration đọc được
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3. Tạo service-account (chỉ dùng cho migration)

Firebase Console → ⚙️ **Project settings** → tab **Service accounts** → **Generate new private key** → lưu file JSON vào thư mục gốc với tên chính xác `firebase-service-account.json`.

File này đã được thêm vào [.gitignore](.gitignore).

## 4. Cài dependencies

```bash
npm install
npm install -g firebase-tools   # nếu chưa có
```

## 5. Deploy Firestore rules & indexes

```bash
firebase login
firebase use --add            # chọn project hoc-vien-manager
firebase deploy --only firestore
```

## 6. Chạy migration

```bash
npm run migrate:firebase
```

Script sẽ in số dòng đã đọc & ghi cho mỗi bảng. Đối chiếu với Supabase để chắc chắn không thiếu.

## 7. Smoke test

```bash
npm run dev
```

Kiểm tra:
- Đăng nhập bằng `admin` / `Cqt@263`.
- Thêm / sửa / xoá 1 học viên.
- Thêm 1 khoản học phí.
- Tạo 1 khuyến mãi.
- Mở tab khác và F5 — dữ liệu phải hiện **tức thì** (offline cache).

## 8. Deploy lên Vercel

Trên Vercel Dashboard → Project → Settings → Environment Variables:
- Thêm đủ 6 biến `VITE_FIREBASE_*`.
- Xoá `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (sau khi xác nhận prod ổn định).

Redeploy.

## 9. Dọn dẹp (sau 1–2 tuần chạy ổn)

```bash
npm uninstall @supabase/supabase-js
rm src/lib/supabase.js src/scripts/migrate-to-firebase.js
```

Xoá file `firebase-service-account.json` khỏi local. Archive Supabase project (giữ backup lạnh).

---

## Cấu trúc Firestore

| Collection | Doc ID | Ghi chú |
|---|---|---|
| `classes` | text (giữ nguyên từ Supabase) | `schedule` là map |
| `students` | text | `statusHistory` là array |
| `fees` | text | |
| `extra_attendance` | text | `changeHistory`, `recurringPattern` là object |
| `holidays` | text | |
| `promotions` | auto | `excludedStudentIds` là array |
| `student_promotions` | auto | |
| `messages` | auto | |
| `backups` | auto | `data` là map lớn |

Toàn bộ field đã được chuyển sang **camelCase**. Timestamp (`createdAt`, `updatedAt`) lưu dưới dạng **ISO string** (không phải Firestore Timestamp) để giữ tương thích với logic ngày giờ hiện có.

## Security Rules

`read: public`, `write: yêu cầu đăng nhập Firebase Auth`. Xem [firestore.rules](firestore.rules).
