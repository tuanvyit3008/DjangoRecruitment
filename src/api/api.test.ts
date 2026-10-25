import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { send } from "./transport";
import { ApiError, parseApiError } from "./errors";
import { validateBaseUrl } from "./config";
import {
  getTokens,
  setTokens,
  clearTokens,
  parseAuthResponse,
  parseUser,
} from "./auth";
import { request } from "./client";
import * as authApi from "./auth.api";
import { parseJobsPage, jobsQuery } from "./jobs";

const base = "http://backend.test/api/v1";
const user = {
  id: 1,
  email: "test@example.test",
  first_name: "An",
  last_name: "Nguyen",
  role: "CANDIDATE",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function sessionStorageMock() {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  };
}
beforeEach(() => {
  vi.stubGlobal("window", {
    sessionStorage: sessionStorageMock(),
    localStorage: sessionStorageMock(),
  });
  vi.stubEnv("NEXT_PUBLIC_DJANGO_API_BASE_URL", base);
  vi.stubEnv("DJANGO_API_BASE_URL", base);
  clearTokens();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("configuration and errors", () => {
  it("keeps the API prefix once and normalizes trailing slash", () =>
    expect(validateBaseUrl(base + "///")).toBe(base));
  it.each([
    "",
    "http://backend.test/api",
    "http://backend.test/api/v1/api/v1",
    "http://user:password@backend.test/api/v1",
    "javascript:alert(1)",
  ])("rejects invalid configuration %s", (value) =>
    expect(() => validateBaseUrl(value)).toThrow(ApiError),
  );
  it("maps structured field errors", () => {
    const e = parseApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed.",
        details: { email: ["Required"] },
      },
    });
    expect(e.fields.email).toEqual(["Required"]);
    expect(e.status).toBe(400);
  });
  it("maps plain DRF fields", () =>
    expect(parseApiError(400, { email: ["Invalid"] }).fields.email).toEqual([
      "Invalid",
    ]));
  it("hides HTML and server internals", () => {
    expect(
      parseApiError(500, { detail: "Traceback secret" }).message,
    ).not.toContain("secret");
    expect(parseApiError(400, "<html>trace</html>").message).not.toContain(
      "<html>",
    );
  });
});

describe("transport", () => {
  it("does not attach auth to public calls", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    setTokens({ access: "secret", refresh: "r" });
    await request("/jobs/");
    expect(
      new Headers(fetcher.mock.calls[0][1].headers).has("Authorization"),
    ).toBe(false);
  });
  it("adds JSON header and bearer only when supplied", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    await send(base, "/business/", { method: "POST", body: "{}" }, "a");
    const headers = new Headers(fetcher.mock.calls[0][1].headers);
    expect(headers.get("Authorization")).toBe("Bearer a");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(fetcher.mock.calls[0][0]).toBe(base + "/business/");
  });
  it("lets browser generate multipart boundary", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    const body = new FormData();
    body.set("file", new Blob(["PDF"]), "cv.pdf");
    await send(base, "/upload/", { method: "POST", body });
    expect(
      new Headers(fetcher.mock.calls[0][1].headers).has("Content-Type"),
    ).toBe(false);
  });
  it("handles HTTP 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    expect(await send(base, "/logout/")).toBeUndefined();
  });
  it("rejects successful HTML as contract error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>oops</html>")),
    );
    await expect(send(base, "/jobs/")).rejects.toMatchObject({
      kind: "contract",
    });
  });
  it("distinguishes network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );
    await expect(send(base, "/jobs/")).rejects.toMatchObject({
      kind: "network",
    });
  });
  it("times out instead of loading forever", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener("abort", () =>
              reject(new Error("abort")),
            ),
          ),
      ),
    );
    const pending = expect(send(base, "/jobs/")).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(8000);
    await pending;
  });
  it("rejects cross-origin endpoint injection", async () => {
    await expect(send(base, "//attacker.test/")).rejects.toMatchObject({
      kind: "configuration",
    });
  });
});

