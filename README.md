# PTIT CareerHub — Next.js frontend

Frontend tuyển dụng PTIT sử dụng Next.js 16.4.3 App Router, React 19 và TypeScript strict. Django REST Framework tiếp tục là Backend riêng. Source frontend nằm ở gốc repository; chưa có Django source/OpenAPI trong checkout này.

## Cài đặt và chạy

Cần Node.js >=22.12 và npm. Trên Windows PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Nếu đã có `.env`, chỉnh file hiện tại thay vì ghi đè. Mở http://localhost:5173. Khi cần truy cập từ máy khác:

```powershell
npm run dev -- --hostname 0.0.0.0
```

Biến môi trường:

```env
DJANGO_API_BASE_URL=http://192.168.1.93:8000/api/v1
NEXT_PUBLIC_DJANGO_API_BASE_URL=http://192.168.1.93:8000/api/v1
```

`DJANGO_API_BASE_URL` dành cho Next server gọi jobs public. `NEXT_PUBLIC_DJANGO_API_BASE_URL` dành cho browser gọi JWT auth; địa chỉ này được đóng vào bundle lúc build. Mỗi URL phải chứa `/api/v1` đúng một lần, không có credential/query. Không thêm token/secret vào biến public. Sửa env cần restart dev hoặc rebuild production. Nếu Django chạy cùng máy thì dùng `localhost:8000`; trên máy khác, localhost trỏ về máy đang mở trình duyệt.

Migration đã đổi biến Vite sang hai biến Next trong `.env` local, giữ host hiện có. Server còn đọc VITE_API_BASE_URL như fallback chuyển tiếp; browser chỉ dùng biến NEXT_PUBLIC mới. Phiên localStorage cũ bị xóa khi khởi tạo, cần đăng nhập lại.

## Production và kiểm tra

```powershell
npm run typecheck
npm test
npm run format:check
npm run build
npm start
```

Đây là Next Node application; không deploy bằng cách upload thư mục Vite `dist`. `npm start` chạy production server ở cổng 5173 sau build.

Browser smoke với Chrome cài sẵn (fixture test tách khỏi Backend thật):

```powershell
npm run test:browser
```

Script dùng playwright-core, tự build production test vào .next-e2e rồi chạy fixture trên 127.0.0.1:18765 và Next trên 5273, kiểm tra auth/jobs/404/error/responsive, sau đó dọn các tiến trình. Cổng phải trống; không đổi `.env` thật. Output nằm trong `.next-e2e/`, bị ignore. Không có ESLint script/config; format:check là kiểm tra định dạng, không thay thế lint.

## Routes và cấu trúc

- `/`: trang chủ, server-rendered latest jobs.
- `/jobs?search=React&location=Hà+Nội&page=2`: search, location, pagination bằng URL.
- `/jobs/[jobId]`: chi tiết và 404 dựa trên HTTP Backend.
- `/login`, `/register`: auth forms, validation và field errors.
- `/account`: thông tin current-user thật, client guard chờ xác minh trước khi hiện dữ liệu.
- Unknown routes: Next 404.

`src/app` là route composition; `src/features/jobs` và `src/features/auth` chứa component nghiệp vụ; `src/components` chứa navigation/feedback; `src/api` tập trung config/transport/errors/services/runtime validation; `src/auth` quản lý user state. Giữ CSS và thiết kế trước migration, loại số liệu/công ty/nội dung mẫu khỏi production.

## Giao diện sáng/tối

Nút mặt trăng/mặt trời ở header đổi Light/Dark Mode trên mọi route. Lựa chọn được lưu trên trình duyệt và giữ khi tải lại; khi chưa chọn, giao diện theo thiết lập hệ thống. Xem [tài liệu theme](docs/THEME.md) để biết kiến trúc và kết quả kiểm thử.

## Auth và bảo mật

Theo contract được cung cấp: login `{email,password}`; register `{email,password,first_name,last_name,role}`; role đăng ký chỉ CANDIDATE/EMPLOYER. Response yêu cầu `{user,access,refresh}` và role uppercase. Gọi me xác minh lại khi reload. Session tokens lưu trong một entry sessionStorage, chỉ lưu access/refresh, không lưu password. Session được giới hạn theo tab; đóng tab kết thúc persistence. XSS vẫn đọc được token. Không dùng HTML chưa sanitize hay log token; Backend cần CSP/HTTPS và có thể chuyển sang cookie HttpOnly nếu hỗ trợ contract đó.

Refresh single-flight, thay access/refresh cùng lúc; GET retry tối đa một lần. POST/PATCH/DELETE không tự replay. Refresh lỗi mạng/5xx/contract giữ token để thử lại; lỗi refresh 400/401/403 xóa phiên. Logout xóa local ngay và thông báo nếu chưa xác minh blacklist server. Guard frontend chỉ phục vụ UX; Django phải thực thi quyền cuối cùng.

## Kết nối Backend

Đảm bảo Django đang chạy trên host/port đã cấu hình (ví dụ Backend developer chạy `python manage.py runserver 0.0.0.0:8000` trong repo Django). CORS phải cho phép origin frontend thực tế, ví dụ http://localhost:5173 hoặc http://192.168.1.110:5173, các header Content-Type/Authorization và method tương ứng. Không dùng no-cors, wildcard hoặc cookie credentials để né lỗi.

Jobs được gọi từ Next server nên còn phụ thuộc mạng từ máy host Next tới Django; auth được gọi từ browser và cần CORS. `ERR_CONNECTION_REFUSED`/timeout khác HTTP 401/403. Xem [API gaps](docs/API_GAPS.md), [mapping](docs/API_INTEGRATION.md), [status](docs/FRONTEND_STATUS.md) và [plan](frontend/FRONTEND_IMPLEMENTATION_PLAN.md).

## Chưa triển khai

Candidate profile/CV/applications, Employer company/jobs/applicants, Admin, public companies và dashboard chưa có contract/schema trong checkout. Không tạo endpoint, số liệu hay dashboard giả. Cần Backend source/OpenAPI, dữ liệu test và tài khoản test để triển khai và nghiệm thu fullstack.
