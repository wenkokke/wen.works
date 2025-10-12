/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").Constant} Constant
 * @typedef {import("aeast-util-plus").Plus} Plus
 * @typedef {import("aeast-util-to-text").Options} Options
 */
import { stringify } from "aeast-util-to-text";
import { expect, test } from "@jest/globals";
import options from "./index.js";

/** @type {AExp} */
export const example = {
  type: "plus",
  children: [
    {
      type: "constant",
      value: 1,
    },
    {
      type: "constant",
      value: 2,
    },
  ],
};

test("onePlusTwo", () => {
  expect(stringify(options)(example, 0)).toBe("1 + 2");
});
