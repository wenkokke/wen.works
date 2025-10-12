/**
 * @typedef {import("aeast").Builtin} Builtin
 * @typedef {import("aeast").AExp} AExp
 * @typedef {import("aeast").AExpMap} AExpMap
 */
/**
 * @template Case
 * @typedef {(aexp: Case) => number} Evaluator<Case>
 */
/**
 * @template Case
 * @typedef {(evaluator: Evaluator<AExp>) => (aexp: Case) => number} Handler<Case>
 */
/**
 * @typedef {{[Case in keyof AExpMap]: Handler<AExpMap[Case]>}} Handlers
 * @typedef {Pick<Handlers, Builtin>} BuiltinHandlers
 * @typedef {Omit<Handlers, Builtin>} ExtensionHandlers
 */

/** @type {BuiltinHandlers} */
const handlers = {
  constant: () => (aexp) => aexp.value,
};

/**
 * @typedef {{handlers: ExtensionHandlers}} Options
 */

/**
 * @param {Options} options
 * @returns {Evaluator<AExp>}
 */
export function evaluate(options) {
  /** @type {Handlers} */
  const allHandlers = { ...handlers, ...options.handlers };
  return evaluator;

  /** @type {Evaluator<AExp>} */
  function evaluator(aexp) {
    // NOTE: This is safe, but passes the type checker only by coincidence...
    // The actual type is...
    /** @type {Handlers[typeof aexp.type]} */
    // TypeScript computes directly with types, and doesn't understand the
    // relation between `aexp.type` and the type of `aexp`. If there were
    // multiple builtin types, this would result in an error, saying that
    // you can't coerce between `Handler<A> | Handler<B>` and `Handler<A | B>`.
    // However, because there is only one builtin type, TypeScript is happy
    // to infer that `aexp` must have type `Constant`.
    const handler = allHandlers[aexp.type];
    return handler(evaluator)(aexp);
  }
}
