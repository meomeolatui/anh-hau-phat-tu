# Đưa Anh Hậu Phật Tử lên mạng (miễn phí): Render + Neon

Kết quả: game chạy online ở địa chỉ **https://anh-hau-phat-tu.onrender.com** (có HTTPS), ai có link cũng vào chơi được.

- **Render** chạy máy chủ game. Gói free cho 750 giờ/tháng, đủ chạy liên tục cả tháng.
- **Neon** giữ dữ liệu tài khoản và tiến trình. Gói free không hết hạn, không cần thẻ.

Cần dùng Neon vì ổ đĩa của Render free bị xoá mỗi lần máy chủ khởi động lại.

> **Lưu ý gói free của Render:** không có ai truy cập trong 15 phút thì máy chủ "ngủ". Người vào đầu tiên sau đó phải chờ khoảng 1 phút để máy chủ thức dậy. Khi đang có người chơi thì máy chủ không ngủ.

Mất khoảng 15 phút. Cần một tài khoản GitHub (miễn phí).

## Bước 1 — Đưa code lên GitHub

Render lấy code từ GitHub. Nên tạo **một repo riêng cho thư mục `anh-hau-phat-tu`**, để file `render.yaml` nằm ở gốc repo.

1. Vào https://github.com/new, đặt tên repo `anh-hau-phat-tu`, chọn **Private** hoặc Public, rồi bấm **Create repository**. Không tick thêm README.
2. Trên máy, mở terminal trong thư mục `anh-hau-phat-tu` và chạy lần lượt:

   ```bash
   git init -b main
   git add .
   git commit -m "Anh Hậu Phật Tử: bản đầu tiên"
   git remote add origin https://github.com/<tên-github-của-bạn>/anh-hau-phat-tu.git
   git push -u origin main
   ```

   Các thư mục `node_modules/`, `dist/` và `.data/` (dữ liệu máy chủ trên máy) đã nằm trong `.gitignore`, nên sẽ không bị đưa lên.

## Bước 2 — Tạo cơ sở dữ liệu Neon

1. Vào https://neon.tech và đăng ký (có thể dùng luôn tài khoản GitHub).
2. **Create project**: đặt tên `anh-hau-phat-tu`, phiên bản Postgres để mặc định, **Region: AWS Asia Pacific (Singapore)**.
3. Ở màn hình **Connection details**, bấm **Copy** chuỗi kết nối. Chuỗi có dạng:

   ```
   postgresql://neondb_owner:xxxxxxxx@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   Giữ chuỗi này bí mật, vì ai có nó đều đọc/ghi được dữ liệu người chơi. Không dán vào code hay đưa lên GitHub.

Máy chủ game tự tạo các bảng khi chạy lần đầu, bạn không cần làm gì thêm trong Neon.

## Bước 3 — Tạo dịch vụ trên Render

1. Vào https://render.com và đăng ký bằng tài khoản GitHub.
2. Bấm **New +** rồi chọn **Blueprint**. Chọn repo `anh-hau-phat-tu`. Render sẽ đọc file `render.yaml` có sẵn.
3. Render hỏi giá trị **DATABASE_URL**: dán chuỗi kết nối Neon ở bước 2.
4. Bấm **Apply**. Render tự build (`npm ci && npm run build`) rồi chạy (`npm start`). Lần đầu mất khoảng 3–5 phút.
5. Khi trạng thái chuyển sang **Live**, địa chỉ game hiện ở đầu trang dịch vụ, ví dụ `https://anh-hau-phat-tu.onrender.com`. Nếu tên đã có người dùng, Render sẽ thêm vài ký tự vào sau tên.

## Bước 4 — Kiểm tra

- Mở `https://<địa-chỉ>/api/health`. Nếu thấy `{"ok":true,"online":0}` là máy chủ đã chạy.
- Mở `https://<địa-chỉ>/`, tạo tài khoản và vào game. Ở góc trên sẽ thấy "Online · 1 người trong khu".
- Gửi link cho một người bạn: hai người cùng khu sẽ thấy nhau và chat được.
- Trong tab **Logs** trên Render, dòng khởi động phải có `CSDL postgres`. Nếu thấy `sqlite` nghĩa là chưa nhập DATABASE_URL: dữ liệu sẽ mất khi máy chủ khởi động lại.

## Cập nhật game về sau

Sửa code trên máy, rồi `git add . && git commit -m "..." && git push`. Render tự build và triển khai lại. Dữ liệu người chơi vẫn còn vì nằm ở Neon.

## Khi gặp lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| Logs báo lỗi kết nối cơ sở dữ liệu | Kiểm tra lại DATABASE_URL (Render → dịch vụ → Environment). Nếu chuỗi Neon có đuôi `&channel_binding=require`, thử bỏ đoạn đó. |
| Mở trang phải chờ khoảng 1 phút | Máy chủ free đang ngủ, chờ là xong. Muốn luôn thức thì nâng gói Render (khoảng 7 USD/tháng). |
| Build lỗi phiên bản Node | `render.yaml` đã đặt `NODE_VERSION=24` và `package.json` có `engines.node >= 24`. Kiểm tra bạn có sửa hai chỗ này không. |

## Sao lưu dữ liệu

Neon tự giữ lịch sử thay đổi (point-in-time) trong một khoảng ngắn ở gói free. Muốn chắc chắn hơn, vào Neon → **Branches** → tạo branch sao lưu định kỳ. Hoặc chạy `pg_dump "<DATABASE_URL>" > sao-luu.sql` trên máy có cài Postgres.
