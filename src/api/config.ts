import { ApiError } from "./errors";

export function validateBaseUrl(value: string | undefined): string {
  if (!value?.trim())
    throw new ApiError(
      "Chưa cấu hình địa chỉ Django API. Hãy cấu hình biến môi trường và khởi động lại frontend.",
      "configuration",
    );
  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname.replace(/\/+$/, "") !== "/api/v1"
    )
      throw new Error();
    return url.href.replace(/\/+$/, "");
  } catch {
    throw new ApiError(
      "Địa chỉ Django API không hợp lệ: cần URL http(s) kết thúc bằng /api/v1 đúng một lần.",
      "configuration",
    );
  }
}

export function browserBaseUrl(): string {
  return validateBaseUrl(process.env.NEXT_PUBLIC_DJANGO_API_BASE_URL);
}
export function serverBaseUrl(): string {
  return validateBaseUrl(
    process.env.DJANGO_API_BASE_URL ||
      process.env.NEXT_PUBLIC_DJANGO_API_BASE_URL ||
      process.env.VITE_API_BASE_URL,
  );
}
