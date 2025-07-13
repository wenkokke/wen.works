import { render } from "astro:content";
import type { InferEntrySchema, RenderedContent } from "astro:content";
import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { toText } from "hast-util-to-text";
import { selectAll } from "hast-util-select";

export const pageTitle: string = "wen.works";
export const pageAuthor: string = "Wen Kokke";
export const base = import.meta.env.BASE_URL;

export type PostData = InferEntrySchema<"posts">;

export interface Post {
  id: string;
  body?: string;
  collection: "posts";
  data: PostData;
  rendered?: RenderedContent;
  filePath?: string;
}

export function pubDate(post: Post): Date {
  return post.data.pubDate === "draft" ? new Date() : post.data.pubDate;
}

export function shouldPublish(post: Post): boolean {
  return import.meta.env.DEV || post.data.pubDate !== "draft";
}

export function byPubDate(post1: Post, post2: Post): number {
  return pubDate(post2).valueOf() - pubDate(post1).valueOf();
}

export function yyyy(post: Post): string {
  return String(pubDate(post).getFullYear()).padStart(4, "0");
}

export function mm(post: Post): string {
  return String(pubDate(post).getMonth() + 1).padStart(2, "0");
}

export function dd(post: Post): string {
  return String(pubDate(post).getDate()).padStart(2, "0");
}

export function slug(post: Post): string {
  return `${base}${yyyy(post)}/${mm(post)}/${dd(post)}/${post.id}`;
}

export type TeaserFormat = "html" | "text";

export async function teaser(
  post: Post,
  format?: TeaserFormat,
): Promise<string | undefined> {
  if (post.rendered === undefined) {
    const _result = await render(post);
  }
  if (post.rendered !== undefined) {
    const hast = fromHtml(post.rendered.html);
    const teasers = selectAll(".teaser", hast);
    if (format === "html" || format === undefined) {
      return toHtml(teasers);
    }
    if (format === "text") {
      return teasers.map((node) => toText(node)).join("\n");
    }
  }
}
