import type {
  Image,
  Link,
  Data,
  FootnoteDefinition,
  Node,
  Paragraph,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
} from "mdast";
import type { ContainerDirective, LeafDirective } from "mdast-util-directive";
import type { Processor, Transformer } from "unified";
import type { BracketedSpan } from "mdast-util-bracketed-spans";
import type { VFile } from "vfile";
import assert from "assert";
import { visit, SKIP } from "unist-util-visit";
import { CONTINUE } from "unist-util-visit-parents";
import { is } from "unist-util-is";
import { phrasing } from "mdast-util-phrasing";
import { h } from "hastscript";
import path from "path";
import { pathToFileURL } from "url";

/******************************************************************************/
/* remarkTufte                                                                */
/******************************************************************************/

export interface TufteOptions {
  sectionize?: TufteSectionOptions;
}

export interface TufteSectionOptions {
  /** Use a heading of at least this level to start a new section. */
  heading?: number;
  /** Use `[xxx]{.newthought` to start a new section. */
  newthought?: boolean;
}

function sectionizeHeading(options?: TufteOptions): number {
  return options?.sectionize?.heading ?? 2;
}

function sectionizeNewthought(options?: TufteOptions): boolean {
  return !!options?.sectionize?.heading;
}

export default function remarkTufte(
  this: Processor,
  options?: TufteOptions,
): Transformer<Root, Root> {
  return (tree: Root, file: VFile) => {
    sectionize(tree, options);
    handleEpigraph(tree);
    handleFigures(tree, file);
    handleNotes(tree, file);
    handleFullwidth(tree);
  };
}

/******************************************************************************/
/* remarkTufte - Sections                                                     */
/******************************************************************************/

/**
 * Syntax node for sections.
 */
export interface SectionNode extends Parent {
  type: "section";
  data: Data;
}

/**
 * Divide the document into sections.
 */
function sectionize(tree: Root, options?: TufteOptions): void {
  /** Check whether a node starts a section. */
  const isSectionStart = (node: Node): boolean =>
    (sectionizeNewthought(options) && hasNewthought(node)) ||
    is(node, { type: "heading", depth: sectionizeHeading(options) });
  /** Check whether a node is a `[xxx]{.newthought}` span. */
  function isNewthought(node: Node): boolean {
    if (node.type === "bracketedSpan") {
      const span = node as BracketedSpan;
      if (Array.isArray(span.properties?.className)) {
        return span.properties.className.includes("newthought");
      }
    }
    return false;
  }
  /** Check whether a node starts with a `[xxx]{.newthought}` span. */
  function hasNewthought(node: Node): boolean {
    if (isNewthought(node)) {
      return true;
    }
    const children = (node as Parent).children ?? [];
    if (Array.isArray(children) && children.length > 0) {
      return hasNewthought(children[0]);
    }
    return false;
  }
  // The contents of the whole document.
  const children: SectionNode[] = [];
  // The contents of the current section, if any.
  let section: RootContent[] | undefined;
  /** Enter a new section. */
  const enter = (): void => {
    if (section !== undefined && section.length > 0) leave();
    if (section === undefined) section = [];
  };
  /** Leave the current section. */
  const leave = (): void => {
    if (section !== undefined && section.length > 0) {
      children.push({
        type: "section",
        children: section,
        data: { hName: "section" },
      });
      section = [];
    }
  };
  // Divide the document into sections.
  enter();
  tree.children.forEach((node) => {
    if (isSectionStart(node)) {
      enter();
    }
    assert(Array.isArray(section), "expected `array`");
    section.push(node);
  });
  leave();
  // Overwrite the root children.
  tree.children = children;
}

/******************************************************************************/
/* remarkTufte - Marginal Notes                                               */
/******************************************************************************/

/** Syntax node for margin note. */
export interface MarginNoteNode extends Parent {
  type: "marginnote";
  identifier: string;
  label?: string;
  children: PhrasingContent[];
}

/** Syntax node for side note. */
export interface SideNoteNode extends Parent {
  type: "sidenote";
  identifier: string;
  children: PhrasingContent[];
}

/**
 * Handle sidenotes and marginnotes.
 */
