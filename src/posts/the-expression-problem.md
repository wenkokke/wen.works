---
title: "A Nearly Perfect Solution to the Expression Problem in typed JavaScript, Found in the Wild"
pubDate: 2025-10-18
author: "Wen Kokke"
tags: ["javascript", "typescript", "programming languages", "expression problem"]
---

:::teaser
This blog is built using [unifiedjs], an ecosystem of packages built around universal representation of syntax trees and processors.
I had to write a couple of processors to support, e.g., syntax highlighting for Agda, and discovered that, to my surprise, the modular architecture of [unifiedjs] syntax trees and processors is a near-perfect solution to the Expression Problem in typed JavaScript.

Let's have a look at how it works!
:::

What's [unifiedjs]? It's an ecosystem of JavaScript packages, built around [unist], a universal syntax tree, and [unified], a universal syntax processor. The ecosystem has support for loads of different syntaxes, such as [Markdown][mdast] and [HTML][hast], as well as loads of different processors, such as [remark] and [rehype] for parsing, printing, and processing Markdown and HTML, respectively, as well as universal functions such as [map][unist-util-map], [reduce][unist-util-reduce], and [find][unist-util-find].
Each of these are implemented in their own separate packages.

What's the *Expression Problem*? Let's hear it from Philip Wadler, who coined the phrase...

:::epigraph
> The Expression Problem is a new name for an old problem. The goal is to define a datatype by cases, where one can add new cases to the datatype and new functions over the datatype, without recompiling existing code, and while retaining static type safety (e.g., no casts).
> For the concrete example, we take expressions as the data type, begin with one case (constants) and one function (evaluators), then add one more construct (plus) and one more function (conversion to a string).
> [[Philip Wadler, 12 November 1998][The Expression Problem]]{.footer}
:::

Phil focuses on *recompiling* existing code. However, I feel that if one leans too heavily on that specific phrase, it's easy to miss the point, which is to be able to *compose* datatypes and functions on the fly, using independent[^mostly-independent] modules that only specify new cases or how functions act on those cases.

[^mostly-independent]: Mostly independent. As independent as possible. For instance, the module that defines how to convert plus to a string must depend on the module that defines plus.

[^GJ]: Technically, in GJ, which Phil was working on at the time, and which I'm entirely comfortable assuming would've stood for Generic Java if the Java brand wasn't trademarked. However, that'd be a bit confusing for most readers, so I'm smudging the truth a bit, hoping that everything GJ was, Java now is.

Phil goes on to show how to do this in Java[^GJ]. I'll follow his example and show how [unifiedjs] does this in typed using seven JavaScript packages:

- `@types/unist`: defines universal syntax trees.
- `@types/aeast`: defines the expression type and constants.
- `aeast-util-evaluate`: defines evaluate (evaluators).
- `aeast-util-plus`: adds the case for plus.
- `aeast-util-plus-evaluate`: handles evaluate for plus.
- `aeast-util-to-text`: defines stringify (conversion to a string).
- `aeast-util-plus-to-text`: handles stringify for plus.

I'll present these packages as snippets of TypeScript.


## Universal Syntax Trees

The [`@types/unist`][unist] package defines universal syntax trees.
It defines the `Node` type, as well as two subtypes, `Parent` and `Literal`.
These types establish three important invariants.

Every node must have a `type` to distinguish types of nodes:

```ts
interface Node {
  type: string;
}
```

Every parent must have some number of children.

```ts
interface Parent extends Node {
  children: Node[];
}
```

Every literal must have some value.

```ts
interface Literal extends Node {
  value: any;
}
```


## Arithmetic Expressions and The Case for Constants

The `@types/aeast` package defines the type of abstract syntax trees for arithmetic expressions as well as one case for constants.
Let's start with the type of `Constant` nodes.
They are `Literal` nodes, except that their `type` must be `"constant"` and their `value` must be a number.

```ts
interface Constant extends Literal {
  type: "constant";
  value: number;
}
```

The type of arithmetic expressions, `AExp`, is defined as the union of a collection of cases.
Let's go through this one in small steps.

