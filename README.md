# Shop CRUD — React Native + Expo + Firebase

Ứng dụng tiếng Việt: đăng ký, đăng nhập email/mật khẩu, giữ phiên đăng nhập, đặt lại mật khẩu, đăng xuất, danh sách realtime, tìm kiếm, thêm/sửa/xóa sản phẩm, chọn ảnh thư viện. Mỗi tài khoản có sản phẩm riêng.

## 1. Cấu hình Firebase (dùng lại project hiện có)

1. Firebase Console → Settings → Project settings → General → Your apps → Add app → Web (</>). Đặt tên ShopCRUD; không cần Hosting.
2. Sao chép `.env.example` thành `.env`. Điền 6 giá trị tương ứng từ `firebaseConfig` (không cần dấu nháy hoặc dấu phẩy). Đây là cấu hình client; không dùng khóa service account.
3. Authentication → Sign-in method → Email/Password → Enable → Save.
4. Firestore Database → tạo database `(default)` nếu chưa có. Nếu đã có, bỏ qua.
5. Firestore → Rules: tích hợp nội dung `firestore.rules` rồi Publish. Nếu project có ứng dụng khác, giữ các rule của ứng dụng đó, chỉ thêm match `/users/{uid}/products/{productId}` vào bên trong match database. Không mở quyền công khai toàn database. Không cần tạo collection thủ công.

## 2. Chạy trên điện thoại

```powershell
npm install
npx expo start --clear
```

Cài Expo Go tương thích Expo SDK trong package.json. Điện thoại và máy tính cùng Wi-Fi. Android: mở Expo Go → Scan QR; iOS: dùng Camera quét QR. Cho phép Node qua Windows Firewall trên mạng riêng nếu Windows hỏi.

Nếu mạng chặn kết nối LAN:

```powershell
npm install --global @expo/ngrok
npx expo start --tunnel
```

Tunnel cần Internet. Nếu Expo Go báo SDK không tương thích, dùng bản tương thích tại https://expo.dev/go. Không dùng React Native Firebase native SDK vì bản này cần chạy trong Expo Go.

## 3. Dữ liệu

`users/{uid}/products/{productId}`:

- name: chuỗi 1–100 ký tự
- category: chuỗi 1–60 ký tự
- price: số nguyên VNĐ, 1–1.000.000.000
- image: JPEG data URI đã nén, tối đa 350.000 ký tự
- createdAt, updatedAt: timestamp từ máy chủ

Ảnh nén về chiều rộng 640px, JPEG chất lượng 55%. Lưu trực tiếp trong document Firestore để demo với Spark mà không phải bật thanh toán Storage. Giới hạn này phù hợp bài tập nhỏ; khi mở rộng nên chuyển ảnh sang object storage và dùng phân trang. Không tạo collection hay sửa dữ liệu của ứng dụng khác. Quy tắc phân quyền phải được Publish trước khi demo.

Cần Internet để đăng nhập và xác nhận thay đổi. Nút lưu bị khóa khi đang chờ; không báo thành công trước xác nhận từ Firebase. Firebase JS Firestore trên React Native dùng bộ nhớ đệm trong phiên, không hứa hẹn lưu ngoại tuyến bền vững.

## 4. Kịch bản kiểm tra / quay demo

1. Đăng ký email mới; đăng xuất rồi đăng nhập lại.
2. Thử sai mật khẩu, email không hợp lệ, tên rỗng, giá âm/không phải số.
3. Thêm sản phẩm kèm ảnh; kiểm tra xuất hiện trong Firebase Console.
4. Sửa tên/loại/giá/ảnh; đóng và mở lại app để kiểm tra dữ liệu và phiên đăng nhập.
5. Tìm kiếm; hủy xóa rồi xác nhận xóa.
6. Đăng nhập tài khoản khác: danh sách riêng, không đọc/sửa được dữ liệu tài khoản cũ.
7. Tắt mạng: kiểm tra thông báo/chờ xác nhận; bật mạng lại.
8. Từ chối quyền ảnh, hủy chọn ảnh, chọn ảnh lớn; kiểm tra xử lý.

## 5. Kiểm tra mã nguồn

```powershell
npx tsc --noEmit
npx expo-doctor
npx expo export --platform android
```

Cần cấu hình Firebase thật và điện thoại thật để xác nhận toàn bộ luồng end-to-end. Repo không chứa tài khoản/mật khẩu demo có sẵn. Tạo tài khoản từ màn hình Đăng ký hoặc Firebase Authentication → Users → Add user.

Tài liệu: https://docs.expo.dev/guides/using-firebase/ và https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

## Cập nhật: ảnh URL và đăng ký
- Form thêm/sửa có hai nguồn ảnh: Từ điện thoại và Từ link ảnh. Link phải là HTTPS công khai, dẫn trực tiếp đến ảnh, tối đa 2048 ký tự. Có xem trước và thông báo khi ảnh không tải được. Link được lưu trong Firestore; ảnh phụ thuộc máy chủ cung cấp link.
- Publish lại firestore.rules để chấp nhận cả JPEG data URI và link HTTPS.
- Đăng ký dùng phiên Firebase riêng trong bộ nhớ, không đăng nhập phiên chính. Thành công: chuyển về đăng nhập, giữ email, xóa mật khẩu; người dùng phải nhập lại mật khẩu.
- Kiểm tra trên điện thoại: đăng ký email mới và xác nhận không vào danh sách; đăng nhập lại; thêm ảnh bằng URL; sửa sang ảnh điện thoại và ngược lại; thử URL sai và URL không phải ảnh.

## Chạy trên máy tính bằng Expo Web
Đã cài thư viện web. Trong Terminal tại thư mục dự án chạy `npm run web -- --port 8082`, rồi mở http://localhost:8082. Giữ Terminal mở; Ctrl+C để dừng. Dùng cùng tài khoản Firebase để xem sản phẩm của tài khoản đó. Bản web dùng lưu phiên trình duyệt và hộp thoại trình duyệt để xác nhận xóa/đăng xuất. Chọn ảnh sẽ mở trình chọn tệp máy tính; có thể nhập link HTTPS.
