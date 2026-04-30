import { Typograph } from "@/components/Typograph";
import * as cheerio from "cheerio";
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
        elements.push($(el).text());
      } else if (el.type === "tag") {
        // handle paragraphs
        if (el.tagName === "p") {
          const children: React.ReactNode[] = [];
          $(el)
            .contents()
            .each((_, child) => {
              if (child.type === "text") {
                children.push($(child).text());
              } else if (child.type === "tag") {
                // handle line breaks
                if (child.tagName === "br") {
                  children.push(<br key={`br-${i}-${children.length}`} />);
                } else if (child.tagName === "a") {
                  const href = $(child).attr("href") || "#";
                  const linkText = $(child).text();
                  children.push(
                    <a
                      key={`a-${href}-${linkText}-${i}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {linkText}
                    </a>
                  );
                } else if (child.tagName === "u") {
                  const underlinedText = $(child).text();
                  children.push(
                    <u key={`u-${underlinedText}-${i}`} className="underline">
                      {underlinedText}
                    </u>
                  );
                } else if (child.tagName === "strong") {
                  const strongText = $(child).text();
                  children.push(
                    <strong
                      key={`strong-${strongText}-${i}`}
                      className="font-bold"
                    >
                      {strongText}
                    </strong>
                  );
                } else if (child.tagName === "b") {
                  const boldText = $(child).text();
                  children.push(
                    <b key={`b-${boldText}-${i}`} className="font-bold">
                      {boldText}
                    </b>
                  );
                }
              }
            });
          elements.push(
            <Typograph tag="p" key={`p-${i}`} className={paragraphStyle}>
              {children}
            </Typograph>
          );
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