First, we declare an interface, `AExpMap`, which has one property for each case.
This starts out with one property for the constant case.

```ts
interface AExpMap {
  constant: Constant;
}
```

TypeScript declaration files can extend interfaces in *other* namespaces, so we can extend this interface from other packages.

Then, we define the type `AExp` as the union of the types in that interface.

```ts
type AExp = AExpMap[keyof AExpMap];
```

The type `keyof AExpMap` evaluates to the union of all keys of an interface.
Right now, that evaluates to `"constant"`.
However, if we extend `AExpMap` with a case for plus, this will evaluate to the union `"constant" | "plus"`.

The type indexing `AExpMap["constant"]` looks up the type of the `"constant"` property.
Right now, this evaluates to `Constant`.
However, if we extend `AExpMap` with a case for plus, `keyof AExpMap` will evaluate to `"constant" | "plus"`.
Since type indexing distributes over unions, `AExpMap["constant" | "plus"]` will evaluate to `Constant | Plus`.
[^mn-keyof-type]
[^mn-keyof-type]:\
  There is an *implied* relation between the keys of `AExpMap` and the values of `type`.
  This relation isn't enforced by the type system.
  However, I assume this isn't a huge issue in practice.
  If you get this wrong, you'll still get a error *somewhere*.

Since `keyof AExpMap` will evaluate to the union of all keys *currently* in `AExpMap`, it can be useful to list all builtin keys, so that we can distinguish between builtin cases and extensions.

```ts
type Builtin = "constant";
```



## Evaluators and the Handler for Constants

The `aeast-util-evaluate` package defines the `evaluate` function and a handler for constants.

Functions over universal syntax trees are defined as recursive functions over a set of handlers.
Each handler knows how to evaluate its specific case, e.g., the handler for `Constant` only knows how to evaluate constants.
When given a node, the `evaluate` function checks its `type` and calls the appropriate handler.
It passes the handler the node as well as a function that it can use to recursively `evaluate` any child nodes.

Let's start by defining the type for *evaluators*.
The type `Evaluator<Case>` is a generic type with parameter `Case`.
An evaluator that can only evaluate nodes of some concrete type `Case` has type `Evaluator<Case>`.
For instance, the evaluator for constants has type `Evaluator<Constant>`.
An evaluator that can evaluate any arithmetic expression has type `Evaluator<AExp>`.
[^mn-case-extends-aexp-1]
[^mn-case-extends-aexp-1]:\
  In practice, the values for the generic parameter `Case` should extend `AExp`.
  This could be enforced by the type system, by defining `Evaluator` as `type Evaluator<Case extends AExp>`.
  However, the current presentation does not enforce this.

An evaluator of type `Evaluator<Case>` takes a node of type `Case` and returns a number.

```ts
type Evaluator<Case> =
  (aexp: Case) => number;
```

Let's continue by defining the type of *handlers*.
The type `Handler<Case>` is a generic type with parameter `Case`.
A handler is a function that knows constructs an evaluator for some concrete type `Case` when given a *recursive evaluator*, i.e., an evaluator that can be used to evaluate any child arithmetic expressions.
Such a handler has type `Handler<Case>`.
For instance, the handler for constants has type `Handler<Constant>`.
To handler constants, it isn't terribly important to know how to evaluate child arithmetic expressions, since there won't be any.
However, this will be quite important when we implement the handler for plus.
[^mn-case-extends-aexp-2]
[^mn-handler-loop]
[^mn-case-extends-aexp-2]:\
  In practice, the values for the generic parameter `Case` should extend `AExp`.
  As with `Evaluate`, this *could be* enforced by the type system, but isn't in the current presentation.
[^mn-handler-loop]:\
  If `Case` extends `AExp`, then the type of `Handler<Case>` permits us to simply return the evaluator for child arithmetic expressions, i.e.,
  `(evaluator: Evaluator<Case>) => evaluator`.
  However, it will cause the `evaluate` function, which is defined below, to loop.
  Unfortunately, the type checker will accept this program.
  TypeScript does not protect us from loops.


```ts
type Handler<Case> =
  (evaluator: Evaluate<AExp>) => Evaluate<Case>;
```

