# Hướng dẫn Git cho nhóm

## Người trưởng nhóm làm một lần
1. Tạo repo trống trên GitHub (không tích "Add README"), mời các bạn làm thành viên (Settings > Collaborators).
2. Trong thư mục `recipe-share`:
```
git init
git add .
git status          # KIỂM TRA: không được thấy .env và node_modules
git commit -m "Khởi tạo dự án"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
git push -u origin main
```

## Mỗi thành viên làm
```
git clone https://github.com/<tài-khoản>/<tên-repo>.git
cd <tên-repo>
git checkout -b ten-chuc-nang        # ví dụ: binh-luan
# ... sửa code phần của mình ...
git add .
git commit -m "Thêm chức năng sửa bình luận"
git push -u origin ten-chuc-nang
```
Sau đó vào GitHub, bấm **Compare & pull request**, nhờ trưởng nhóm duyệt rồi **Merge**. Lần sau: `git checkout main`, `git pull`, rồi tạo nhánh mới.

## Quy tắc để lịch sử commit đẹp
- Commit nhỏ, thường xuyên, mỗi lần một việc, tin nhắn commit nói rõ làm gì.
- Mỗi người commit bằng tài khoản của mình (`git config user.name` và `user.email` đúng với GitHub).
- Phần ai làm thì người đó commit, khớp với bảng phân công trong README.
- Không bao giờ commit `.env`. Nếu lỡ đẩy, đổi ngay JWT_SECRET và mật khẩu database.
