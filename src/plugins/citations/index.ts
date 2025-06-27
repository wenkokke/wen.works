import type { CSL } from "./types/csl-data";

// Import Citation.js and the bibTeX and CSL plugins
// @ts-ignore
const { Cite, plugins } = await import("@citation-js/core");
// @ts-ignore
await import("@citation-js/plugin-bibtex");
// @ts-ignore
await import("@citation-js/plugin-csl");

// Configure Citation.js to use publications.csl template
export function loadCsl(csl: { id: string; data: string }): void {
  plugins.config.get("@csl").templates.add(csl.id, csl.data);
}

// Export type of CSL
export type { CSL, NameVariable } from "./types/csl-data";

export interface CiteOptions {
  template?: string;
  lang?: "en-US" | "es-ES" | "de-DE" | "fr-FR" | "nl-NL";
}

export interface BibOptions {
  template?: string;
  lang?: "en-US" | "es-ES" | "de-DE" | "fr-FR" | "nl-NL";
  prepend?: (entry: CSL) => string;
  append?: string;
}

// Define type of bibliography entries:
export type BibEntry = { id: string; html: string };

export function parseBibTeX(content: string): CSL[] {
  const cite = new Cite(content);
  const data = cite.format("data", {
    format: "object",
  });
  return data;
}

export function formatCitation(
  entries: CSL[],
  include?: string | CSL | (string | CSL)[] | ((entry: CSL) => boolean) | null,
  options?: CiteOptions,
): string {
  const cite = new Cite(entries);
  const entry =
    typeof include === "string"
      ? include
      : Array.isArray(include)
        ? include.map((entry: string | CSL): string | number => (typeof entry === "string" ? entry : entry.id))
        : typeof include === "object" && include !== null
          ? include.id
          : entries.filter(include ?? (() => true)).map(({id}) => id);
  return cite.format("citation", { entry, ...(options ?? {}) });
}

export function formatBibliography(
  entries: CSL[],
  include?: ((entry: CSL) => boolean) | null,
  options?: BibOptions,
): BibEntry[] {
  const cite = new Cite(entries.filter(include ?? (() => true)));
  return (
    cite
      .format("bibliography", {
        format: "html",
        asEntryArray: true,
        ...(options ?? {}),
      })
      // @ts-ignore
      .map(([id, html]) => ({ id, html }))
  );
}
