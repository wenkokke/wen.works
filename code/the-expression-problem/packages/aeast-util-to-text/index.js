/**
 * @typedef {import("aeast").Builtin} Builtin
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").AExpMap} AExpMap
 */
/**
 * @template Case
 * @typedef {(aexp: Case, prec: number) => string} Stringifier<Case>
 */
/**
 * @template Case
 * @typedef {(stringifier: Stringifier<AExp>) => Stringifier<Case>} Handler<Case>
 */
/**
 * @typedef {{[Case in keyof AExpMap]: Handler<AExpMap[Case]>}} Handlers
 * @typedef {Pick<Handlers, Builtin>} BuiltinHandlers
 * @typedef {Omit<Handlers, Builtin>} ExtensionHandlers
 */

/** @type {BuiltinHandlers} */
const handlers = {
  constant: () => (aexp) => String(aexp.value),
};

/**
 * @typedef {Record<keyof AExpMap,number>} Precs
 * @typedef {Pick<Precs, Builtin>} BuiltinPrecs
 * @typedef {Omit<Precs, Builtin>} ExtensionPrecs
 */

/** @type {BuiltinPrecs} */
const precs = {
  constant: 9,
};

/**
 * @typedef {{handlers: ExtensionHandlers, precs: ExtensionPrecs}} Options
 */

/**
 * @param {Options} options
 * @returns {Stringifier<AExp>}
 */
export function stringify(options) {
  /** @type {Handlers} */
  const allHandlers = { ...handlers, ...options.handlers };
  /** @type {Precs} */
  const allPrecs = { ...precs, ...options.precs };
  return stringifier;

  /** @type {Stringifier<AExp>} */
  function stringifier(aexp, prec) {
    // NOTE: This is safe, but relies on lies. The actual type is...
    // /** @type {Handlers[typeof aexp.type]} */
    // However, TypeScript computes directly with types, and doesn't understand
    // the relation between `aexp.type` and the type of `aexp`.
    /** @type {Handler<any>} */
    const handler = allHandlers[aexp.type];
    const text = handler(stringifier)(aexp, 0);
    return prec > allPrecs[aexp.type] ? `(${text})` : text;
  }
}
