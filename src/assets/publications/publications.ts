import type { CSL, NameVariable } from "../../plugins/citations";
import fs from "fs";
import path from "path";
import { URL } from "whatwg-url";
import { formatCitation, loadCsl, parseBibTeX } from "../../plugins/citations";
import { formatBibliography } from "../../plugins/citations";

// Read publications.csl
const cslFile = path.join(
  process.cwd(),
  "src/assets/publications/publications.csl",
);
const cslContent = fs.readFileSync(cslFile, { encoding: "utf-8" });
loadCsl({ id: "publications", data: cslContent });

// Read publications.bib
const bibFile = path.join(
  process.cwd(),
  "src/assets/publications/publications.bib",
);
const bibContent = fs.readFileSync(bibFile, { encoding: "utf-8" });

// Parse publications
const entriesRaw = parseBibTeX(bibContent);

// Transform: Remove author
const myNameVariable = { given: "Wen", family: "Kokke" };
function removeAuthor(author: NameVariable, entry: CSL): CSL {
  entry = structuredClone(entry);
  if (Array.isArray(entry.author)) {
    entry.author = entry.author.filter(
      ({ given, family }) =>
        !(given === author.given && family === author.family),
    );
  }
  return entry;
}

// Transform: Resolve extended versions
function resolveExtendedVersions(entry: CSL): CSL {
  entry = structuredClone(entry);
  if (typeof entry.note === "string") {
    const match = entry.note.match(
      /^Extended version of \\cite(?<id>[^\.]*)\.?$/,
    );
    if (match !== null) {
      delete entry.note;
      entry.custom = entry.custom ?? {};
      entry.custom.extendedVersionOf = match.groups?.id;
    }
  }
  return entry;
}

// Transform: Add citations
function addCitation(entry: CSL, entries: CSL[]): CSL {
  entry = structuredClone(entry);
  entry.custom = entry.custom ?? {};
  entry.custom.citation = formatCitation(entries, String(entry.id));
  return entry;
}

const entries = entriesRaw
  .map((entry) => addCitation(entry, entriesRaw))
  .map((entry) => removeAuthor(myNameVariable, entry))
  .map((entry) => resolveExtendedVersions(entry));

// Order entries by ID
const entriesById = Object.fromEntries(
  entries.map((entry) => [entry.id, entry]),
);

// Render bibliography entries
const bibEntries = formatBibliography(entries, null, {
  template: "publications",
}).map(({ id, html }) => {
  const entry = entriesById[id];
  entry.custom = entry.custom ?? {};
  const { issued, type, URL: url } = entry;
  if (issued !== undefined && issued["date-parts"] !== undefined) {
    const [[year, month]] = issued["date-parts"];
    if (typeof year === "number") {
      if (typeof month === "number") {
        entry.custom.pubDate = new Date(year, month - 1);
      } else {
        entry.custom.pubDate = new Date(year);
      }
    }
  }
  const citation = entry.custom?.citation;
  const host = url === undefined ? undefined : new URL(url).host;
  const extensionId = entriesById[id].custom?.extendedVersionOf as
    | string
    | undefined;
  const extensionEntry =
    extensionId === undefined ? undefined : entriesById[extensionId];
  const extensionCitation = extensionEntry?.custom?.citation;
  const extensionOf =
    extensionId === undefined
      ? undefined
      : { id: extensionId, citation: extensionCitation };
  const pubDate = entry.custom.pubDate as Date | undefined;
  return { citation, extensionOf, host, html, id, pubDate, type, url };
});

export type BibEntry = (typeof bibEntries)[0];

export function byPubDate(bibEntry1: BibEntry, bibEntry2: BibEntry): number {
  const pubDate1 = bibEntry1.pubDate;
  if (pubDate1 !== undefined) {
    const pubDate2 = bibEntry2.pubDate;
    if (pubDate2 !== undefined) {
      return pubDate2.valueOf() - pubDate1.valueOf();
    } else {
      return -1;
    }
  } else {
    const pubDate2 = bibEntry2.pubDate;
    if (pubDate2 !== undefined) {
      return 1;
    } else {
      return 0;
    }
  }
}

export const paperTypes = ["article-journal", "chapter", "paper-conference"];

export const thesisTypes = ["thesis"];

export const bookTypes = ["book"];

export const talkTypes = ["performance", "speech"];


export function byRelevance(bibEntry1: BibEntry, bibEntry2: BibEntry): number {
  // Books are MORE relevant
  if (bookTypes.includes(bibEntry1.type) && !bookTypes.includes(bibEntry2.type)) {
    return -1;
  }
  if (!bookTypes.includes(bibEntry1.type) && bookTypes.includes(bibEntry2.type)) {
    return 1;
  }
  // Talks are LESS relevant
  if (!talkTypes.includes(bibEntry1.type) && talkTypes.includes(bibEntry2.type)) {
    return -1;
  }
  if (talkTypes.includes(bibEntry1.type) && !talkTypes.includes(bibEntry2.type)) {
    return 1;
  }
  return byPubDate(bibEntry1, bibEntry2);
}

export default bibEntries;
