/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").Constant} Constant
 * @typedef {import("aeast-util-plus").Plus} Plus
 * @typedef {import("aeast-util-evaluate").Options} Options
 */
import { evaluateWithTrickery } from "aeast-trickery-evaluate";
import { expect, test } from "@jest/globals";

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

test("onePlusTwoWithTrickery", () => {
  expect(() => evaluateWithTrickery(example)).toThrow(TypeError);
});