function handleNotes(tree: Root, file: VFile): void {
  const flattenToPhrasing = (node: Node): PhrasingContent[] => {
    if (phrasing(node)) return [node];
    switch (node.type) {
      case "footnoteDefinition": {
        return (node as FootnoteDefinition).children.flatMap(flattenToPhrasing);
      }
      case "paragraph": {
        return (node as Paragraph).children.flatMap(flattenToPhrasing);
      }
      default: {
        file.fail(
          `unexpected ${node.type} node in footnote definition`,
          node.position,
        );
      }
    }
  };
  const definitions: Partial<Record<string, FootnoteDefinition>> = {};
  visit(tree, "footnoteDefinition", (definition) => {
    definitions[definition.identifier] = definition;
  });
  visit(tree, "footnoteReference", (reference, index, parent) => {
    assert(index !== undefined, "expected `index`");
    assert(parent !== undefined, "expected `parent`");
    const { identifier } = reference;
    const definition = definitions[identifier];
    if (definition === undefined) {
      file.fail(`unknown footnote ${identifier}`, reference.position);
    }
    const note: MarginNoteNode | SideNoteNode = {
      type: identifier.match(/^mn-/) ? "marginnote" : "sidenote",
      identifier,
      children: flattenToPhrasing(definition),
    };
    parent.children.splice(index, 1, note);
  });
  visit(tree, "bracketedSpan", (span, index, parent) => {
    assert(index !== undefined, "expected `index`");
    assert(parent !== undefined, "expected `parent`");
    const className = span.properties.className ?? [];
    assert(Array.isArray(className), "expected array `className`");
    if (className.includes("margin")) {
      const note: MarginNoteNode = {
        type: "marginnote",
        identifier: String(span.properties.identifier),
        label:
          typeof span.properties.label === "string"
            ? span.properties.label
            : undefined,
        children: span.children,
      };
      parent.children.splice(index, 1, note);
    }
  });
}

/******************************************************************************/
/* remarkTufte - Epigraphs                                                    */
/******************************************************************************/

/**
 * Handle the `:::epigraph` directive and its `[xxx]{.cite}` and `[xxx]{.footer}` subdirectives.
 */
function handleEpigraph(tree: Root): void {
  visit(tree, { type: "containerDirective", name: "epigraph" }, (epigraph) => {
    // Ensure the directive is translated as a <div> with the epigraph class.
    {
      const hast = h("div", { class: "epigraph" });
      const data = epigraph.data || (epigraph.data = {});
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
    }
    // Ensure the `[xxx]{.cite}` and `[xxx]{.footer}` subdirectives are translated appropriately.
    visit(epigraph, "bracketedSpan", (span: BracketedSpan) => {
      const className = span.properties?.className;
      if (Array.isArray(className)) {
        if (className.includes("cite")) {
          const hast = h("cite");
          const data = span.data || (span.data = {});
          data.hName = hast.tagName;
          return SKIP;
        }
        if (className.includes("footer")) {
          const hast = h("footer");
          const data = span.data || (span.data = {});
          data.hName = hast.tagName;
          return SKIP;
        }
      }
      return SKIP;
    });
  });
}

/******************************************************************************/
/* remarkTufte - Figures                                                      */
/******************************************************************************/

/**
 * Handle figures.
 */