A complete set of handlers has one handler for every case.
This is defined using a [mapped type][Mapped Types].
For every `Case` in `AExpMap`, a complete set should contain a handler that handles `AExpMap[Case]`.
Right now, this evaluates to `{ constant: Handler<Constant> }`.
However, if we extend `AExpMap` with a case for plus, this will extend to include `{ ..., plus: Handler<Plus> }`.

```ts
type Handlers =
  { [Case in keyof AExpMap]: Handler<AExpMap[Case]>; };
```

Let's define the complete set of handlers for all *builtin* cases, i.e., constants.
The type `Pick<Handlers, Builtin>` removes all keys from the `Handlers` type that aren't listed in `Builtin`.
Hence, even if we extend `AExpMap`, this type will continue to evaluate to `{ constant: Handler<Constant> }`.

The handler for constants is simple.
It ignores the recursive evaluator and simply returns the value of the given `Constant` node.
[^mn-unbound-argument]
[^mn-unbound-argument]:\
  The function `() => ...` implicitly discards any arguments required by its type signature.
  This can be made explicit by writing `(_evaluator: Evaluate<AExp>) => ...`.

```ts
const handlers: Pick<Handlers, Builtin> = {
  constant:
    () => (aexp: Constant) => aexp.value,
};
```

To define the `evaluate` function, we'll need handlers for all extensions.
Let's define an `Options` type that contains those.

```ts
type Options = {
  handlers: Omit<Handlers, Builtin>;
};
```

Finally, let's define the `evaluate` function.
It takes `Options` and returns an evaluator that knows how to evaluate any arithmetic expression.
It builds a complete set of handlers by composing the builtin handlers, which we defined above, with the extension handlers it gets from the options.
Then it defines and returns the `evaluator` function.
This function takes an arimetic expression, looks up the handler for the `Case` that corresponds to its `type`, and calls it, passing itself as the recursive evaluator.

```ts
function evaluate(options: Options): Evaluator<AExp> {
  const allHandlers: Handlers =
    { ...handlers, ...options.handlers };
  return evaluator;
  // where
  function evaluator(aexp: AExp) => number {
    const handler: Handler<Constant> = allHandlers[aexp.type];
    // we'll get back to this ⤴
    return evaluator(handle)(aexp);
  }
}
```

That's it!

Let's have a quick look at how to use this function *as-is*, with no extra cases.

```ts
// Import the function and any relevant types.
import type { Constant } from "aeast";
import type { Options } from "aeast-util-evaluate";
import { evaluate } from "aeast-util-evaluate";

// Define the options, which includes...
const options: Options = {
  // ...a complete set of extension handlers.
  handlers: {}, // In this case, that's none.
};

// Define some example.
const example: Constant = {
  // In this case, that must be a Constant.
  type: "constant",
  value: 1312,
};

// Call evaluate with the options, then...
// ...call the returned evaluator, which...
evaluate(options)(example) // ...returns 1312.
```


## The Case for Plus

The `aeast-util-plus` package adds the case for plus.
Let's start with the type of `Plus` nodes.
They are `Parent` nodes, except that their `type` must be `"plus"` and their `children` must be two `AExp` nodes.
[^mn-tuple-subtype-array]
[^mn-tuple-subtype-array]:\
  The type `[A, A]` is the type of arrays with exactly two elements of type `A`.
  In TypeScript, fixed-length array types are valid subtypes of arbitrary-length array types.
  So `[A, A]` is a valid subtype of `A[]`.

```ts
interface Plus extends Parent {
  type: "plus";
  children: [AExp, AExp];
}
```

To extend the `AExpMap` interface, we use a `declare module` statement to define another instance of the `AExpMap` interface in the `"aeast"` namespace, which was originally declared in the `@types/aeast` package.
[^mn-types-namespace]
[^mn-types-namespace]:\
  The `@types` namespace has special significance in TypeScript.
  The `@types/my-package` namespace exports the types of the `my-package` package.
  This is used to be able to add types to pre-existing untyped JavaScript packages without having to alter the package.

```ts
declare module "aeast" {
  interface AExpMap {
    plus: Plus;
  }
}
```

