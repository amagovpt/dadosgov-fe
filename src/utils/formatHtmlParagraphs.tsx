import { Typograph } from "@/components/Shared/Generics/Typograph";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import React from "react";
import { twMerge } from "tailwind-merge";

export function formatHtmlParagraphs(
  html: string | undefined,
  className?: string
) {
  if (!html) return [];

  const paragraphStyle = twMerge("text-m-regular w-full", className);
  const $ = cheerio.load(`<div>${html}</div>`);
  const elements: React.ReactNode[] = [];

  $("div")
    .contents()
    .each((i, el) => {
      if (el.type === "text") {
        const text = $(el).text();
        if (text.trim() !== "") elements.push(text);
      } else if (el.type === "tag") {
        // handle paragraphs
        if (el.tagName === "p") {
          const processNode = (
            child: AnyNode,
            key: string
          ): React.ReactNode | null => {
            if (child.type === "text") return $(child).text();
            if (child.type !== "tag") return null;
            const tag = child.tagName;
            if (tag === "br") return <br key={key} />;
            if (tag === "a") {
              const href = $(child).attr("href") || "#";
              const linkText = $(child).text();
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {linkText}
                </a>
              );
            }
            if (tag === "u")
              return (
                <u key={key} className="underline">
                  {$(child).text()}
                </u>
              );
            if (tag === "strong")
              return (
                <strong key={key} className="font-bold">
                  {$(child).text()}
                </strong>
              );
            if (tag === "b")
              return (
                <b key={key} className="font-bold">
                  {$(child).text()}
                </b>
              );
            return null;
          };

          const childNodes = $(el).contents().toArray();

          // Split on 3+ consecutive <br> into separate paragraphs
          const segments: AnyNode[][] = [[]];
          let pendingBrs: AnyNode[] = [];

          for (const child of childNodes) {
            const tagName = child.type === "tag" ? child.tagName : null;
            if (tagName === "br") {
              pendingBrs.push(child);
            } else {
              if (pendingBrs.length >= 3) {
                segments.push([]);
              } else {
                segments[segments.length - 1].push(...pendingBrs);
              }
              pendingBrs = [];
              segments[segments.length - 1].push(child);
            }
          }
          if (pendingBrs.length > 0 && pendingBrs.length < 3) {
            segments[segments.length - 1].push(...pendingBrs);
          }

          segments.forEach((segment, segIdx) => {
            const children: React.ReactNode[] = segment
              .map((child, childIdx) =>
                processNode(child, `node-${i}-${segIdx}-${childIdx}`)
              )
              .filter((n): n is React.ReactNode => n !== null);

            const hasContent = children.some(
              (c) => typeof c !== "string" || c.trim() !== ""
            );
            if (hasContent) {
              elements.push(
                <Typograph
                  tag="p"
                  key={`p-${i}-${segIdx}`}
                  className={paragraphStyle}
                >
                  {children}
                </Typograph>
              );
            }
          });
        } else if (el.tagName === "ol") {
          // handle ordered lists
          const listItems: React.ReactNode[] = [];
          $(el)
            .find("li")
            .each((liIndex, li) => {
              listItems.push(
                <li key={`li-${i}-${liIndex}`}>{$(li).text().trim()}</li>
              );
            });
          elements.push(
            <ol
              key={`ol-${i}`}
              className="list-decimal space-y-2"
              style={{ paddingLeft: "16px" }}
            >
              {listItems}
            </ol>
          );
        } else if (el.tagName === "ul") {
          // handle unordered lists
          const listItems: React.ReactNode[] = [];
          $(el)
            .find("li")
            .each((liIndex, li) => {
              listItems.push(
                <li key={`li-${i}-${liIndex}`}>{$(li).text().trim()}</li>
              );
            });
          elements.push(
            <ul
              key={`ol-${i}`}
              className="list-disc space-y-2"
              style={{ paddingLeft: "16px" }}
            >
              {listItems}
            </ul>
          );
        } else if (el.tagName === "b") {
          // handle bold
          const boldText = $(el).text();
          elements.push(
            <b key={`b-${boldText}-${i}`} className="font-bold">
              {boldText}
            </b>
          );
        }
      }
    });

  // if elements is empty -> return the text inside a paragraph
  if (elements.length === 0) {
    return [
      <Typograph tag="p" key="single-paragraph" className={paragraphStyle}>
        {html}
      </Typograph>,
    ];
  }

  return elements;
}
