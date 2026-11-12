import { describe, expect, it } from "vitest";
import { toVideoEmbedUrl } from "../videoEmbed";

const YT = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

describe("toVideoEmbedUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "  https://youtu.be/dQw4w9WgXcQ  ",
  ])("embeds the YouTube URL %s through youtube-nocookie", (url) => {
    expect(toVideoEmbedUrl(url)).toBe(YT);
  });

  it.each([
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://player.vimeo.com/video/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://vimeo.com/channels/staffpicks/76979871", "https://player.vimeo.com/video/76979871"],
  ])("embeds the Vimeo URL %s", (url, expected) => {
    expect(toVideoEmbedUrl(url)).toBe(expected);
  });

  it.each([
    "",
    null,
    undefined,
    "not a url",
    "javascript:alert(1)",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ%22onload",
    "https://evilyoutube.com/watch?v=dQw4w9WgXcQ",
    "https://vimeo.com/about",
  ])("does not embed %s", (url) => {
    expect(toVideoEmbedUrl(url)).toBeNull();
  });
});
