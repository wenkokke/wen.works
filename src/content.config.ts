import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";

/******************************************************************************/
// Blog Posts
/******************************************************************************/

const oldest = new Date("2016-01-01");
const newest = new Date();

const posts = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./src/posts",
    generateId: ({ entry }) => entry.toLowerCase().replace(/(\.[a-z]+)+$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    pubDate: z.union([z.date().min(oldest).max(newest), z.literal("draft")]),
    tags: z.optional(z.array(z.string())),
  }),
});

export const collections = { posts };
