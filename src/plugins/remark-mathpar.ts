import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";
import { h } from "hastscript";
import { visit, SKIP } from "unist-util-visit";

export default function remarkMathpar(
  this: Processor,
): Transformer<Root, Root> {
  return function (tree, _file) {
    visit(tree, { type: "containerDirective", name: "mathpar" }, (node) => {
      const data = node.data || (node.data = {});
      const hast = h("figure", { class: "mathpar" });
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
      return SKIP;
    });
  };
}
