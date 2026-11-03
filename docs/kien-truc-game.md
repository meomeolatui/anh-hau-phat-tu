# Kiến trúc game "Anh Hậu Phật Tử"

Game 3D góc nhìn thứ ba, hành hương núi Bà Đen (phỏng theo cảnh quan thật; tư liệu đã kiểm chứng ở `docs/nui-ba-den.md`).
Chạy hoàn toàn trên trình duyệt, không có backend; tiến độ lưu `localStorage` (khoá `ahpt-game:v1`).

**Công nghệ:** React 19 + Vite 8 + Tailwind CSS v4 (HUD/menu) · three.js r187 + @react-three/fiber v9 (+ drei v10 nếu cần) · lucide-react v1 (icon; tên icon đổi so với bản cũ, kiểm tra bằng `grep -c "declare const TenIcon:" node_modules/lucide-react/dist/lucide-react.d.ts`) · Vitest.

## Thư mục `src/`

| Đường dẫn | Vai trò |
|---|---|
| `App.jsx`, `screens/` | Màn hình tiêu đề → tạo nhân vật → game |
| `game/Game.jsx` | Canvas 3D + HUD + điều khiển cảm ứng |
| `game/runtime.js` | Trạng thái **nóng** mỗi frame (vị trí nhân vật, input, camera) + event bus `on/emit` |
| `game/state.js` | Trạng thái **lưu bền** + UI: công đức, thống kê, nhiệm vụ ngày, khám phá, cài đặt; `useGame(selector)` |
| `game/progression.js` | Cấp độ (theo công đức), kho nhiệm vụ ngày |
| `game/world/layout.js` | **Bố cục thế giới**: `ZONES` (origin từng khu), `WALKABLES` (mặt đi được), `SPAWN`, `CABLE_STATIONS`, `toWorld()` |
| `game/world/navigation.js` | Độ cao mặt đất, trượt mép, đẩy khỏi vật cản, địa hình núi (`terrainHeight`) |
| `game/world/World.jsx` | Lắp ráp: bầu trời, địa hình, rừng, đá, bậc đá, bia pháp ngữ, các zone |
| `game/world/steles.js` | Danh sách bia pháp ngữ sưu tầm |
| `game/interaction.js` | `useInteractable` (điểm tương tác, phím E), `useColliders` (vật cản) |
| `game/materials.js` | Bảng màu `PALETTE`, `toon(color)` (vật liệu toon có cache), `glow(color)` |
| `game/props/architecture.jsx` | `Roof`, `Pillar`, `Hall` (chánh điện mở mặt tiền), `Gate` (tam quan), `Railing` |
| `game/props/colliders.js` | `hallColliders(...)`, `gateColliders(...)` |
| `game/props/nature.jsx` | `Forest`, `BigTree`, `Bamboo`, `Boulders` (đá granite), `RampSteps`, `Paving` |
| `game/props/sacred.jsx` | `SeatedBuddha`, `StandingBodhisattva`, `LotusThrone`, `IncenseBurner`, `IncenseSmoke`, `Bodoan`, `Lantern`, `StoneLantern`, `LotusPond`, `BellTower` — `Lantern light` bật nguồn sáng thật: chỉ dùng cho 1–2 đèn chính mỗi khu (pointLight tốn hiệu năng) |
| `game/props/interactive.jsx` | Đồ **có tương tác**: `IncenseSpot`, `PrayerSeat`, `Stele`, `BroomRack`, `LeafField`, `Npc` |
| `game/props/CableStation.jsx` | Nhà ga cáp treo (mở hoạt động `cap-treo`) |
| `game/zones/*.jsx` | Từng khu vực: `ChanNui` (chợ nhang & công quả — mẫu chuẩn), `DuongNui`, `ChuaBa`, `ChuaHang`, `DinhNui`. Chùa chỉ có ở lưng chừng núi và trên đỉnh |
| `game/props/market.jsx`, `game/shop/items.js` | Sạp hàng, nhặt rác, trạm trà, khách hành hương, bảng công quả; giá hàng và thưởng công quả (xu) |
| `game/props/decor.jsx` (+ `decorGeometry.js`, `decorKinds.js`) | Đồ trang trí gộp hình học (`<DecorSet items>` ≤ 4 draw call/khu): bonsai, chậu sen, lu nước, bàn ghế đá, luống hoa, non bộ, dây phướn, đèn lồng dây, kệ dép, công đức, bảo tháp, chuông gió… Danh sách món của từng khu ở `zones/*/decorLayout.js` (`chan-nui/data.js`); vật cản tự sinh bằng `decorColliders`; ràng buộc khoảng cách/lối đi: `zones/decor-layout.test.js` |
| `game/activities/` | Overlay hoạt động: `index.js` (sổ đăng ký), `Panel.jsx` (khung UI), `useActivityPose.js`, `constants.js` |
| `game/player/` | `Avatar` (nhân vật dựng khối + hoạt ảnh thủ tục), `Player` (điều khiển), `CameraRig`, `looks.js` |
| `game/hud/` | HUD, bảng Nhiệm vụ/Bản đồ/Menu, phản hồi (+công đức, thông báo, biểu ngữ khu vực) |
| `lib/sound.js` | Âm thanh tổng hợp Web Audio: `playMo`, `playBead`, `playBell`, `haptic` |
| `data/quotes.js`, `data/sutras.js`, `data/holidays.js` | Pháp ngữ, kinh văn (Hán-Việt + lược giải), ngày lễ âm lịch |
| `lib/lunar.js` | Âm lịch Việt Nam (dùng cho sự kiện rằm, vía Bà mùng 4–6/5 âm lịch) |

