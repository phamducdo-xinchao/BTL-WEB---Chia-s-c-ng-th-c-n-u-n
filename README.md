# Góc Bếp - Web chia sẻ công thức nấu ăn

Bài tập lớn môn Lập trình web. Ứng dụng fullstack: người dùng đăng công thức, tìm kiếm, thích, lưu, đánh giá sao, bình luận, gom vào bộ sưu tập, mua nguyên liệu trong cửa hàng (giao tận nơi hoặc đến lấy, thanh toán khi nhận hàng hoặc online mô phỏng); quản trị viên xem thống kê, quản lý người dùng, sản phẩm và đơn hàng.

**Công nghệ:** React (Vite, React Router) + Context + Zustand, Express, MongoDB (Mongoose), JWT, bcrypt.

## Đối chiếu yêu cầu của thầy

| # | Yêu cầu | Nơi thực hiện |
|---|---------|---------------|
| 1 | Frontend React, Vite, React Router, tối thiểu 6 màn hình, responsive | `client/src/pages` có 17 màn hình: Trang chủ, Chi tiết công thức, Đăng nhập, Đăng ký, Đăng/Sửa công thức, Của tôi, Bộ sưu tập, Chi tiết bộ sưu tập, Cửa hàng, Giỏ hàng, Thanh toán, Cổng thanh toán mô phỏng, Đơn hàng của tôi, Chi tiết đơn, Quản trị, Quản lý cửa hàng, 404. CSS responsive ở `index.css` |
| 2 | Quản lý state: Context cho đăng nhập; Redux Toolkit hoặc Zustand | `context/AuthContext.jsx` (đăng nhập), `store/recipeStore.js` (Zustand: danh sách, bộ lọc, phân trang), `store/cartStore.js` (Zustand: giỏ hàng, lưu trong localStorage) |
| 3 | REST API đúng method, mã trạng thái, middleware xử lý lỗi | `server/src/routes`, `server/src/middleware/error.js` (200, 201, 400, 401, 403, 404, 409) |
| 4 | MongoDB, Mongoose, tối thiểu 3 collection có quan hệ | `User`, `Recipe`, `Comment`, `Collection`, `Product`, `Order` (6 collection, xem sơ đồ bên dưới) |
| 5 | Git, README, không lộ `.env` | `.gitignore` đã loại `.env`; chỉ commit `.env.example` |
| 6 | Nâng cao: JWT, bcrypt, phân quyền, deploy | JWT ở `middleware/auth.js`, bcrypt ở `models/User.js`, vai trò `user`/`admin`; hướng dẫn deploy bên dưới |

Lưu ý: dùng thư viện `bcryptjs` (cài đặt dễ trên mọi hệ điều hành), thuật toán vẫn là bcrypt.

## Mô hình dữ liệu

```
User (name, email, password đã băm, role, savedRecipes[] -> Recipe)
Recipe (title, category, cookTime, ingredients[], steps[], author -> User, likes[] -> User, likesCount,
        ratings[] {user -> User, value 1-5}, ratingAvg, ratingCount, views)
Comment (recipe -> Recipe, user -> User, content)
Collection (name, description, owner -> User, recipes[] -> Recipe)
Product (name, price, unit, stock, active, recipes[] -> Recipe)
Order (code, user -> User, items[] {product -> Product, name, price, qty}, subtotal, shippingFee, total,
       deliveryMethod, province, address, paymentMethod, paymentStatus, status)
```

## Cửa hàng nguyên liệu

Luồng: xem công thức, bấm "Mua nguyên liệu" (hoặc vào Cửa hàng), thêm vào giỏ, thanh toán, theo dõi đơn.

