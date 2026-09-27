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
    ["#/lesson/alphabet-3", { name: "lesson", id: "alphabet-3" }],
    ["#/practice/custom", { name: "custom" }],
    ["#/session", { name: "session" }],
  ])("%s", (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it("round-trips through hrefOf", () => {
    for (const hash of ["#/", "#/alphabet", "#/alphabet/tho", "#/practice", "#/profile", "#/stats", "#/words", "#/words/greetings", "#/words/my", "#/backup", "#/about", "#/credits", "#/lessons", "#/lesson/alphabet-2", "#/practice/custom", "#/practice/pairs", "#/practice/match", "#/session"]) {
      expect(hrefOf(parseHash(hash))).toBe(hash);
    }
  });
});

describe("tabOf", () => {
  it("maps screens to bottom-nav tabs", () => {
    expect(tabOf({ name: "letter", id: "tho" })).toBe("alphabet");
    expect(tabOf({ name: "settings" })).toBe("profile");
    expect(tabOf({ name: "not-found", path: "/x" })).toBeNull();
    expect(tabOf({ name: "session" })).toBeNull();
    expect(tabOf({ name: "lesson", id: "alphabet-1" })).toBe("learn");
  });
});
