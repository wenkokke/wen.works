import {} from "aeast-util-plus";
/**
 * @typedef {import("aeast-util-to-text").ExtensionHandlers} ExtensionHandlers
 * @typedef {import("aeast-util-to-text").ExtensionPrecs} ExtensionPrecs
 */

/** @type {ExtensionPrecs} */
export const precs = {
  plus: 6,
};

/** @type {ExtensionHandlers} */
export const handlers = {
  plus: (stringifier) => (aexp) => {
    const [aexp1, aexp2] = aexp.children;
    const text1 = stringifier(aexp1, precs.plus);
    const text2 = stringifier(aexp2, precs.plus + 1);
    return `${text1} + ${text2}`;
  },
};

export default { handlers, precs };