- **Admin** thêm, sửa, xóa sản phẩm và gắn sản phẩm vào các công thức liên quan; cập nhật trạng thái đơn (chờ xác nhận, đang giao hoặc sẵn sàng nhận, hoàn thành, hủy).
- **Nhận hàng:** giao tận nơi (chọn một trong 34 tỉnh, thành phố và nhập địa chỉ) hoặc đến lấy tại điểm nhận hàng.
- **Phí giao:** do server tính. Nhận tại điểm: 0 đ; đơn từ 300.000 đ: miễn phí; thành phố lớn 20.000 đ; nơi khác 35.000 đ.
- **Thanh toán:** khi nhận hàng, hoặc online qua cổng **mô phỏng** (không có tiền thật). Server cấp phiên có chữ ký HMAC, hết hạn sau 10 phút, và tự kiểm tra chữ ký lẫn số tiền khi nhận kết quả, nên trình duyệt không thể tự sửa số tiền. Khi dùng cổng thật (VNPay, MoMo), chỉ cần thay `utils/payment.js`.
- **Tồn kho:** trừ kho nguyên tử khi đặt hàng; hủy đơn thì trả hàng về kho. Đơn online quá 30 phút chưa thanh toán tự hủy và trả kho.
- **Bảo mật:** giá, tên sản phẩm, phí giao và tồn kho luôn lấy từ database, không tin dữ liệu từ trình duyệt.
- Cửa hàng chỉ phục vụ mục đích minh họa: địa chỉ điểm nhận hàng và tài khoản ngân hàng là dữ liệu mẫu.

## Chạy trên máy

Cần: Node.js 18 trở lên và MongoDB (cài trên máy, hoặc tạo cluster miễn phí trên MongoDB Atlas rồi lấy chuỗi kết nối).

```bash
# 1. Server
cd server
npm install
cp .env.example .env        # sửa MONGODB_URI và JWT_SECRET
npm run seed                # tạo dữ liệu mẫu (xóa dữ liệu cũ)
npm run dev                 # chạy ở http://localhost:5000

# 2. Client (mở cửa sổ terminal khác)
cd client
npm install
npm run dev                 # chạy ở http://localhost:5173
```

Tài khoản mẫu sau khi seed:

- Quản trị: `admin@example.com` / `admin123`
- Người dùng: `lan@example.com` / `123456`

## Kiểm thử tự động

```bash
cd server
npm test        # kiểm tra xác thực, kiểm tra dữ liệu, mã lỗi 400/401/404 (không cần MongoDB)
```

## Danh sách API

