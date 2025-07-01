import type { Processor, Transformer } from "unified";
import type { Data, Root } from "mdast";
import type { Properties } from "hast";
import assert from "assert";
import { h } from "hastscript";
import { visit, SKIP } from "unist-util-visit";

export default function remarkTeaser(this: Processor): Transformer<Root, Root> {
  return function (tree: Root) {
    visit(
      tree,
      { type: "containerDirective", name: "teaser" },
      (teaser, index, parent) => {
        assert(index !== undefined, "expected `index`");
        assert(parent !== undefined, "expected `parent`");
        if (Array.isArray(teaser.children) && teaser.children.length > 0) {
          for (const child of teaser.children) {
            const data: Data = child.data || (child.data = {});
            const hast = h("p", teaser.attributes as Properties);
            const className =
              hast.properties.className || (hast.properties.className = []);
            assert(Array.isArray(className), "expected array `className`");
            className.push("teaser");
            data.hProperties = hast.properties;
          }
          parent.children.splice(index, 1, ...teaser.children);
        }
        return SKIP;
      },
    );
  };
}
