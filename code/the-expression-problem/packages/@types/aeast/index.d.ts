import type {
  Data as UnistData,
  Literal as UnistLiteral,
  Node as UnistNode,
  Parent as UnistParent,
} from "unist";

export interface Data extends UnistData {}
export interface Literal extends UnistLiteral {}
export interface Node extends UnistNode {}
export interface Parent extends UnistParent {}

export type AExp = AExpMap[keyof AExpMap];

interface AExpMap {
  constant: Constant;
}

export interface Constant extends Literal {
  type: "constant";
  value: number;
}

export type Builtin = "constant";
