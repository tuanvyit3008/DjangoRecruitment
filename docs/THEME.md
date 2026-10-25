# Dark Mode — PTIT CareerHub

## Cách sử dụng

Nút mặt trăng/mặt trời ở header chuyển Light/Dark Mode trên mọi route, kể cả khi menu mobile đóng. Tên truy cập “Giao diện tối”, `aria-pressed` thể hiện trạng thái; hỗ trợ Tab, Space/Enter.

Lựa chọn được lưu trong `localStorage` với key `ptit_careerhub_theme_v1`, chỉ chứa `light` hoặc `dark`. Khi chưa có lựa chọn hợp lệ, trang theo `prefers-color-scheme` và cập nhật khi hệ thống đổi theme. Các tab đồng bộ qua sự kiện `storage`; xóa preference trả về theme hệ thống. Nếu storage bị chặn, toggle vẫn giữ lựa chọn khi chuyển route trong tab; tải lại sẽ theo hệ thống.

## File và kiến trúc

- `src/theme/theme.ts`: kiểu theme, kiểm tra preference, lưu/đọc storage an toàn, bootstrap.
- `src/theme/ThemeProvider.tsx`: một state tại root, xử lý toggle, thay đổi hệ thống và đồng bộ tab.
- `src/theme/ThemeToggle.tsx`: nút accessible dùng Lucide có sẵn, không thêm dependency.
- `src/app/layout.tsx`: vẫn là Server Component, chứa provider và script inline đồng bộ trong `<head>`. Script đặt `data-theme` trên `<html>` trước khi vẽ body, kể cả khi bundle React chưa tải. `suppressHydrationWarning` chỉ áp dụng cho root vì thuộc tính theme được script thay đổi chủ động. Render đầu tiên của client/server vẫn khớp; toggle chỉ bật khi provider sẵn sàng.
- `src/components/navigation/Header.tsx`: toggle ngoài menu thu gọn, thứ tự DOM phù hợp thứ tự focus/hiển thị.
- `src/styles/global.css`: màu component dùng CSS variables. Light giữ palette cũ; Dark phân tầng canvas/page/card/field với nền xanh đen và màu xanh thương hiệu. Error/warning/success, placeholder, border, focus và disabled có token riêng; disabled không làm mờ toàn bộ component.
- `src/theme/theme.test.ts`: unit tests preference/storage/bootstrap.
- `scripts/theme-checks.mjs`, `scripts/browser-smoke.mjs`: Chrome tests với production build và API fixture riêng.
- `docs/THEME.md`, `docs/FRONTEND_STATUS.md`: tài liệu tính năng và kết quả kiểm tra.

Các route page tiếp tục là Server Components. Browser APIs chỉ chạy trong bootstrap hoặc lifecycle/event của client provider. Không sửa Backend, API contract, package hoặc cơ chế fallback.

## Phạm vi

Home, jobs, job detail, login/register/account, header/footer/menu mobile, input/select/button, badge, pagination, loading/empty/error/404 và feedback đều dùng tokens. Loading/error boundary dùng các lớp `page`, `empty`, `error-notice` chung. Chưa có portal Candidate/Employer/Admin, dialog hoặc table trong codebase; không tạo giao diện giả.

## Kết quả thực tế

- `npm test`: 59 test đạt, gồm 12 test mới cho theme default, preference hợp lệ/không hợp lệ, storage bị chặn và bootstrap trước React.
- `npm run typecheck`: đạt, TypeScript strict.
- `npm run format:check`: đạt.
- `npm run build`: đạt, Next.js 16.4.3 production webpack build.
- `npm run test:browser`: 14 nhóm kiểm tra đạt trên Chrome. Gồm theme hệ thống, toggle bằng bàn phím, tải lại/chuyển route, đồng bộ tab, storage bị chặn, validation/focus/select/404/error/empty và các luồng auth/jobs sẵn có. Không ghi nhận uncaught page error hoặc cảnh báo hydration.
- Pre-paint: chặn bundle Next/React, lưu theme trái với hệ thống, xác nhận `first-contentful-paint` đã mang đúng theme ở cả hai chiều. Bootstrap không chờ hydration.
- Responsive: cả hai theme tại 320, 360, 390, 768, 1280, 1440px trên home/jobs/detail/register/account; không tràn ngang, toggle luôn hiển thị. Login và validation kiểm tra riêng.
- Ảnh QA `.next-e2e/qa-*.png` (không commit), gồm home/jobs/detail mobile/desktop và validation sáng/tối. Dữ liệu fixture chỉ dùng trong kiểm thử.
- ESLint chưa cấu hình; không có kết luận lint đạt.

Browser suite dùng fixture cục bộ, không chứng minh tích hợp Django thật hoặc các portal chưa triển khai. Loading/error boundary được rà soát qua CSS dùng chung; chưa gây lỗi render chủ động để kiểm thử error boundary riêng. Chưa thực hiện screen reader thủ công hoặc audit WCAG đầy đủ.

## Tự xác minh

1. Chạy `npm run dev`, mở route bất kỳ và đổi theme trên header.
2. Chuyển qua jobs/detail/login/register/account và tải lại; theme giữ nguyên.
3. Xóa preference rồi đổi thiết lập sáng/tối hệ thống; trang theo hệ thống.
4. Mở tab thứ hai, đổi theme tab đầu và quan sát đồng bộ.
5. Chạy các lệnh kiểm tra ở trên. Browser suite cần Google Chrome và tự dựng production test server/API fixture.
