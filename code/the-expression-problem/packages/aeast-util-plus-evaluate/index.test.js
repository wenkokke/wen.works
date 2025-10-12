/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").Constant} Constant
 * @typedef {import("aeast-util-plus").Plus} Plus
 * @typedef {import("aeast-util-evaluate").Options} Options
 */
import { evaluate } from "aeast-util-evaluate";
import { expect, test } from "@jest/globals";
import options from "./index.js"

/** @type {AExp} */
const example = {
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
  expect(evaluate(options)(example)).toBe(3);
});
