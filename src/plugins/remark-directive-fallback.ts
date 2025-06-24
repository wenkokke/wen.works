import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";
import { h } from "hastscript";
import { visit, CONTINUE } from "unist-util-visit";

export default function remarkDirectiveFallback(
  this: Processor,
): Transformer<Root, Root> {
  return function (tree: Root) {
    visit(tree, function (node) {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const data = node.data || (node.data = {});
        if (data.hName !== undefined || data.hProperties !== undefined) {
          return CONTINUE;
        }
        const hast = h(node.name, node.attributes || {});
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
    });
  };
}
