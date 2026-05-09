import { describe, expect, it } from "vitest";
import { isSafeExternalLink } from "./linkUtils";

describe("isSafeExternalLink", () => {
  it("allows known-safe external protocols", () => {
    expect(isSafeExternalLink("https://example.com")).toBe(true);
    expect(isSafeExternalLink("http://example.com")).toBe(true);
    expect(isSafeExternalLink("mailto:dev@example.com")).toBe(true);
    expect(isSafeExternalLink("tel:+123456789")).toBe(true);
  });

  it("rejects unsafe or malformed links", () => {
    expect(isSafeExternalLink("javascript:alert('x')")).toBe(false);
    expect(isSafeExternalLink("data:text/html,<b>x</b>")).toBe(false);
    expect(isSafeExternalLink("/relative/path")).toBe(false);
    expect(isSafeExternalLink("not-a-url")).toBe(false);
  });
});