| Method | Đường dẫn | Quyền | Mô tả |
|--------|-----------|-------|-------|
| POST | `/api/auth/register` | công khai | Đăng ký (201) |
| POST | `/api/auth/login` | công khai | Đăng nhập, trả token |
| GET | `/api/auth/me` | đăng nhập | Thông tin người dùng hiện tại |
| GET | `/api/recipes?search=&category=&sort=&page=&limit=` | công khai | Danh sách, tìm kiếm, lọc, phân trang; `sort` là newest, popular, quick, rating hoặc views |
| GET | `/api/recipes/:id` | công khai | Chi tiết (mỗi lần mở tăng lượt xem) |
| POST | `/api/recipes` | đăng nhập | Đăng công thức (201) |
| PUT | `/api/recipes/:id` | tác giả hoặc admin | Sửa |
| DELETE | `/api/recipes/:id` | tác giả hoặc admin | Xóa (xóa luôn bình luận liên quan) |
| POST | `/api/recipes/:id/like` | đăng nhập | Thích / bỏ thích |
| POST | `/api/recipes/:id/rate` | đăng nhập (không phải tác giả) | Đánh giá 1 đến 5 sao, đánh giá lại sẽ thay điểm cũ |
| POST | `/api/recipes/:id/save` | đăng nhập | Lưu / bỏ lưu |
| GET | `/api/recipes/:id/comments` | công khai | Danh sách bình luận |
| POST | `/api/recipes/:id/comments` | đăng nhập | Thêm bình luận (201) |
| PUT | `/api/comments/:id` | chủ bình luận | Sửa bình luận |
| DELETE | `/api/comments/:id` | chủ bình luận hoặc admin | Xóa bình luận |
| PUT | `/api/users/me` | đăng nhập | Đổi tên hiển thị |
| PUT | `/api/users/me/password` | đăng nhập | Đổi mật khẩu (cần mật khẩu hiện tại) |
| GET | `/api/users/me/recipes` | đăng nhập | Công thức của tôi |
| GET | `/api/users/me/saved` | đăng nhập | Công thức đã lưu |
| GET | `/api/collections` | đăng nhập | Bộ sưu tập của tôi |
| POST | `/api/collections` | đăng nhập | Tạo bộ sưu tập (201) |
| GET | `/api/collections/:id` | chủ sở hữu | Chi tiết kèm danh sách công thức |
| PUT | `/api/collections/:id` | chủ sở hữu | Sửa tên, mô tả |
| DELETE | `/api/collections/:id` | chủ sở hữu | Xóa bộ sưu tập |
| POST | `/api/collections/:id/recipes` | chủ sở hữu | Thêm công thức vào bộ sưu tập (201) |
| DELETE | `/api/collections/:id/recipes/:recipeId` | chủ sở hữu | Gỡ công thức khỏi bộ sưu tập |
| GET | `/api/products?search=&recipe=&page=&limit=` | công khai | Sản phẩm đang bán |
| GET | `/api/products/config` | công khai | Tỉnh thành, điểm nhận hàng, mức phí giao |
| GET | `/api/products/shipping?subtotal=&deliveryMethod=&province=` | công khai | Tính phí giao hàng (do server quyết định) |
| GET | `/api/products/:id` | công khai | Chi tiết sản phẩm |
| GET | `/api/products/admin/all` | admin | Mọi sản phẩm, kể cả đang ẩn |
| POST | `/api/products` | admin | Thêm sản phẩm (201) |
| PUT | `/api/products/:id` | admin | Sửa sản phẩm |
| DELETE | `/api/products/:id` | admin | Xóa sản phẩm (đơn cũ vẫn giữ tên và giá đã mua) |
| GET | `/api/orders` | đăng nhập | Đơn hàng của tôi |
| POST | `/api/orders` | đăng nhập | Đặt hàng (201), tối đa 20 đơn mỗi 15 phút |
| GET | `/api/orders/:id` | chủ đơn hoặc admin | Chi tiết đơn |
| POST | `/api/orders/:id/cancel` | chủ đơn | Hủy khi đơn còn chờ xác nhận |
| POST | `/api/orders/:id/payment-session` | chủ đơn | Tạo phiên thanh toán online có chữ ký |
| POST | `/api/orders/:id/payment-result` | chủ đơn | Báo kết quả của cổng mô phỏng, server kiểm tra chữ ký |
| GET | `/api/orders/admin/all?status=` | admin | Mọi đơn hàng |
| PUT | `/api/orders/admin/:id/status` | admin | Chuyển trạng thái đơn |
| GET | `/api/admin/stats` | admin | Thống kê (có số đơn và doanh thu) |
| GET | `/api/admin/users` | admin | Danh sách người dùng |
| POST | `/api/admin/users` | admin | Thêm người dùng (201) |
| PUT | `/api/admin/users/:id` | admin | Sửa tên, vai trò, đặt lại mật khẩu |
| DELETE | `/api/admin/users/:id` | admin | Xóa người dùng và dữ liệu liên quan (từ chối nếu còn đơn đang xử lý) |

## Cấu trúc thư mục

