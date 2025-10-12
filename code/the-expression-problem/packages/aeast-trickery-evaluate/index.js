/**
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").Constant} Constant
 * @typedef {import("aeast-util-evaluate").Options} Options
 */

import { evaluate } from "aeast-util-evaluate";

/** @type {Options} */
const options = {
  handlers: {},
};

/** @type {(aexp: AExp) => number} */
export function evaluateWithTrickery(aexp) {
  return evaluate(options)(aexp);
}