This does not overwrite the existing `AExpMap`.
Instead, the interface `AExpMap` is defined as the union of all its declarations.
By adding the `aeast-util-plus` package as a dependency, the type checker evaluates the `declare module` statement, and updates the definition of the `AExpMap` interface to:

```ts
interface AExpMap {
  constant: Constant;
  plus: Plus;
}
```


## The Handler for Plus

The `aeast-util-plus-evaluate` package defines the handler for plus.
This package depends on `aeast-util-evaluate` and `aeast-util-plus`, but not on any other packages that add cases.
Hence, in the context of this package, the complete set of extension handlers consists of just the handler for `Plus`.
That is to say, `ExtensionHandlers` evaluates to `{ plus: Handler<Plus> }`.
To handle a `Plus` node, we use the recursive evaluator to evaluate its children and add the results.

```ts
const handlers: ExtensionHandlers = {
  plus:
    (evaluator: Evaluator<AExp>) => (aexp: Plus) => {
      const [aexp1, aexp2] = aexp.children;
      return evaluator(aexp1) + evaluator(aexp2);
    },
};
```

That's it!

Let's have a quick look at how to use `evaluate` with an extra case for plus.
[^mn-import-as-options]
[^mn-import-as-options]:\
  For clarity, the import from `"aeast-util-evaluate-plus"` imports the handlers by name, and adds them to the options field by name.
  However, the import *could* simply be written as `import options from "aeast-util-evaluate-plus"`, because the `Options` type and the inferred type of the `"aeast-util-evaluate-plus"` module are the same.

```ts
// Import the function and any relevant types.
import type { Constant } from "aeast";
import type { Plus } from "aeast-util-plus";
import type { Options } from "aeast-util-evaluate";
import { evaluate } from "aeast-util-evaluate";
// Import the set of extension handlers for plus.
import { handlers } from "aeast-util-evaluate-plus";

// Define the options, which include...
const options: Options = {
  // ...a complete set of extension handlers.
  handlers: handlers, // In this case, that's
                      // those defined for plus.
};

// Define some example.
const example: Plus = {
  // In this case, that may consist of Plus nodes...
  type: "plus",
  children: [
    // ...as well as Constant nodes.
    {
      type: "constant",
      value: 1111,
    },
    {
      type: "constant",
      value: 201,
    },
  ],
};

// Call evaluate with the options, then...
// ...call the returned evaluator, which...
evaluate(options)(example) // ...returns 1312.
```

If we forget to pass the handlers for plus and define options as `{ handlers: {} }`, then the type checker throws the following error:

> Property `plus` is missing in type `{}` but required in type `ExtensionHandlers`.

This is because the type of arithmetic expressions was *implicitly* extended by the import from `"aeast-util-plus"`.

If we do not import `"aeast-util-plus"`, then the type checker throws the following error:

> Type `"plus"` is not assignable to type `"constant"`.

This is because the type of arithmetic expressions was *not* extended, so plus is not allowed.


## Conversion to a String and the Handler for Constants

The `aeast-util-to-text` package defines conversion to a string as the `stringify` function and a handler for constants.

This package is pretty similar to the `aeast-util-evaluate` package.
Phil's example defined the core module as containing both constants and the evaluate function.
However, I've already defined the evaluate function as a modular extension.
Hence, the this section and the next are only there to sate the completionists amongst us, present company included.

Let's start by defining the type for stringifiers.
The `Stringifier<Case>` is a generic type with parameter `Case`.
As with `Evaluator<Case>`, this helps us distinguish between stringifiers that know how to handle *all* arithmetic expressions, i.e., `Stringifier<AExp>`, and stringifiers that only know how to handle as single case, e.g., `Stringifier<Constant>`.

A stringifier of type `Stringifier<Case>` takes a node of type `Case` and the precedence level of its parent node and returns a string.

```ts
type Stringifier<Case> =
  (aexp: Case, prec: number) => string;
```

The type of *handlers* is similar to that for `evaluate`.
A handler of type `Handler<Case>` takes a recursive stringifier and returns a stringifier that knows how to handle nodes of type `Case`.

