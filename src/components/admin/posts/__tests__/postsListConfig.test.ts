/**
 * LEDG-2294: the posts table rendered a type column (Notícia / Página) with no
 * way to sort it, while every other column in the same config was sortable.
 * `kind` has exactly two values, so the comparator groups them the way the
 * existing type filter does.
 */

import { describe, expect, it } from "vitest";
import { sortPosts } from "../config/postsListConfig";
import type { Post } from "@/service/types/posts";

function makePost(partial: Partial<Post> = {}): Post {
  return {
    id: "p-1",
    name: "Notícia inicial",
    slug: "noticia-inicial",
    kind: "post",
    published: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    last_modified: "2026-01-01T00:00:00Z",
    ...partial,
  } as Post;
}

const news = makePost({ id: "p-1", kind: "post" });
const page = makePost({ id: "p-2", kind: "page" });
const otherNews = makePost({ id: "p-3", kind: "post" });

const posts = [page, news, otherNews];
const ids = (list: Post[]) => list.map((post) => post.id);

describe("sortPosts by type", () => {
  it("groups news before pages ascending, and the reverse descending", () => {
    expect(ids(sortPosts(posts, "type", "ascending"))).toEqual(["p-1", "p-3", "p-2"]);
    expect(ids(sortPosts(posts, "type", "descending"))).toEqual(["p-2", "p-1", "p-3"]);
  });

  it("leaves the order untouched with no field or no direction", () => {
    expect(ids(sortPosts(posts, null, "ascending"))).toEqual(ids(posts));
    expect(ids(sortPosts(posts, "type", "none"))).toEqual(ids(posts));
  });

  it("does not mutate the array it was given", () => {
    const original = [...posts];
    sortPosts(posts, "type", "descending");
    expect(posts).toEqual(original);
  });
});
