import type { InferEntrySchema, RenderedContent } from "astro:content";

export const pageTitle: string = "wen.works";

export type PostData = InferEntrySchema<"posts">;

export interface Post {
  id: string;
  body?: string;
  collection: "posts";
  data: PostData;
  rendered?: RenderedContent;
  filePath?: string;
}

export function yyyy(post: Post): string {
  return String(post.data.pubDate.getFullYear()).padStart(4, "0");
}

export function mm(post: Post): string {
  return String(post.data.pubDate.getMonth() + 1).padStart(2, "0");
}

export function dd(post: Post): string {
  return String(post.data.pubDate.getDate()).padStart(2, "0");
}

export function slug(post: Post): string {
  return `${yyyy(post)}/${mm(post)}/${dd(post)}/${post.id}`;
}
