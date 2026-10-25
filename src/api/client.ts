import { browserBaseUrl } from "./config";
import { ApiError } from "./errors";
import {
  getTokens,
  setTokens,
  clearTokens,
  parseTokens,
  sessionRevision,
} from "./auth";
import { send } from "./transport";

let refreshInFlight: Promise<string> | null = null;
export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  const tokens = getTokens();
  if (!tokens)
    throw new ApiError("Bạn cần đăng nhập để tiếp tục.", "http", 401);
  const generation = sessionRevision();
  const pending = (async () => {
    try {
      const body = await send(browserBaseUrl(), "/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh: tokens.refresh }),
      });
      const rotated = parseTokens(body);
      if (sessionRevision() !== generation)
        throw new ApiError(
          "Phiên đăng nhập đã thay đổi. Vui lòng thử lại.",
          "http",
          401,
        );
      setTokens(rotated);
      return rotated.access;
    } catch (error) {
      if (
        sessionRevision() === generation &&
        error instanceof ApiError &&
        [400, 401, 403].includes(error.status ?? 0)
      )
        clearTokens();
      throw error;
    }
  })();
  refreshInFlight = pending;
  try {
    return await pending;
  } finally {
    if (refreshInFlight === pending) refreshInFlight = null;
  }
}

// Public calls never attach tokens. Mutation calls are never replayed.
export async function request(
  path: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<unknown> {
  const tokens = authenticated ? getTokens() : null;
  if (authenticated && !tokens)
    throw new ApiError("Bạn cần đăng nhập để tiếp tục.", "http", 401);
  const revision = sessionRevision();
  try {
    return await send(browserBaseUrl(), path, options, tokens?.access);
  } catch (error) {
    const method = (options.method ?? "GET").toUpperCase();
    if (
      !authenticated ||
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      method !== "GET" ||
      (path.startsWith("/auth/") && path !== "/auth/me/")
    )
      throw error;
    if (options.signal?.aborted) throw error;
    // A late 401 may arrive after another request has already rotated tokens.
    const current = getTokens();
    if (
      !current ||
      (revision !== sessionRevision() && current.refresh === tokens?.refresh)
    )
      throw error;
    const access =
      current.access !== tokens?.access
        ? current.access
        : await refreshAccessToken();
    try {
      return await send(browserBaseUrl(), path, options, access);
    } catch (retryError) {
      if (
        retryError instanceof ApiError &&
        retryError.status === 401 &&
        getTokens()?.access === access
      )
        clearTokens();
      throw retryError;
    }
  }
}
