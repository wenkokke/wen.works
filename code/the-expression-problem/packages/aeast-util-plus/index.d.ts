import type { Parent, AExp } from "aeast";

export interface Plus extends Parent {
  type: "plus";
  children: [AExp, AExp];
}

declare module "aeast" {
  interface AExpMap {
    plus: Plus;
  }
}