```
server/src
  models/       User, Recipe, Comment, Collection, Product, Order
  utils/        shop.js (tỉnh thành, phí giao), payment.js (phiên thanh toán có chữ ký)
  controllers/  xử lý logic cho từng nhóm chức năng
  routes/       khai báo đường dẫn và quyền truy cập
  middleware/   auth (JWT, phân quyền), error (xử lý lỗi), rateLimit
  seed.js       dữ liệu mẫu
client/src
  pages/        17 màn hình
  components/   Navbar, RecipeCard, Pagination, ProtectedRoute
  context/      AuthContext (đăng nhập), UIContext (thông báo, hộp xác nhận)
  store/        recipeStore, cartStore (Zustand)
  api.js        hàm gọi API dùng chung
```

## Deploy lên Internet

1. **Database:** tạo cluster trên MongoDB Atlas, cho phép truy cập từ mọi IP (hoặc IP của server), lấy chuỗi kết nối.
2. **Server (Render hoặc Railway):** thư mục gốc `server`, lệnh build `npm install`, lệnh chạy `npm start`. Đặt biến môi trường `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (địa chỉ web frontend, nhiều địa chỉ ngăn cách bằng dấu phẩy).
3. **Seed dữ liệu:** chạy `npm run seed` một lần với `MONGODB_URI` trỏ tới Atlas (từ máy của bạn).
4. **Client (Vercel hoặc Netlify):** thư mục gốc `client`, lệnh build `npm run build`, thư mục xuất `dist`. Đặt biến môi trường `VITE_API_URL` = `https://<địa-chỉ-server>/api`. File `vercel.json` đã cấu hình để React Router chạy đúng khi tải lại trang.

Gói miễn phí có thể có giới hạn (ví dụ server tự ngủ khi lâu không có người truy cập); hãy kiểm tra điều kiện hiện tại của từng nền tảng.

## Phân công (ví dụ chia cho 5 vai trò, sửa lại cho đúng nhóm của bạn)

Theo yêu cầu của thầy, mỗi người làm trọn một chức năng từ giao diện đến API và CSDL, có đủ thêm, sửa, xóa.

| Thành viên | Chức năng | Frontend | Backend |
|------------|-----------|----------|---------|
| TV1 (trưởng nhóm) | Tài khoản và bảo mật: đăng ký, đăng nhập, đổi tên, đổi mật khẩu; admin thêm, sửa, xóa người dùng; thống kê; JWT; deploy | `Login`, `Register`, `AuthLayout`, `PasswordInput`, `AuthContext`, `ProtectedRoute`, `Navbar`, `Admin` | `authController`, `middleware/auth.js`, `adminController`, `User` |
| TV2 | Công thức: thêm, sửa, xóa; thích, lưu, đánh giá sao | `RecipeFormPage`, `RecipeDetail` (phần công thức), `RecipeCard`, `StarRating` | `recipeController`, `Recipe` |
| TV3 | Bình luận: thêm, sửa, xóa; tìm kiếm, lọc, phân trang | Khu bình luận ở `RecipeDetail`, `Home`, `Pagination`, `recipeStore`, `Profile` | `commentController`, `userController`, `recipeController.list`, `Comment` |
| TV4 | Bộ sưu tập: thêm, sửa, xóa | `Collections`, `CollectionDetail`, `AddToCollection` | `collectionController`, `Collection` |
| TV5 | Cửa hàng: admin thêm, sửa, xóa sản phẩm; giỏ hàng; đặt hàng; thanh toán; quản lý đơn | `Shop`, `Cart`, `Checkout`, `PayOrder`, `Orders`, `OrderDetail`, `AdminShop`, `ProductCard`, `RecipeProducts`, `cartStore` | `productController`, `orderController`, `utils/shop.js`, `utils/payment.js`, `Product`, `Order` |

Nhóm 4 người: gộp phần của TV3 vào TV2 (bình luận) và TV4 (tìm kiếm, phân trang). Nhóm 3 người: TV4 gộp vào TV3, TV5 giữ nguyên phần cửa hàng.

Phân công cần ghi đúng với lịch sử commit. Khi bảo vệ, mỗi người phải giải thích được code của mình ở cả frontend và backend.