```ts
type Handler<Case> =
  (stringifier: Stringifier<AExp>) => Stringifier<Case>;
```

A complete set of handlers has one handler for every case.
Likewise, this definition is similar to that for `evaluate`.

```ts
type Handlers =
  { [Case in keyof AExpMap]: Handler<AExpMap[Case]> };
```

The complete set of handlers for all *builtin* cases consists of a single handler for constants.

The handler for constants is simple.
It ignores the recursive stringifier and the precedence and simply returns the value of the given `Constant` node, converted to a string.

```ts
const handlers: Pick<Handlers, Builtin> = {
  constant:
    () => (aexp: Constant) => {
      return String(aexp.value);
    },
};
```

When converting an arithmetic expression to a string, it's important to insert parentheses in the right places.
Let's assume we have plus *and* multiply and consider the abstract syntax tree for `5 * (1 + 2 * 2)`.

- If we put no parentheses in the string, we get `5 * 1 + 2 * 2`.
  <br />
  That gives a different result: `9` instead of `25`.
- If we put parentheses everywhere, we get `(5 * (1 + (2 * 2)))`.
  <br />
  This quickly becomes visually overwhelming.

The usual solution is to keep track of the precedence of each operator as you convert its children to a string.
For instance, when converting the sub-expression `2 * 2`, the precedence of the parent operator is that of plus, say `6`, whereas the precedence of the current expression is that of multiply, say `7`.
Multiply has higher precedence than plus, so we don't need parentheses around this sub-expression.
On the other hand, when converting the sub-expression `1 + 2 * 2`, the precedence of the parent operator is that of multiply, whereas the precedence of the current expression is that of plus, so we *do* need parentheses.

We *could* define the `stringify` function exactly as `evaluate`, but this would make it the responsibility of each individual handler to follow this algorithm. However, it's the same for every node.
Instead, we'll have the `stringify` function decide whether or not to insert parentheses.
Hence, it needs to know the precedence of each node.

Let's define the complete set of *precedences* by analogy to handlers.
For every case, there must be some precedence, which is simply a number.

```ts
type Precs =
  { [Case in keyof AExpMap]: number };
```

The complete set of precedences for all *builtin* nodes consists of a single precedence for constants, say `9`.

```ts
const precs: Pick<Precs, Builtin> = {
  constant: 9,
};
```

To define the `stringify` function, we'll need both complete sets of handlers and precedences for all extensions.
Let's define an `Options` type that contains those.

```ts
type Options = {
  handlers: Omit<Handlers, Builtin>;
  precs: Omit<Precs, Builtin>;
};
```

Finally, let's define the `stringify` function.
As with `evaluate`, it takes `Options` and returns a stringifier that knows how to convert any arithmetic expression to a string.
It builds complete sets of both handlers and precedences and defines and returns the `stringify` function.
This function takes an arithmetic expression, looks up the handler and precedence for the `Case` that corresponds to its `type`, and calls it, passing itself as the recursive stringifier.
To decide whether or not to add parentheses, it compares the precedence of the parent node, which it received as `prec`, to the precedence of the current node.
[^mn-stringify-prec]
[^mn-stringify-prec-minus]
[^mn-stringify-prec]:\
  The `stringifier` function passes the constant precedence `0` to the handler.
  This is not a mistake.
  The individual handlers are intended to *ignore* the precedence that is passed to them.
  Their only responsibility is to pass the correct precedences when converting their child nodes to strings.
  We could remove the `prec` argument from the recursive stringifiers.
  However, this would complicate the current presentation, as the type of the stringifier produced by `stringify` would diverge from the type for recursive stringifiers.
[^mn-stringify-prec-minus]:\
  If we pass all children of an operator node the same precedence, then we could remove all precedence logic from the handlers.
  However, it is often useful for operators to assign different precedences to their children.
  Consider minus.
  The expression `1 - (2 - 3)` means something different from `1 - 2 - 3`.
  However, `(1 - 2) - 3` and `1 - 2 - 3` mean exactly the same thing.

