# Anh Hậu Phật Tử — Hành hương núi Bà Đen

Game 3D góc nhìn thứ ba chạy trên trình duyệt. Người chơi lên núi Bà Đen (Tây Ninh), đi lại tự do qua chùa Trung, chùa Bà, chùa Hang tới đỉnh núi có tượng Phật Bà Tây Bổ Đà Sơn. Dọc đường có thể niệm Phật, thắp hương, quét lá sân chùa, lễ Phật, thỉnh chuông, tụng kinh, thả đèn hoa đăng, ngồi thiền ngắm mây, trò chuyện với người trên núi và sưu tầm bia pháp ngữ.

> Cảnh quan được **phỏng theo** núi Bà Đen, không mô phỏng chính xác. Tư liệu dùng trong game đã được đối chiếu nguồn, xem [docs/nui-ba-den.md](docs/nui-ba-den.md).
> Công đức trong game chỉ là điểm số trò chơi, không phải công đức thật.

## Chạy thử

Yêu cầu Node 20 trở lên.

```bash
npm install
npm run dev        # mở http://localhost:5173
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy bản phát triển |
| `npm run build` | Build bản phát hành vào `dist/` (kèm service worker PWA, chơi được offline) |
| `npm run preview` | Xem thử bản build |
| `npm test` | Chạy test (Vitest) |
| `npm run lint` | Kiểm tra code (oxlint, cả `src/` và `server/`) |
| `npm run server` | Chạy máy chủ online (cổng 5200, tự khởi động lại khi sửa code máy chủ) |
| `npm start` | Chạy máy chủ online bản phát hành (phục vụ luôn game trong `dist/`) |

Chơi một mình không cần máy chủ: `dist/` là trang tĩnh, đưa lên Netlify, Vercel, Cloudflare Pages hay GitHub Pages đều được.

## Chơi online

Nhiều người cùng lên núi: thấy nhau đi lại, trang phục và động tác; chat chữ; biểu cảm; nghe chuông người khác thỉnh,
thấy hương người khác thắp. Tài khoản và tiến trình (công đức, xu, túi đồ, tủ đồ) lưu trên máy chủ.

**Chạy thử trên máy** (Node 24 trở lên — máy chủ dùng SQLite có sẵn trong Node):

```bash
npm run server     # cửa sổ 1: máy chủ ở cổng 5200
npm run dev        # cửa sổ 2: game — Vite chuyển tiếp /api và /ws sang máy chủ
```

Mở game → màn hình chính có ô **Đăng nhập / Tạo tài khoản**. Tạo tài khoản lần đầu có thể mang theo nhân vật và tiến trình
đang chơi một mình (tối đa 3.000 công đức, 300 xu). Không đăng nhập vẫn chơi một mình như cũ.

**Triển khai:** `npm run build` rồi `npm start` trên một máy chủ Node (VPS, Render, Fly.io…). Một tiến trình phục vụ cả game lẫn API.
Hướng dẫn miễn phí từng bước (địa chỉ `*.onrender.com`, dữ liệu ở Neon Postgres): [docs/trien-khai-render.md](docs/trien-khai-render.md) — cấu hình sẵn trong `render.yaml`.

| Biến môi trường | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `5200` | Cổng máy chủ |
| `DATABASE_URL` | — | Chuỗi kết nối Postgres (vd. Neon). Có thì dùng Postgres — bắt buộc khi ổ đĩa máy chủ không bền (Render free) |
| `DB_FILE` | `.data/game.db` | File SQLite khi không có `DATABASE_URL` — nhớ sao lưu định kỳ |

Khi đưa lên Internet, đặt máy chủ sau HTTPS (Nginx, Caddy hoặc dịch vụ của nhà cung cấp) để mật khẩu và WebSocket (`wss://`) được mã hoá.

**Cách hoạt động** (`server/`, giao thức trong `src/net/protocol.js`):

- Người chơi chia theo khu (chân núi, chùa Bà, đỉnh núi…): chỉ nhận tin của người cùng khu. Vị trí gửi 10 lần/giây,
  mỗi người chỉ nhận 40 người gần nhất trong 80 m. Game vẽ đầy đủ 24 người gần nhất, người xa hơn vẽ giản lược.
- Máy chủ kiểm tra mọi bản lưu gửi lên (`server/saveRules.js`): công đức và xu chỉ được tăng theo tốc độ người chơi thật
  đạt được; tiêu xu phải khớp đúng giá món đã mua. Sửa số liệu trong trình duyệt sẽ bị máy chủ trả về số đúng.
