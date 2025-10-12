/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("./index.js").Options} Options
 */
import { stringify } from "./index.js";
import { expect, test } from "@jest/globals";

/** @type {Options} */
const options = { handlers: {}, precs: {} };

/** @type {AExp} */
const example = {
  type: "constant",
  value: 1312,
};

test("id", () => {
  expect(stringify(options)(example, 0)).toBe("1312");
});