```ts
function stringify(options: Options): Stringifier<AExp> {
  const allHandlers: Handlers =
    { ...handlers, ...options.handlers };
  const allPrecs: Precs =
    { ...precs, ...options.precs };
  return stringifier;
  // where
  function stringifier(aexp: AExp, prec: number): string {
    const handler: Handler<Constant> = allHandlers[aexp.type];
    // we'll get back to this ⤴
    const text: string = handler(stringifier)(aexp, 0);
    return prec > allPrecs[aexp.type] ? `(${text})` : text;
  }
}
```

That's it!

Let’s have a quick look at how to use this function as-is, with no extra cases.

```ts
// Import the function and any relevant types.
import type { Constant } from "aeast";
import type { Options } from "aeast-util-to-text";
import { stringify } from "aeast-util-to-text";

// Define the options, which includes...
const options: Options = {
  // ...a complete set of extension handlers.
  handlers: {}, // In this case, that's none.
  // ...a complete set of extension precedences.
  precs: {}, // In this case, that's still none.
};

// Define some example.
const example: Constant = {
  // In this case, that must be a Constant.
  type: "constant",
  value: 1312,
};


// Call stringify with the options, then...
// ...call the returned stringifier, which...
stringify(options)(example) // ...returns "1312".
```


## The Handler for Plus (Again)

The `aeast-util-plus-to-text` package defines the handler for plus.
This package depends on `aeast-util-to-text` and `aeast-util-plus`, but not on any other packages that add cases.
Hence, in the context of this package, the complete set of extension handlers and precedences consists of just those for `Plus`.

Let's start by defining the precedence.
Earlier, I said `6`.
Let's go with that.

```ts
const precs: ExtensionPrecs = {
  plus: 6,
};
```

To handle a `Plus` node, we use the recursive stringifier to evaluate its children and join the results with a `"+"` in between and some nice spacing.
For both children, we pass the precedence of plus.
This means that we don't insert parentheses for any nested plusses.
After all `1 + 2 + 3`, `(1 + 2) + 3`, and `1 + (2 + 3)` all mean the same thing.
[^mn-stringify-prec-multiply-and-minus]
[^mn-stringify-prec-multiply-and-minus]:\
  For multiply, this would be the same, except with a high precedence.
  After all `2 * 3 * 4`, `(2 * 3) * 4`, and `2 * (3 * 4)` all mean the same thing.
  However, when mixing plus and multiply, we *do* need parentheses.
  For minus, we would pass the precedence of minus for the first child, but one plus the precedence of minus for the second child.
  This is because `1 - 2 - 3` and `(1 - 2) - 3` mean the same thing, so no parentheses are needed, but `1 - (2 - 3)` means something completely different.

```ts
const handlers: ExtensionHandlers = {
  plus:
    (stringifier: Stringifier<AExp>) => (aexp: Plus) => {
      const [aexp1, aexp2] = aexp.children;
      const text1: string = stringifier(aexp1, precs.plus);
      const text2: string = stringifier(aexp2, precs.plus);
      return `${text1} + ${text2}`;
    },
};
```

That's it!

Let’s have a quick look at how to use `stringify` with the extra case for plus.

```ts
// Import the function and any relevant types.
import type { Constant } from "aeast";
import type { Plus } from "aeast-util-plus";
import type { Options } from "aeast-util-to-text";
import { stringify } from "aeast-util-to-text";
// Import the set of extension handlers and precedences for plus.
import { handlers, precs } from "aeast-util-plus-to-text";

// Define the options, which includes...
const options: Options = {
  // ...a complete set of extension handlers.
  handlers: handlers, // In this case, that's
                      // those defined for plus.
  // ...a complete set of extension precedences.
  precs: precs,       // In this case, that's
                      // those defined for plus.
};

// Define some example.
const example: Plus = {
  // In this case, that may consist of Plus nodes...
  type: "plus",
  children: [
    // ...as well as Constant nodes.
    {
      type: "constant",
      value: 1111,
    },
    {
      type: "constant",
      value: 201,
    }
  ]
};

// Call stringify with the options, then...
// ...call the returned stringifier, which...
stringify(options)(example) // ...returns "1111 + 201".
```


## Did You Say We'd Get Back To Something?