- Chat có giới hạn tốc độ và lọc lời thô tục (`server/chatFilter.js` — danh sách cơ bản, có thể bổ sung). Bấm vào tên
  trong khung chat để tắt tiếng hoặc báo cáo; báo cáo lưu ở bảng `reports` trong cơ sở dữ liệu (chưa có trang quản trị).
- Mỗi tài khoản chỉ chơi ở một nơi: đăng nhập chỗ mới thì kết nối cũ bị đẩy ra.

Phím khi chơi online: **T** mở chat (Enter gửi, Esc đóng), **G** bảng biểu cảm.

## Cách chơi

| Thao tác | Máy tính | Điện thoại / máy tính bảng |
|---|---|---|
| Đi lại | W A S D hoặc phím mũi tên | Cần điều khiển ở nửa trái màn hình |
| Chạy | Giữ Shift | Đẩy cần điều khiển hết cỡ |
| Xoay camera | Kéo chuột | Vuốt ở nửa phải màn hình |
| Phóng to, thu nhỏ | Lăn chuột | Chụm hoặc mở hai ngón |
| Tương tác | E hoặc Enter | Chạm vào nút gợi ý |
| Nhiệm vụ / Bản đồ / Menu | Q / M / Esc | Các nút ở góc trên bên phải |

Có gì để làm:

- **Thắp hương**: chọn 1 hoặc 3 nén, giữ để châm, vái ba vái. Hương cháy 10 phút và vẫn còn sau khi tải lại trang.
- **Niệm Phật**: ngồi lên bồ đoàn, lần chuỗi 108 hạt (chạm hoặc nhấn phím cách). Có chế độ niệm theo nhịp mõ.
- **Quét lá**: lấy chổi ở giá chổi rồi đi qua chỗ lá rụng. Lá sẽ rụng lại theo thời gian.
- **Lễ Phật, thỉnh chuông, tụng kinh, thiền, thả đèn hoa đăng**: có ở chùa Bà, chùa Hang và trên đỉnh núi.
- **Cáp treo**: đi nhanh giữa ga chân núi, ga chùa Bà và ga đỉnh núi.
- **Nhiệm vụ ngày**: 4 nhiệm vụ đổi mới mỗi ngày. Hoàn thành để nhận công đức và lên cấp tu học.
- **Bia pháp ngữ**: các bia đá khắc lời Phật dạy nằm rải rác trên núi để sưu tầm.
- **Ngày và đêm**: cảnh đổi theo giờ thật. Ban đêm đèn lồng tự sáng. Có thể chỉnh lại trong Menu.

Dữ liệu chơi lưu trên chính thiết bị (`localStorage`), không cần tài khoản.

## Nhạc nền

Mặc định game phát **"Vân Sơn Thiên Khúc"**, bản nhạc nền tự soạn riêng cho game (`src/lib/composition.js`). Bản nhạc được tổng hợp trực tiếp bằng Web Audio:

- Hợp xướng và sáo trúc.
- Đàn tranh và đàn hạc trên thang ngũ cung Việt.
- Chuông lấp lánh, cồng trầm, vang rộng.

Bản nhạc chia 4 đoạn lặp vòng và mỗi vòng đổi giai điệu. Nhạc tự nhỏ lại khi thiền, tụng kinh hoặc niệm Phật.

Muốn dùng bản nhạc riêng: đặt file tại `public/nhac/khuc-nhac-thien-dinh.mp3` (chỉ dùng file bạn có quyền sử dụng). Game sẽ ưu tiên phát file này và tự lặp.

## Công nghệ và cấu trúc

React 19, Vite, Tailwind CSS v4 (giao diện), three.js và @react-three/fiber (thế giới 3D), Vitest. Không dùng file mô hình hay âm thanh ngoài: nhân vật và kiến trúc dựng từ khối hình học, âm thanh tổng hợp bằng Web Audio.

Chi tiết kiến trúc, quy ước toạ độ và cách thêm khu vực hay hoạt động mới nằm ở [docs/kien-truc-game.md](docs/kien-truc-game.md).

Thư mục `_archive/web-app-v1/` là bản web app đồng hành tu tập làm trước khi chuyển sang làm game. Bản này không còn được dùng, chỉ giữ lại để tham khảo.
