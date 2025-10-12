/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("./index.js").Options} Options
 */
import { evaluate } from "./index.js";
import { expect, test } from "@jest/globals";

/** @type {Options} */
const options = { handlers: {} };

/** @type {AExp} */
const example = {
  type: "constant",
  value: 1,
};

test("constant", () => {
  expect(evaluate(options)(example)).toBe(1);
});
