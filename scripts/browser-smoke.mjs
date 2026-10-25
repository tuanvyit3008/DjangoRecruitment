import assert from "node:assert/strict";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright-core";
import {
  expectTheme,
  runThemeChecks,
  selectTheme,
  trackBrowserErrors,
} from "./theme-checks.mjs";

// This is an isolated test fixture. The app never uses it outside this script.
const backendPort = 18765;
const frontendPort = 5273;
const base = `http://127.0.0.1:${backendPort}/api/v1`;
const origin = `http://127.0.0.1:${frontendPort}`;
const user = {
  id: 1,
  email: "candidate@example.test",
  first_name: "An",
  last_name: "Nguyen",
  role: "CANDIDATE",
};
const job = {
  id: 1,
  title: "Frontend Developer Test Fixture",
  company: { name: "Fixture Company" },
  location: "Hà Nội",
  employment_type: "FULL_TIME",
  description: "Fixture description only.",
  requirements: "Fixture requirement.",
  benefits: "Fixture benefit.",
};
let registerPayload;
let jobsFailure = false;
let jobsEmpty = false;
let logoutCount = 0;
const backend = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  const url = new URL(req.url, base);
  const send = (data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  const raw = [];
  for await (const chunk of req) raw.push(chunk);
  const body = raw.length ? JSON.parse(Buffer.concat(raw).toString()) : {};
  if (url.pathname === "/api/v1/jobs/") {
    if (jobsFailure)
      return send({ error: { message: "Fixture server error." } }, 500);
    const page = Number(url.searchParams.get("page") || 1);
    return send({
      count: 11,
      next: page === 1 ? `${base}/jobs/?page=2` : null,
      previous: page > 1 ? `${base}/jobs/?page=1` : null,
      results: jobsEmpty ? [] : [job],
    });
  }
  if (url.pathname === "/api/v1/jobs/1/") return send(job);
  if (url.pathname.startsWith("/api/v1/jobs/"))
    return send({ detail: "Not found." }, 404);
  if (url.pathname === "/api/v1/auth/login/") {
    if (body.password === "wrong")
      return send(
        {
          error: {
            message: "Validation failed.",
            details: { password: ["Mật khẩu chưa đúng."] },
          },
        },
        400,
      );
    assert.deepEqual(Object.keys(body).sort(), ["email", "password"]);
    return send({ user, access: "fixture-access", refresh: "fixture-refresh" });
  }
  if (url.pathname === "/api/v1/auth/register/") {
    registerPayload = body;
    return send(
      {
        user: { ...user, role: body.role },
        access: "fixture-access",
        refresh: "fixture-refresh",
      },
      201,
    );
  }
  if (url.pathname === "/api/v1/auth/me/") {
    if (req.headers.authorization !== "Bearer fixture-access")
      return send({}, 401);
    return send({ ...user, role: registerPayload?.role ?? user.role });
  }
  if (url.pathname === "/api/v1/auth/logout/") {
    assert.equal(req.headers.authorization, "Bearer fixture-access");
    assert.deepEqual(body, { refresh: "fixture-refresh" });
    logoutCount++;
    res.writeHead(204).end();
    return;
  }
  return send({ detail: "Not found." }, 404);
});
let app;
let browser;
const logs = [];
const passed = [];
async function check(name, run) {
  await run();
  passed.push(name);
  console.log(`PASS ${name}`);
}
try {
  backend.listen(backendPort, "127.0.0.1");
  await once(backend, "listening");
  const testEnv = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_DIST_DIR: ".next-e2e",
    DJANGO_API_BASE_URL: base,
    NEXT_PUBLIC_DJANGO_API_BASE_URL: base,
  };
  const build = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "build", "--webpack"],
    { env: testEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  );
  let buildLog = "";
  build.stdout.on("data", (chunk) => {
    buildLog += chunk.toString();
  });
  build.stderr.on("data", (chunk) => {
    buildLog += chunk.toString();
  });
  const [buildExit] = await once(build, "exit");
  if (buildExit !== 0)
    throw new Error("Isolated browser-test build failed: " + buildLog);
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      String(frontendPort),
      "-H",
      "127.0.0.1",
    ],
    {
      env: testEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (chunk) => logs.push(chunk.toString()));
  for (let attempt = 0; attempt < 120; attempt++) {
    if (app.exitCode !== null)
      throw new Error("Next test server stopped unexpectedly.");
    try {
      const result = await fetch(origin + "/login");
      if (result.ok) break;
    } catch {}
    if (attempt === 119) throw new Error("Next test server startup timed out.");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  trackBrowserErrors(page, pageErrors);
  await runThemeChecks(browser, origin, check, pageErrors);
  await check(
    "anonymous account access redirects without private content",
    async () => {
      await page.goto(origin + "/account");
      await page.waitForURL("**/login?next=%2Faccount");
      assert.equal(
        await page.getByRole("heading", { name: "Tài khoản của bạn" }).count(),
        0,
      );
    },
  );
  await check(
    "field errors remain visible and password is not reset",
    async () => {
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong");
      await page
        .getByRole("button", { name: "Đăng nhập", exact: true })
        .click();
      await page.getByText("Mật khẩu chưa đúng.", { exact: true }).waitFor();
      assert.equal(
        await page.getByLabel("Mật khẩu", { exact: true }).inputValue(),
        "wrong",
      );
    },
  );
  await check("login updates account and restores on reload", async () => {
    await page.getByLabel("Mật khẩu", { exact: true }).fill("fixture-password");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/account");
    await page.getByRole("heading", { name: "Tài khoản của bạn" }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Tài khoản của bạn" }).waitFor();
    await page.getByText(user.email, { exact: true }).waitFor();
  });
  await check(
    "network failure during session restore preserves credentials",
    async () => {
      await page.route("**/auth/me/", (route) => route.abort("failed"));
      await page.reload();
      await page.getByRole("button", { name: "Thử xác minh lại" }).waitFor();
      assert.notEqual(
        await page.evaluate(() =>
          sessionStorage.getItem("ptit_careerhub_session_v1"),
        ),
        null,
      );
      await page.unroute("**/auth/me/");
      await page.getByRole("button", { name: "Thử xác minh lại" }).click();
      await page.getByRole("heading", { name: "Tài khoản của bạn" }).waitFor();
    },
  );
  await check(
    "logout clears session and protected page redirects",
    async () => {
      await page
        .getByRole("button", { name: "Đăng xuất", exact: true })
        .click();
      await page.waitForURL("**/login");
      assert.equal(logoutCount, 1);
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("ptit_careerhub_session_v1"),
        ),
        null,
      );
      await page.goto(origin + "/account");
      await page.waitForURL("**/login?next=%2Faccount");
    },
  );
  await check(
    "registration uses correct fields and excludes ADMIN",
    async () => {
      await page.goto(origin + "/register?role=EMPLOYER");
      await page.getByLabel("Loại tài khoản").waitFor();
      assert.deepEqual(
        await page
          .locator("#role option")
          .evaluateAll((options) => options.map((o) => o.value)),
        ["CANDIDATE", "EMPLOYER"],
      );
      await page.getByLabel("Tên", { exact: true }).fill("An");
      await page.getByLabel("Họ", { exact: true }).fill("Nguyen");
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page
        .getByLabel("Mật khẩu", { exact: true })
        .fill("fixture-password");
      await page
        .getByRole("button", { name: "Tạo tài khoản", exact: true })
        .click();
      await page.waitForURL("**/account");
      assert.deepEqual(
        Object.keys(registerPayload).sort(),
        ["email", "password", "first_name", "last_name", "role"].sort(),
      );
      assert.equal(registerPayload.role, "EMPLOYER");
    },
  );
  await check(
    "jobs pagination preserves query and direct detail works",
    async () => {
      await page.goto(
        origin + "/jobs?search=React&location=H%C3%A0+N%E1%BB%99i",
      );
      await page.getByRole("link", { name: "Trang sau" }).click();
      await page.waitForURL("**/jobs?**page=2**");
      const current = new URL(page.url());
      assert.equal(current.searchParams.get("search"), "React");
      assert.equal(current.searchParams.get("location"), "Hà Nội");
      await page
        .getByRole("link", { name: /Frontend Developer Test Fixture/ })
        .click();
      await page.waitForURL("**/jobs/1");
      await page.getByRole("heading", { name: job.title }).waitFor();
      await page.reload();
      await page.getByRole("heading", { name: job.title }).waitFor();
      assert.equal(await page.getByText("Đã ghi nhận quan tâm.").count(), 0);
    },
  );
  await check("404 and Backend error render without demo jobs", async () => {
    for (const theme of ["light", "dark"]) {
      await page.goto(origin + "/jobs");
      await selectTheme(page, theme);
      await page.goto(origin + "/jobs/missing");
      await page
        .getByRole("heading", { name: "Không tìm thấy trang" })
        .waitFor();
      await page.goto(origin + "/unknown");
      await page
        .getByRole("heading", { name: "Không tìm thấy trang" })
        .waitFor();
      jobsFailure = true;
      await page.goto(origin + "/jobs");
      await page.locator('.error-notice[role="alert"]').waitFor();
      await expectTheme(page, theme);
      assert.equal(
        await page.getByRole("heading", { name: job.title }).count(),
        0,
      );
      jobsFailure = false;
      jobsEmpty = true;
      await page.goto(origin + "/jobs");
      await page.locator(".empty").waitFor();
      await expectTheme(page, theme);
      jobsEmpty = false;
    }
  });
  await check(
    "no horizontal overflow on mobile tablet laptop desktop",
    async () => {
      for (const theme of ["light", "dark"]) {
        await page.goto(origin + "/jobs");
        await selectTheme(page, theme);
        for (const width of [320, 360, 390, 768, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          for (const path of [
            "/",
            "/jobs",
            "/jobs/1",
            "/register",
            "/account",
          ]) {
            await page.goto(origin + path);
            await page.waitForLoadState("networkidle");
            await expectTheme(page, theme);
            assert.equal(await page.locator(".theme-toggle").isVisible(), true);
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              `overflow at ${width}px ${path}`,
            );
            if (
              ["/", "/jobs", "/jobs/1"].includes(path) &&
              [390, 1440].includes(width)
            )
              await page.screenshot({
                path: `.next-e2e/qa-${path === "/" ? "home" : path === "/jobs" ? "jobs" : "detail"}-${theme}-${width}.png`,
                fullPage: true,
              });
          }
        }
      }
    },
  );
  await check(
    "mobile navigation opens and closes with accessible controls",
    async () => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(origin + "/jobs");
      await page.getByRole("button", { name: "Mở menu" }).click();
      await page
        .locator("#main-navigation")
        .getByRole("link", { name: "Tìm việc" })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Mở menu" })
          .getAttribute("aria-expanded"),
        "false",
      );
    },
  );
  assert.deepEqual(pageErrors, []);
  console.log(
    `Browser fixture tests: ${passed.length} passed; 0 uncaught browser errors. Django LAN remains unverified.`,
  );
} finally {
  await browser?.close();
  if (app?.pid) {
    if (process.platform === "win32") {
      const killer = spawnSync(
        "taskkill",
        ["/pid", String(app.pid), "/T", "/F"],
        {
          stdio: "ignore",
          windowsHide: true,
          timeout: 5000,
        },
      );
      if (killer.status !== 0 && app.exitCode === null) app.kill();
    } else app.kill("SIGTERM");
  }
  backend.closeAllConnections();
  await new Promise((resolve) => backend.close(resolve));
}