Yes.
I said *"nearly perfect"*, didn't I?
If you missed it, the definitions of `evaluate` and `stringify` have a little note that says we'll get back to something.
See? We're doing that now.

```ts
function evaluate(options: Options): Evaluator<AExp> {
  const allHandlers: Handlers =
    { ...handlers, ...options.handlers };
  return evaluator;
  // where
  function evaluator(aexp: AExp) => number {
    const handler: Handler<Constant> = allHandlers[aexp.type];
    // we'll get back to this ⤴
    return evaluator(handle)(aexp);
  }
}
```

Why does that type annotation say that the type for our *generic handler*, which we obtained by looking up the handler for some *arbitrary* arithmetic expression, is `Handler<Constant>`?
Bit weird, isn't it?
Unfortunately, it's not.
Weird, that is.
That definitely is its type.
TypeScript arrives at this conclusion as follows:

1.  The type of `aexp` is `AExp`.
2.  `AExp` is the union of all types in `AExpMap`.
3.  In the current context, that's just `Constant`.
4.  Hence, `AExp` is `Constant`.
5.  Hence, the type of `handlers[aexp.type]` is `Handler<Constant>`.

TypeScript continues to approve the rest of the definition as follows:

6.  Likewise, the type of `aexp` is `Constant`.
7.  Hence, `aexp` is a valid argument for `handlers[aexp.type]`.

So, our code is valid, according to the type checker.
However, that's a bit unsatisfying.
Personally, I'd prefer it if TypeScript approved my code with the following reasoning:

1.  The type of `aexp` is `AExp`.
2.  Hence, the type of `aexp.type` is some abstract key of `AExpMap`.
    <br />
    Let's call it `CaseName`.
3.  Hence, the type of `aexp` is `AExpMap[CaseName]`.
    <br />
    Let's call it `Case`.
4.  The type `Handlers` maps every key `CaseName` in `keyof AExpMap` to a handler for the corresponding case, i.e., `Handler<AExpMap<CaseName>>`.
5.  Hence, `handlers[aexp.type]` must be a `Handler<Case>`.
6.  Hence, `aexp` is a valid argument for `handlers[aexp.type]`.

However, TypeScript *cannot* follow this line of reasoning.
There's a simple reason and a foundational reason:

- The simple reason is that I haven't told it about the relation between `CaseName` and `type`.
  This means that it can't follow step (5).
  However, this can be remedied.
- The fundamental reason is that TypeScript does not support the kind of abstraction in step (2).
  This cannot be remedied without fundamentally changing TypeScript.

The reasoning that TypeScript uses to approve the definition of `evaluate` stops working if we don't have exactly one builtin type.

If we have *zero* builtin types, then TypeScript reasons as follows:

1.  The type of `aexp` is `AExp`.
2.  However, `AExpMap` is empty.
3.  So `AExp` is the empty union, i.e., `never`.
4.  A value of type `never` doesn't have a `type` attribute.
5.  The programmer must be wrong!

If we have *two or more* builtin types, say `Constant` and `Variable`, then TypeScript reasons as follows:

1.  The type of `aexp` is `AExp`.
2.  `AExp` is the union of all types in AExpMap.
3.  In the current context, that's `Constant` and `Variable`.
4.  Hence, `AExp` is `Constant | Variable`.
5.  Hence, the type of `handlers[aexp.type]` is `Handler<Constant> | Handler<Variable>`.
6.  This means it's a handler function either way, but it either expects a `Constant` or a `Variable` as its second argument.
    Crucially, we don't know which.
    We're not allowed to pick.
7.  What's safe to pass to a function that accepts either a `Constant` or a `Variable`?
    Aha!
    Something that is both a `Constant` *and* a `Variable`.
    It must be passed something of type `Constant & Variable`!
8.  Oh no, there's no way for something to be both a `Constant` and a `Variable`.
    If `aexp` has type `Constant`, then `aexp.type` must be `"constant"`.
    If `aexp` has type `Variable`, then `aexp.type` must be `"variable"`.
    It can't be both!
9.  The programmer must be wrong!

So in these cases, we'll have to define `evaluate` using a type cast:

```ts
function evaluate(options: Options): Evaluator<AExp> {
  const allHandlers: Handlers =
    { ...handlers, ...options.handlers };
  return evaluator;
  // where
  function evaluator(aexp: AExp) => number {
    const handler = allHandlers[aexp.type] as Handler<any>;
    // see that's a type cast right there ⤴
    return evaluator(handle)(aexp);
  }
}
```

## Can We Trick It?

Probably.
It's still TypeScript.

Let's look at our example of using `evaluate` with an extra case for plus.

```ts
import type { Constant } from "aeast";
import type { Plus } from "aeast-util-plus";
import type { Options } from "aeast-util-evaluate";
import { evaluate } from "aeast-util-evaluate";

// We could'be been doing this the whole time.
import options from "aeast-util-evaluate-plus";

// Define some example.
const example: Plus = {
  type: "plus",
  children: [
    {
      type: "constant",
      value: 1111,
    },
    {
      type: "constant",
      value: 201,
    },
  ],
};

evaluate(options)(example)
```

To trick TypeScript, we must find a way to call `evaluate` with an example that contains a plus node, but without the options for plus.

The type checker does not extend the `AExp` type until it evaluates the type declarations from the `"aeast-util-plus"` package.
So, if we can use `evaluate` *before* `AExp` is extended, we're in business.
The business of trickery.

We need *two* packages for this trickery:

- `aeast-trickery-evaluate`: defines `evaluateWithTrickery`.
- `aeast-trickery`: uses `evaluateWithTrickery`.

The package `aeast-trickery-evaluate` defines a function `evaluateWithTrickery` that calls `evaluate` with the empty set of extension handlers.
This package only depends on `@types/aeast` and `aeast-util-evaluate`.
Hence, the empty set is complete.

```ts
// Define the options, which includes...
const options: Options = {
  // ...a complete set of extension handlers.
  handlers: {}, // In this case, that's none.
};

// Define a function that wraps evaluate, and...
export function evaluateWithTrickery(aexp: AExp): number {
  // ...passes it the approved empty set of handlers!
  return evaluate(options)(aexp);
}
```

The package `aeast-trickery` uses this function to evaluate an example *with* plus.
This package depends on `@types/aeast`, `aeast-util-plus`, and `aeast-trickery-evaluate`.
The empty set is no longer complete, but TypeScript has already approved `aeast-trickery-evaluate`!
It's going back on its word!

```ts
import type { Constant } from "aeast";
import type { Plus } from "aeast-util-plus";
import { evaluateWithTrickery} from "aeast-trickery-evaluate";

// Define some example.
const example: Plus = {
  type: "plus",
  children: [
    {
      type: "constant",
      value: 1111,
    },
    {
      type: "constant",
      value: 201,
    },
  ],
};

// Call evaluateWithTrickery with our example, which...
evaluateWithTrickery(example) // ...throws an exception!
```

So, we *can* trick TypeScript!
It isn't safe to export functions that call extensible functions *without* also exposing their options.

However, we need *two* packages.
If we try to put these two definitions in the same package, TypeScript catches on.
If `AExpMap` is extended for one module, it's extended for the whole package.

Well, wasn't this neat?
Thanks for reading.
Bye!

<!--
@VieraS2015 have a wonderful paper that shows how to do this using an incredible amount of metaprogramming in Haskell
-->

[Astro]: https://astro.build
[unifiedjs]: https://unifiedjs.com
[mdast]: https://github.com/syntax-tree/mdast
[hast]: https://github.com/syntax-tree/hast
[esast]: https://github.com/syntax-tree/esast
[unist]: https://github.com/syntax-tree/unist
[unist-util-map]: https://github.com/syntax-tree/unist-util-map
[unist-util-reduce]: https://github.com/syntax-tree/unist-util-reduce
[unist-util-find]: https://github.com/syntax-tree/unist-util-find
[unified]: https://unifiedjs.com/explore/package/unified/
[remark]: https://unifiedjs.com/explore/project/remarkjs/remark/
[rehype]: https://unifiedjs.com/explore/project/rehypejs/rehype/
[The Expression Problem]: https://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt
[Mapped Types]: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
