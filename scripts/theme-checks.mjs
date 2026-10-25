import assert from "node:assert/strict";

const key = "ptit_careerhub_theme_v1";
const toggleName = "Giao diện tối";
export function trackBrowserErrors(page, errors) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/hydration|hydrated|server rendered html/i.test(message.text()))
      errors.push(message.text());
  });
}

export async function expectTheme(page, theme) {
  await page.waitForFunction(
    (value) => document.documentElement.dataset.theme === value,
    theme,
  );
  const toggle = page.getByRole("button", { name: toggleName, exact: true });
  await toggle.waitFor();
  await page.waitForFunction(
    () => !document.querySelector(".theme-toggle")?.disabled,
  );
  assert.equal(
    await toggle.getAttribute("aria-pressed"),
    String(theme === "dark"),
  );
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).colorScheme,
    ),
    theme,
  );
}

export async function selectTheme(page, theme) {
  await page.waitForFunction(
    () => !document.querySelector(".theme-toggle")?.disabled,
  );
  if ((await page.locator("html").getAttribute("data-theme")) !== theme)
    await page.getByRole("button", { name: toggleName, exact: true }).click();
  await expectTheme(page, theme);
}

export async function runThemeChecks(browser, origin, check, errors) {
  await check(
    "theme follows system until explicit choice; toggle persists across routes reload and tabs",
    async () => {
      const context = await browser.newContext({ colorScheme: "light" });
      try {
        const page = await context.newPage();
        trackBrowserErrors(page, errors);
        await page.goto(origin + "/");
        await expectTheme(page, "light");
        assert.equal(
          await page.evaluate((k) => localStorage.getItem(k), key),
          null,
        );
        await page.emulateMedia({ colorScheme: "dark" });
        await expectTheme(page, "dark");
        await page.getByRole("button", { name: toggleName }).focus();
        await page.keyboard.press("Space");
        await expectTheme(page, "light");
        assert.equal(
          await page.evaluate((k) => localStorage.getItem(k), key),
          "light",
        );
        await page.emulateMedia({ colorScheme: "light" });
        await page.emulateMedia({ colorScheme: "dark" });
        await expectTheme(page, "light");
        await selectTheme(page, "dark");
        // Use client links so the root provider must survive App Router transitions.
        for (const [name, url] of [
          ["Tìm việc", "**/jobs"],
          [/Frontend Developer Test Fixture/, "**/jobs/1"],
        ]) {
          const scope =
            typeof name === "string" ? page.locator("#main-navigation") : page;
          await scope.getByRole("link", { name }).first().click();
          await page.waitForURL(url);
          await expectTheme(page, "dark");
        }
        await page.reload();
        await expectTheme(page, "dark");
        const second = await context.newPage();
        trackBrowserErrors(second, errors);
        await second.goto(origin + "/register");
        await expectTheme(second, "dark");
        await selectTheme(page, "light");
        await expectTheme(second, "light");
        await second.emulateMedia({ colorScheme: "dark" });
        await expectTheme(second, "light");
        await page.evaluate((k) => localStorage.removeItem(k), key);
        // Clearing the saved preference restores the other tab's system default.
        await expectTheme(second, "dark");
      } finally {
        await context.close();
      }
    },
  );

  await check(
    "dark system default and blocked storage remain usable",
    async () => {
      for (const blocked of [false, true]) {
        const context = await browser.newContext({ colorScheme: "dark" });
        try {
          if (blocked)
            await context.addInitScript(() => {
              Object.defineProperty(window, "localStorage", {
                get() {
                  throw new DOMException("Blocked", "SecurityError");
                },
              });
            });
          const page = await context.newPage();
          trackBrowserErrors(page, errors);
          await page.goto(origin + "/login");
          await expectTheme(page, "dark");
          await selectTheme(page, "light");
          await page.locator(".auth-switch a").click();
          await page.waitForURL("**/register");
          await expectTheme(page, "light");
          await page.reload();
          await expectTheme(page, blocked ? "dark" : "light");
        } finally {
          await context.close();
        }
      }
    },
  );

  await check(
    "saved theme applied before first content paint with hydration bundles blocked",
    async () => {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          colorScheme: theme === "dark" ? "light" : "dark",
        });
        try {
          await context.addInitScript(
            ({ key, theme }) => {
              localStorage.setItem(key, theme);
              window.themeAtPaint = [];
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries())
                  if (entry.name === "first-contentful-paint")
                    window.themeAtPaint.push(
                      document.documentElement.dataset.theme,
                    );
              }).observe({ type: "paint", buffered: true });
            },
            { key, theme },
          );
          await context.route("**/_next/**/*.js*", (route) => route.abort());
          const page = await context.newPage();
          trackBrowserErrors(page, errors);
          await page.goto(origin + "/login");
          await page.waitForFunction(() => window.themeAtPaint.length > 0);
          assert.deepEqual(await page.evaluate(() => window.themeAtPaint), [
            theme,
          ]);
          assert.equal(await page.locator("head #theme-bootstrap").count(), 1);
          assert.equal(await page.locator(".theme-toggle").isDisabled(), true);
        } finally {
          await context.close();
        }
      }
    },
  );

  await check(
    "both themes support validation focus feedback and form surfaces",
    async () => {
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        trackBrowserErrors(page, errors);
        for (const theme of ["light", "dark"]) {
          await page.goto(origin + "/login");
          await selectTheme(page, theme);
          await page
            .getByLabel("Email", { exact: true })
            .fill("candidate@example.test");
          await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong");
          await page
            .getByRole("button", { name: "Đăng nhập", exact: true })
            .click();
          await page
            .getByText("Mật khẩu chưa đúng.", { exact: true })
            .waitFor();
          const password = page.getByLabel("Mật khẩu", { exact: true });
          assert.equal(await password.getAttribute("aria-invalid"), "true");
          await password.focus();
          const styles = await password.evaluate((el) => {
            const css = getComputedStyle(el);
            return {
              background: css.backgroundColor,
              color: css.color,
              focus: css.outlineWidth,
              border: css.borderColor,
              error: getComputedStyle(document.documentElement)
                .getPropertyValue("--error")
                .trim(),
            };
          });
          assert.notEqual(styles.background, styles.color);
          assert.equal(styles.focus, "3px");
          // Allow the existing button hover transition to finish before visual review.
          await page.waitForTimeout(250);
          await page.screenshot({
            path: `.next-e2e/qa-validation-${theme}.png`,
            fullPage: true,
          });
          await page.goto(origin + "/register");
          await expectTheme(page, theme);
          await page.getByLabel("Loại tài khoản").selectOption("EMPLOYER");
          await page.goto(origin + "/unknown");
          await page
            .getByRole("heading", { name: "Không tìm thấy trang" })
            .waitFor();
          await expectTheme(page, theme);
        }
      } finally {
        await context.close();
      }
    },
  );
}
