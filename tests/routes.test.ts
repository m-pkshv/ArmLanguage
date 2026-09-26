import { describe, expect, it } from "vitest";
import { hrefOf, parseHash, tabOf } from "../src/app/routes";

describe("parseHash", () => {
  it.each([
    ["", { name: "home" }],
    ["#/", { name: "home" }],
    ["#/alphabet", { name: "alphabet" }],
    ["#/alphabet/", { name: "alphabet" }],
    ["#/alphabet/tho", { name: "letter", id: "tho" }],
    ["#/settings", { name: "settings" }],
    ["#/nope", { name: "not-found", path: "/nope" }],
    ["#/settings/extra", { name: "not-found", path: "/settings/extra" }],
  ])("%s", (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it("round-trips through hrefOf", () => {
    for (const hash of ["#/", "#/alphabet", "#/alphabet/tho", "#/practice", "#/profile", "#/backup", "#/about", "#/credits"]) {
      expect(hrefOf(parseHash(hash))).toBe(hash);
    }
  });
});

describe("tabOf", () => {
  it("maps screens to bottom-nav tabs", () => {
    expect(tabOf({ name: "letter", id: "tho" })).toBe("alphabet");
    expect(tabOf({ name: "settings" })).toBe("profile");
    expect(tabOf({ name: "not-found", path: "/x" })).toBeNull();
  });
});