## Quy ước toạ độ

- Đơn vị mét, Y hướng lên, đỉnh núi về phía **−Z**. Hướng quay `rotY` theo đúng `rotation.y` của three.js: hướng nhìn = `(sin rotY, cos rotY)` trên mặt XZ; `rotY = π` là nhìn về phía núi.
- Mỗi zone có `origin` trong `ZONES`. Đồ **tĩnh** đặt trong `<group position={O}>` bằng toạ độ **cục bộ**.
  Đồ **có tương tác** (IncenseSpot, PrayerSeat, Npc, CableStation, useInteractable…) đặt **ngoài** group, toạ độ **thế giới** qua `toWorld(O, [x,y,z])`.
- Người chơi chỉ đi trên `WALKABLES` (sân rect/circle, đường dốc ramp). Đặt đồ vật trong phạm vi mặt sân của zone; đồ nằm ngoài mặt đi được thì đặt Y theo `terrainHeight(x,z)`.
- Vật cản: `useColliders('khoá-duy-nhất', [ {type:'circle', x, z, r} | {type:'box', x, z, w, d, rot} ], O)` — toạ độ cục bộ; `rot` theo quy ước rotation.y. Mặc định chỉ có hiệu lực trong khoảng độ cao `[O.y, O.y+6]`.
- Đừng chặn kín lối đi: luôn chừa đường rộng ≥ 2 m giữa các vật cản, và mặt tiền chánh điện để mở.

## Hoạt động (activities)

- Mở bằng `startActivity(id, params)`; overlay nhận `{ params, onClose }`, dùng `<Panel>` + `ActionButton`, gọi `useActivityPose({ anim, stand, face, holding })` để khoá di chuyển/đặt tư thế.
- Hoạt ảnh nhân vật: `idle | walk | run | pray | incense | bow | kneel | sit | sweep | bell | wave` (đổi giữa chừng bằng `setPlayerAnim`).
- Công đức: `addMerit(amount, label, position?)`; thống kê + tiến độ nhiệm vụ: `addStat(key, n)` với key trong `save.stats`
  (`niem, huong, la, chuong, lay, thienPhut, kinh, hoaDang, bia, nghe, capTreo`).
- Xu & túi đồ: `addXu`, `spendXu`, `buyItem`, `addItem`, `consumeItem` (vật phẩm: `nhang`, `hoa`, `den`). Thắp hương tốn nhang, thả hoa đăng tốn đèn.
- Thời gian hồi: `cooldownLeft(key, ms)`, `markCooldown(key)`. Phản hồi: `emit('toast', {title, description})`.
- Mức công đức tham khảo (giữ cân bằng): thắp hương 8–15 · niệm Phật 5/27 hạt + 30 khi tròn chuỗi · quét lá 2/5 lá · đọc bia 20 · lạy Phật 5/lạy · thỉnh chuông 10 · thiền 10/phút · tụng kinh 25–50 · hoa đăng 10 · nghe chuyện 5 (lần đầu mỗi chuyện 15).

## Phong cách

Low-poly toon, màu ấm của chùa Nam Bộ (tường vàng, cột son, mái ngói đỏ nâu, viền vàng), rừng xanh, đá granite xám, sương núi.
Tượng Phật/Bồ Tát/Thánh Mẫu luôn **trang nghiêm**, không biếm hoạ. Văn bản tiếng Việt có dấu, giọng hiền hoà, không mê tín, không hứa "công đức thật" từ việc bấm màn hình.

## Hệ thống gameplay bổ sung

