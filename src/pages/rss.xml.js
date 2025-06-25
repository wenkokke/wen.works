import { getCollection } from "astro:content";
import { pageAuthor, pageTitle, slug, teaser } from "../site";
import rfc822Date from "rfc822-date";
import xmlFormat from "xml-formatter";

export async function GET(context) {
  const lastBuildDate = new Date();
  const posts = await getCollection("posts");
  const teasers = {};
  for (const post of posts) {
    teasers[post.id] = await teaser(post, "text");
  }
  const base = context.base ? `${context.base}/` : "";
  const site = `${context.site}${base}`;
  return new Response(xmlFormat(`
    <?xml version="1.0" encoding="utf-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <channel>
        <title>${pageTitle}</title>
        <link>${site}</link>
        <description>
          <![CDATA[Personal website of ${pageAuthor}]]>
        </description>
        <atom:link href="${site}" rel="self" type="application/rss+xml" />
        <lastBuildDate>${rfc822Date(lastBuildDate)}</lastBuildDate>
        ${
          posts.map((post) => {
            const link = `${site}${slug(post)}`;
            const pubDate = post.data.pubDate ? rfc822Date(post.data.pubDate) : "";
            return (`
              <item>
                <title>${post.data.title}</title>
                <link>${link}</link>
                <description>
                  <![CDATA[
                  ${teasers[post.id] ?? ""}
                  ]]>
                </description>
                <pubDate>${pubDate}</pubDate>
                <guid>${link}</guid>
                <dc:creator>${post.data.author}</dc:creator>
              </item>
            `);
          }).join("\n")
        }
      </channel>
    </rss>
  `));
}
