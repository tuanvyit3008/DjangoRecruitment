export type ErrorKind =
  "configuration" | "network" | "timeout" | "http" | "contract";
export class ApiError extends Error {
  constructor(
    message: string,
    public kind: ErrorKind,
    public status?: number,
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseApiError(status: number, body: unknown): ApiError {
  const messages: Record<number, string> = {
    400: "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường bên dưới.",
    401: "Phiên đăng nhập không hợp lệ hoặc thông tin đăng nhập chưa đúng.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy dữ liệu được yêu cầu.",
    409: "Dữ liệu bị xung đột. Vui lòng tải lại.",
    429: "Có quá nhiều yêu cầu. Vui lòng thử lại sau.",
  };
  const value = isRecord(body) ? body : {};
  const nested = isRecord(value.error) ? value.error : {};
  const details = isRecord(nested.details) ? nested.details : value;
  const fields: Record<string, string[]> = {};
  for (const [key, item] of Object.entries(details)) {
    if (Array.isArray(item) && item.every((v) => typeof v === "string"))
      fields[key] = item;
    else if (
      typeof item === "string" &&
      !["detail", "message", "code"].includes(key)
    )
      fields[key] = [item];
  }
  const candidate = nested.message ?? value.detail ?? value.message;
  const safeMessage =
    typeof candidate === "string" &&
    candidate.length < 500 &&
    !/[<>]|Traceback|Exception|password=|Bearer /i.test(candidate)
      ? candidate
      : undefined;
  return new ApiError(
    status >= 500
      ? "Backend gặp lỗi. Vui lòng thử lại sau."
      : (safeMessage ??
          messages[status] ??
          `Yêu cầu thất bại (HTTP ${status}).`),
    "http",
    status,
    fields,
  );
}