| Hệ thống | File | Ghi chú |
|---|---|---|
| Thể lực | `game/stamina.js`, `hud/StaminaBar.jsx` | Chạy −4.3/s, leo dốc −1/s; đứng yên +4/s, ngồi nghi thức +14/s, ngồi ghế +30/s; < 40 đứng yên → tư thế `tired` (khom người thở dốc); kiệt sức → không chạy, đi chậm |
| Ghế nghỉ chân | `world/benches.js`, `props/RestBench.jsx`, `activities/NghiNgoi.jsx` | Thêm ghế bằng cách thêm vào `BENCHES` (test kiểm tra vị trí); tư thế `seated` |
| Cáp treo | `game/cableway.js` (tuyến bám địa hình, trụ, vị trí cabin), `game/ride.js` (chuyến đi), `props/Cableway.jsx` (dây, trụ, cabin), `hud/RideStatus.jsx` | Nhìn từ ga thấp: bên PHẢI đi lên, bên TRÁI đi xuống (`UP_SIDE`/`DOWN_SIDE`); đi chân núi → đỉnh qua ga chùa Bà; vị trí ga lấy từ `CABLE_STATIONS` (position + rotY) |
| Chợ & công quả | `props/market.jsx`, `shop/items.js` | Xu kiếm bằng công quả dưới chân núi và chiếu lạy liên tục ở chùa Bà; thắp hương tốn nhang, hoa đăng tốn đèn |
| Đèn đêm | `props/NightLights.jsx`, `props/nightLightsLayout.js` | Đèn lan can dọc mép mặt đi được + đèn lồng treo trên rặng cây; `GROVE_MOUNTS` phải khớp `<ColorGrove>` trong zone (có test) |
| Rừng & cây màu | `props/ColorGrove.jsx` + `groveLayout.js` (quanh zone, mật độ ×3), `props/FarForest.jsx` (rừng xa phủ đều), `props/treeSpecies.js` (loài & màu — mỗi cây một tông màu), `props/leafColors.js` (lá rụng cùng màu cây) | |
| Nhân vật | `player/avatarRig.js` (khung xương, tư thế — test được), `player/Avatar.jsx` (dựng hình lathe/capsule liền mạch) | Tư thế: idle, walk, run, pray, incense, bow, kneel, sit, seated, sweep, bell, bell-pull, bell-strike, wave, tired, jump, land, look, vai, twirl |
| Động tác đứng yên | `player/idleActions.js` (kịch bản theo bộ đồ — test được), `Player.jsx` | Đứng yên 6 s: bộ có binh khí → múa gậy (Avatar chuyển binh khí từ lưng sang tay), cà sa → ngắm quanh + lạy bốn phương, Thần Tài → vái, đồ thường → ngắm cảnh; bấm di chuyển là huỷ |
| Thiền đường & lạy liên tục (chùa Bà) | `zones/chua-ba/data.js` (`SPOTS.thien`, `SPOTS.layLienTuc`), `activities/ThienDinh.jsx` (`params.sessions` = `LONG_SESSIONS` 5/15/30/60), `activities/LayLienTuc.jsx` + `layLienTucLogic.js` | Lạy tự động 3 s/lạy, 3 lạy = 1 xu (+2 công đức/lạy), đếm theo đồng hồ thật |
| Chơi online | `server/` (máy chủ Node: `server.js` HTTP+WS, `world.js` phòng theo khu, `saveRules.js` kiểm tra bản lưu, `chatFilter.js`, `db.js` SQLite, `auth.js`), `src/net/` (`protocol.js` dùng chung, `online.js` kết nối, `remotes.js` người khác + nội suy, `chatStore.js`, `api.js`), `player/RemotePlayers.jsx`, `hud/OnlineHud.jsx`, `screens/AccountPanel.jsx` | Bản lưu online: `state.js` chế độ `server` (không ghi localStorage); `saveDefaults.js` dùng chung với máy chủ. Chi tiết trong README → Chơi online |
| Góc nhìn & nhảy | `player/firstPerson.js` (phím C), `player/jump.js` (Space), `player/cameraPicker.js` (chọn góc không bị che khi làm hoạt động) | Hoạt động tự về góc nhìn thứ ba; nhảy chỉ là động tác (va chạm vẫn theo mặt đất) |
| Y phục & mũ mão | `shop/wardrobe.js` (danh mục, giá xu), `player/Wardrobe3D.jsx` + `player/costumeGeometry.js` + `player/wearMaterials.js` (dựng 3D), `shop/WearArt.jsx` (hình minh hoạ SVG), `shop/WardrobeList.jsx`, `activities/YPhuc.jsx` | Sạp y phục bà Tám ở chợ chân núi: mặc thử (`ui.tryOn`, không lưu) → mua (`save.wardrobe`); tủ đồ trong Menu. Khi thử đồ: camera đối diện + làm mờ cảnh (`player/FittingFocus.jsx`, `hud/FittingBlur.jsx`). Thêm món: thêm vào `COSTUMES`/`HATS` (kiểu mũ mới cần thêm nhánh trong `HatModel` và `HatArt`) |
