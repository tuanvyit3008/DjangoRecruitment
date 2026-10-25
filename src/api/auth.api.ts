import { request } from "./client";
import {
  parseAuthResponse,
  parseUser,
  getTokens,
  setTokens,
  clearTokens,
  sessionRevision,
  type LoginPayload,
  type RegisterPayload,
} from "./auth";
import { ApiError } from "./errors";

async function authenticate(
  path: string,
  payload: LoginPayload | RegisterPayload,
) {
  const revision = sessionRevision();
  const response = parseAuthResponse(
    await request(path, { method: "POST", body: JSON.stringify(payload) }),
  );
  if (revision !== sessionRevision())
    throw new ApiError(
      "Phiên đã thay đổi. Vui lòng đăng nhập lại.",
      "http",
      401,
    );
  setTokens(response);
  return response.user;
}
export function login(payload: LoginPayload) {
  return authenticate("/auth/login/", {
    email: payload.email,
    password: payload.password,
  });
}
export async function register(payload: RegisterPayload) {
  if (!["CANDIDATE", "EMPLOYER"].includes(payload.role))
    throw new ApiError("Vai trò đăng ký không hợp lệ.", "http", 400);
  return authenticate("/auth/register/", {
    email: payload.email,
    password: payload.password,
    first_name: payload.first_name,
    last_name: payload.last_name,
    role: payload.role,
  });
}
export async function me() {
  return parseUser(await request("/auth/me/", {}, true));
}
export async function logout() {
  const tokens = getTokens();
  // Invalidate in-flight refresh/login before the logout request starts.
  clearTokens();
  if (!tokens) return;
  const { send } = await import("./transport");
  const { browserBaseUrl } = await import("./config");
  await send(
    browserBaseUrl(),
    "/auth/logout/",
    { method: "POST", body: JSON.stringify({ refresh: tokens.refresh }) },
    tokens.access,
  );
}
