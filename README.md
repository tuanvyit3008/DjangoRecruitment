# PTIT CareerHub Frontend

## Chạy frontend

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend hiện được cấu hình gọi Backend tại `VITE_API_BASE_URL`. File `.env` đang dùng:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Sau khi sửa `.env`, cần dừng và chạy lại Vite vì biến môi trường được nạp lúc khởi động.

## Chạy Backend Django

Lỗi `net::ERR_CONNECTION_REFUSED` nghĩa là trình duyệt không kết nối được tới `localhost:8000`; đây là lỗi tiến trình Backend chưa chạy hoặc đang chạy ở cổng khác, không phải lỗi route React. Trong thư mục Backend Django, chạy lệnh tương đương:

```powershell
python manage.py runserver 127.0.0.1:8000
```

Nếu Django chạy ở máy/LAN khác, đổi `.env` thành đúng địa chỉ đó, ví dụ `http://192.168.1.93:8000/api/v1`, rồi restart Vite. Backend cũng phải cho phép origin frontend (`http://localhost:5173`) trong CORS.

Kiểm tra nhanh endpoint:

```powershell
Invoke-WebRequest http://localhost:8000/api/v1/jobs/
```

Nếu lệnh này vẫn báo không kết nối được, hãy khởi động Backend hoặc sửa port/base URL trước khi mở `/jobs/1`.

## Build

```powershell
npm run build
```

API mapping và các phần chưa xác minh được ghi trong `docs/API_INTEGRATION.md` và `docs/API_GAPS.md`.