describe("authentication", () => {
  it("login sends email/password and stores exact JWT fields", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(json({ ...user, user, access: "a", refresh: "r" }));
    vi.stubGlobal("fetch", fetcher);
    expect(
      await authApi.login({ email: user.email, password: "test-only" }),
    ).toEqual(user);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      email: user.email,
      password: "test-only",
    });
    expect(getTokens()).toEqual({ access: "a", refresh: "r" });
  });
  it("registration sends names and uppercase role without arbitrary fields", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(json({ user, access: "a", refresh: "r" }, 201));
    vi.stubGlobal("fetch", fetcher);
    await authApi.register({
      email: user.email,
      password: "test-only",
      first_name: "An",
      last_name: "Nguyen",
      role: "CANDIDATE",
    });
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      email: user.email,
      password: "test-only",
      first_name: "An",
      last_name: "Nguyen",
      role: "CANDIDATE",
    });
  });
  it("rejects public ADMIN registration even if called outside form", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(
      authApi.register({
        email: user.email,
        password: "test",
        role: "ADMIN" as "CANDIDATE",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("invalid credentials leave no session", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          json({ error: { message: "Invalid credentials." } }, 401),
        ),
    );
    await expect(
      authApi.login({ email: user.email, password: "wrong" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(getTokens()).toBeNull();
  });
  it("requires exact access/refresh and verified role shapes", () => {
    expect(() =>
      parseAuthResponse({ user, access_token: "a", refresh_token: "r" }),
    ).toThrow(ApiError);
    expect(() => parseUser({ ...user, role: "candidate" })).toThrow(ApiError);
  });
  it("initializes current user with bearer token", async () => {
    setTokens({ access: "a", refresh: "r" });
    const fetcher = vi.fn().mockResolvedValue(json(user));
    vi.stubGlobal("fetch", fetcher);
    expect(await authApi.me()).toEqual(user);
    expect(
      new Headers(fetcher.mock.calls[0][1].headers).get("Authorization"),
    ).toBe("Bearer a");
  });
  it("shares refresh for concurrent 401s and rotates both tokens", async () => {
    setTokens({ access: "old", refresh: "old-r" });
    let refreshCount = 0;
    const fetcher = vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith("/auth/refresh/")) {
        refreshCount++;
        expect(JSON.parse(String(options.body))).toEqual({ refresh: "old-r" });
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json({ access: "new", refresh: "new-r" });
      }
      return new Headers(options.headers).get("Authorization") === "Bearer new"
        ? json({ ok: true })
        : json({}, 401);
    });
    vi.stubGlobal("fetch", fetcher);
    await Promise.all([
      request("/one/", {}, true),
      request("/two/", {}, true),
      request("/three/", {}, true),
    ]);
    expect(refreshCount).toBe(1);
    expect(getTokens()).toEqual({ access: "new", refresh: "new-r" });
  });
  it("does not rotate twice for a late original 401", async () => {
    setTokens({ access: "old", refresh: "old-r" });
    let rotations = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith("/auth/refresh/")) {
          rotations++;
          return json({ access: "new", refresh: "new-r" });
        }
        if (new Headers(options.headers).get("Authorization") === "Bearer new")
          return json({ ok: true });
        if (url.endsWith("/slow/")) await new Promise((r) => setTimeout(r, 30));
        return json({}, 401);
      }),
    );
    await Promise.all([
      request("/fast/", {}, true),
      request("/slow/", {}, true),
    ]);
    expect(rotations).toBe(1);
  });
  it("retries at most once and clears rejected replacement token", async () => {
    setTokens({ access: "old", refresh: "r" });
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith("/auth/refresh/")
        ? json({ access: "new", refresh: "new-r" })
        : json({}, 401),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/private/", {}, true)).rejects.toMatchObject({
      status: 401,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(getTokens()).toBeNull();
  });
  it("invalid refresh clears session", async () => {
    setTokens({ access: "old", refresh: "r" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({}, 401)),
    );
    await expect(request("/private/", {}, true)).rejects.toMatchObject({
      status: 401,
    });
    expect(getTokens()).toBeNull();
  });
  it("refresh network failure preserves tokens", async () => {
    setTokens({ access: "old", refresh: "r" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/auth/refresh/")) throw new TypeError("network");
        return json({}, 401);
      }),
    );
    await expect(request("/private/", {}, true)).rejects.toMatchObject({
      kind: "network",
    });
    expect(getTokens()?.refresh).toBe("r");
  });
  it("403 does not trigger refresh", async () => {
    setTokens({ access: "a", refresh: "r" });
    const fetcher = vi.fn().mockResolvedValue(json({}, 403));
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/private/", {}, true)).rejects.toMatchObject({
      status: 403,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getTokens()).not.toBeNull();
  });
  it("does not replay writes", async () => {
    setTokens({ access: "a", refresh: "r" });
    const fetcher = vi.fn().mockResolvedValue(json({}, 401));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      request("/create/", { method: "POST", body: "{}" }, true),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("logout sends bearer and current refresh, then clears session", async () => {
    setTokens({ access: "a", refresh: "r" });
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await authApi.logout();
    expect(
      new Headers(fetcher.mock.calls[0][1].headers).get("Authorization"),
    ).toBe("Bearer a");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ refresh: "r" });
    expect(getTokens()).toBeNull();
  });
  it("logout failure clears local tokens but rejects server success", async () => {
    setTokens({ access: "a", refresh: "r" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(authApi.logout()).rejects.toMatchObject({ kind: "network" });
    expect(getTokens()).toBeNull();
  });
  it("a late refresh cannot resurrect a logged-out session", async () => {
    setTokens({ access: "old", refresh: "r" });
    let resolveRefresh: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/auth/refresh/")
          ? new Promise<Response>((resolve) => {
              resolveRefresh = resolve;
            })
          : json({}, 401),
      ),
    );
    const pending = expect(
      request("/private/", {}, true),
    ).rejects.toMatchObject({ status: 401 });
    await vi.waitFor(() => expect(resolveRefresh).toBeDefined());
    clearTokens();
    resolveRefresh!(json({ access: "late", refresh: "late-r" }));
    await pending;
    expect(getTokens()).toBeNull();
  });
});

describe("jobs contract", () => {
  it("parses empty pagination without treating it as an error", () =>
    expect(
      parseJobsPage({ count: 0, next: null, previous: null, results: [] })
        .results,
    ).toEqual([]));
  it.each([
    [],
    {},
    null,
    { count: 1, next: null, previous: null, results: [{ id: 1 }] },
    { count: 1, next: null, previous: null, results: "bad" },
  ])("rejects invalid pagination/job %#", (value) =>
    expect(() => parseJobsPage(value)).toThrow(ApiError),
  );
  it("preserves search and location when building page queries", () => {
    const query = new URLSearchParams(
      jobsQuery({ search: "React", location: "Hà Nội", page: 2 }),
    );
    expect(query.get("search")).toBe("React");
    expect(query.get("location")).toBe("Hà Nội");
    expect(query.get("page")).toBe("2");
  });
  it("does not add invented requirements or benefits", () => {
    const page = parseJobsPage({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, title: "Developer" }],
    });
    expect(page.results[0].requirements).toBeUndefined();
    expect(page.results[0].benefits).toBeUndefined();
  });
});
