import { ApiError, isRecord } from "./errors";
export type UserRole = "CANDIDATE" | "EMPLOYER" | "ADMIN";
export type AuthUser = {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at?: string;
};
export type AuthTokens = { access: string; refresh: string };
export type AuthResponse = AuthTokens & { user: AuthUser };
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = LoginPayload & {
  first_name?: string;
  last_name?: string;
  role: "CANDIDATE" | "EMPLOYER";
};

export function parseTokens(input: unknown): AuthTokens {
  if (
    !isRecord(input) ||
    typeof input.access !== "string" ||
    !input.access ||
    typeof input.refresh !== "string" ||
    !input.refresh
  )
    throw new ApiError(
      "Response xác thực thiếu access/refresh theo contract.",
      "contract",
    );
  return { access: input.access, refresh: input.refresh };
}
export function parseUser(input: unknown): AuthUser {
  if (
    !isRecord(input) ||
    !["string", "number"].includes(typeof input.id) ||
    typeof input.email !== "string" ||
    !["CANDIDATE", "EMPLOYER", "ADMIN"].includes(String(input.role))
  )
    throw new ApiError(
      "Response người dùng không khớp contract (id, email hoặc role).",
      "contract",
    );
  if (
    (input.first_name !== undefined && typeof input.first_name !== "string") ||
    (input.last_name !== undefined && typeof input.last_name !== "string")
  )
    throw new ApiError("Response tên người dùng không hợp lệ.", "contract");
  return {
    id: input.id as string | number,
    email: input.email,
    first_name: typeof input.first_name === "string" ? input.first_name : "",
    last_name: typeof input.last_name === "string" ? input.last_name : "",
    role: input.role as UserRole,
    ...(typeof input.created_at === "string"
      ? { created_at: input.created_at }
      : {}),
  };
}
export function parseAuthResponse(input: unknown): AuthResponse {
  const tokens = parseTokens(input);
  if (!isRecord(input))
    throw new ApiError("Response xác thực không hợp lệ.", "contract");
  return { ...tokens, user: parseUser(input.user) };
}

const KEY = "ptit_careerhub_session_v1";
let revision = 0;
const listeners = new Set<() => void>();
export function onSessionChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function sessionRevision() {
  return revision;
}
function storage() {
  return typeof window === "undefined" ? undefined : window.sessionStorage;
}
export function getTokens(): AuthTokens | null {
  const value = storage()?.getItem(KEY);
  if (!value) return null;
  try {
    return parseTokens(JSON.parse(value));
  } catch {
    storage()?.removeItem(KEY);
    return null;
  }
}
export function setTokens(tokens: AuthTokens) {
  const store = storage();
  if (!store)
    throw new ApiError(
      "Không thể lưu phiên đăng nhập trong trình duyệt.",
      "configuration",
    );
  store.setItem(
    KEY,
    JSON.stringify({ access: tokens.access, refresh: tokens.refresh }),
  );
  revision++;
  listeners.forEach((listener) => listener());
}
export function clearTokens() {
  storage()?.removeItem(KEY);
  revision++;
  listeners.forEach((listener) => listener());
}
export function removeLegacyTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("ptit_careerhub_access_token");
  window.localStorage.removeItem("ptit_careerhub_refresh_token");
}
