import type { Processor, Transformer } from "unified";
import type { Root } from "mdast";
import assert from "assert";
import { h } from "hastscript";
import { visit, SKIP } from "unist-util-visit";
import type { BracketedSpan } from "mdast-util-bracketed-spans";

export default function remarkDirectiveFallback(
  this: Processor,
): Transformer<Root, Root> {
  return function (tree, _file) {
    visit(tree, { type: "containerDirective", name: "cube-pets" }, (node) => {
      assert(Array.isArray(node.children), "expected `node.children`");
      assert(node.children.length === 1, "expected `node.children`");
      assert(
        node.children.length === 1,
        "expected `node.children.length` to be 1",
      );
      assert(
        node.children[0].type === "paragraph",
        'expected `node.children[0].type` to be "paragraph"',
      );
      const data = node.data || (node.data = {});
      const hast = h("figure", { class: "cube-pets" });
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
      const images: BracketedSpan[] = [];
      visit(node, "image", (image) => {
        const [url, classes] = image.url.split("#", 2);
        image.url = url;
        images.push({
          type: "bracketedSpan",
          properties: classes ? { className: classes.split(",") } : {},
          children: [image],
        });
      });
      node.children = images;
      return SKIP;
    });
  };
}
