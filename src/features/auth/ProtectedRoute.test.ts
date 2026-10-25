import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProtectedRoute } from "./ProtectedRoute";
const state = vi.hoisted(() => ({
  status: "anonymous",
  user: null as null | { role: string },
  error: "",
  restore: vi.fn(),
}));
vi.mock("../../auth/AuthProvider", () => ({ useAuth: () => state }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/account",
}));
const content = "PRIVATE_CONTENT";
function render(roles?: ("CANDIDATE" | "EMPLOYER" | "ADMIN")[]) {
  return renderToStaticMarkup(
    createElement(ProtectedRoute, { roles, children: content }),
  );
}
describe("private and role guard rendering", () => {
  it("never exposes private content while loading", () => {
    state.status = "loading";
    state.user = null;
    expect(render()).not.toContain(content);
  });
  it("never exposes private content to anonymous user", () => {
    state.status = "anonymous";
    state.user = null;
    expect(render()).not.toContain(content);
  });
  it("provides recovery for network initialization failure", () => {
    state.status = "error";
    state.error = "Network unavailable";
    expect(render()).toContain("Thử xác minh lại");
    expect(render()).not.toContain(content);
  });
  it.each(["CANDIDATE", "EMPLOYER", "ADMIN"] as const)(
    "admits %s only to allowed roles",
    (role) => {
      state.status = "authenticated";
      state.user = { role };
      expect(render([role])).toContain(content);
      const other = role === "CANDIDATE" ? "EMPLOYER" : "CANDIDATE";
      expect(render([other])).not.toContain(content);
      expect(render([other])).toContain("Bạn không có quyền");
    },
  );
});
