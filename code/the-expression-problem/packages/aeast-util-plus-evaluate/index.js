/**
 * @typedef {import("aeast-util-evaluate").ExtensionHandlers} ExtensionHandlers
 */

/** @type {ExtensionHandlers} */
export const handlers = {
  plus: (evaluator) => (aexp) => {
    const [aexp1, aexp2] = aexp.children;
    return evaluator(aexp1) + evaluator(aexp2);
  },
};

export default { handlers };