function handleFigures(tree: Root, file: VFile): void {
  // Initialise the label collision map
  const labelCollisionMap: Partial<Record<string, number>> = {};
  /** Resolve image label collisions by adding indexes. */
  const resolveFigureLabelCollision = (label: string): string => {
    if (labelCollisionMap[label] !== undefined) {
      const index = labelCollisionMap[label];
      labelCollisionMap[label] += 1;
      return label + "-" + index.toString();
    } else {
      labelCollisionMap[label] = 1;
      return label;
    }
  };
  /** Compute a label from a file path or URL. */
  const pathOrURLLabel = (pathOrURL: string): string => {
    let url = URL.parse(pathOrURL) ?? URL.parse(pathToFileURL(pathOrURL));
    return resolveFigureLabelCollision(path.parse(url!.pathname).name);
  };
  /** Compute a label from a figure node. */
  const figureLabel = (input: Parent | Image | string): string => {
    if (typeof input === "string") {
      return pathOrURLLabel(input);
    }
    if (is(input, "image")) {
      return pathOrURLLabel(input.url);
    }
    if (typeof input === "object" && "children" in input) {
      let url = null;
      visit(input, ["image", "link"], (node) => {
        url = (node as Image | Link).url;
      });
      return pathOrURLLabel(url!);
    }
    file.fail(`could not compute label from ${input}`);
  };
  // Handle margin figures:
  //
  // [![alt](url "caption")]{.margin}
  //
  visit(tree, "bracketedSpan", (span, index, parent) => {
    assert(index !== undefined, "expected `index`");
    assert(parent !== undefined, "expected `parent`");
    const className = span.properties?.className ?? [];
    assert(Array.isArray(className), "expected array `className`");
    if (!className.includes("margin")) return CONTINUE;
    if (!span.children.find((node) => node.type === "image")) return CONTINUE;
    const marginfigure: MarginNoteNode = {
      type: "marginnote",
      identifier: figureLabel(span),
      children: span.children,
    };
    parent.children.splice(index, 1, marginfigure);
    visit(span, "image", (image, index, parent) => {
      assert(index !== undefined, "expected `index`");
      assert(parent !== undefined, "expected `parent`");
      if (image.title !== undefined && image.title !== null) {
        const title: RootContent = { type: "text", value: image.title };
        parent.children.splice(index, 1, image, title);
      }
    });
  });
  // Handle main text figures:
  //
  // ![alt](url "caption")
  //
  visit(tree, ["marginnote", "image"], (node, index, parent) => {
    if (is(node, "marginnote")) return SKIP;
    assert(index !== undefined, "expected `index`");
    assert(parent !== undefined, "expected `parent`");
    if (!["paragraph", "root"].includes(parent.type)) return SKIP;
    const image: Image = node as Image;
    let title: MarginNoteNode | undefined;
    if (image.title !== undefined && image.title !== null) {
      title = {
        type: "marginnote",
        identifier: figureLabel(image),
        children: [{ type: "text", value: image.title }],
      };
    }
    if (parent.type === "paragraph" && parent.children.length === 1) {
      const data = parent.data || (parent.data = {});
      data.hName = "figure";
      if (title) parent.children.push(title);
    } else {
      const children: PhrasingContent[] = [image];
      if (title) children.push(title);
      parent.children.splice(index, 1, {
        type: "paragraph",
        data: { hName: "figure" },
        children,
      });
    }
  });
  // Handle iframe figures:
  //
  // :::iframe{src=url}
  // caption
  // :::
  //
  visit(
    tree,
    { type: "containerDirective", name: "iframe" },
    (node, index, parent) => {
      assert(index !== undefined, "expected `index`");
      assert(parent !== undefined, "expected `parent`");
      const directive = node as ContainerDirective;
      const attributes = node.attributes;
      assert(
        attributes !== undefined && attributes !== null,
        "expected `attributes`",
      );
      assert(
        attributes.src !== undefined && attributes.src !== null,
        "expected `src`",
      );
      {
        const hast = h("figure", { class: "iframe-wrapper" });
        const data = directive.data || (directive.data = {});
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
      {
        const hast = h("iframe", {
          width: attributes.width,
          height: attributes.height,
          src: attributes.src,
          frameborder: attributes.frameborder ?? "0",
          allowfullscreen: !!attributes.allowfullscreen,
        });
        const leaf: LeafDirective = {
          type: "leafDirective",
          name: "iframe",
          data: {
            hName: hast.tagName,
            hProperties: hast.properties,
          },
          children: [],
        };
        directive.children.push(leaf);
      }
    },
  );
}

/******************************************************************************/
/* remarkTufte - Fullwidth Elements                                           */
/******************************************************************************/

/**
 * Handle the `:::fullwidth` directive.
 */
function handleFullwidth(tree: Root): void {
  visit(
    tree,
    { type: "containerDirective", name: "fullwidth" },
    (directive, index, parent) => {
      assert(index !== undefined, "expected `index`");
      assert(parent !== undefined, "expected `parent`");
      // Render the fullwidth directive as <div class="fullwidth">
      const hast = h("div", { class: "fullwidth" });
      const data = directive.data || (directive.data = {});
      data.hName = hast.tagName;
      data.hProperties = hast.properties;
    },
  );
}

/******************************************************************************/
/* Export syntax nodes                                                        */
/******************************************************************************/

// Add text citation node to mdast syntax tree:
declare module "mdast" {
  interface PhrasingContentMap {
    sectionNode: SectionNode;
    marginNoteNode: MarginNoteNode;
    sideNoteNode: SideNoteNode;
  }
  interface RootContentMap {
    sectionNode: SectionNode;
    marginNoteNode: MarginNoteNode;
    sideNoteNode: SideNoteNode;
  }
}
