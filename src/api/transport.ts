import { ApiError, parseApiError } from "./errors";

export async function send(
  base: string,
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<unknown> {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://"))
    throw new ApiError("Đường dẫn API không hợp lệ.", "configuration");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 8000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
    if (response.status === 204) return undefined;
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      if (response.ok)
        throw new ApiError(
          "Backend trả dữ liệu không phải JSON như contract yêu cầu.",
          "contract",
        );
    }
    if (!response.ok) throw parseApiError(response.status, body);
    if (body === undefined)
      throw new ApiError(
        "Backend trả response trống ngoài contract.",
        "contract",
      );
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (options.signal?.aborted) throw error;
    if (timedOut)
      throw new ApiError(
        "Backend phản hồi quá chậm. Vui lòng thử lại.",
        "timeout",
      );
    throw new ApiError(
      "Không thể kết nối Backend. Kiểm tra địa chỉ API, server, firewall và CORS của frontend.",
      "network",
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
