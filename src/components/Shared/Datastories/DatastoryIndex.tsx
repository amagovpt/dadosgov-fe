"use client";

import { Anchor } from "@ama-pt/agora-design-system";
import { Typograph } from "../Generics/Typograph";
import AppIcon from "../../Primitives/AppIcon";
import { twJoin } from "tailwind-merge";

type AnchorType = {
  children: string;
  href: string;
  icon?: string;
};

export interface DatastoryIndexI {
  title: string;
  anchors: AnchorType[];
  darkMode?: boolean;
}

export default function DatastoryIndex({ title, anchors, darkMode = true }: DatastoryIndexI) {
  return (
    <div className="flex flex-col gap-16 border-l-2 border-l-white px-64">
      <Typograph
        tag="h2"
        className={twJoin("text-l-bold", darkMode ? "text-white" : "text-neutral-900")}
      >
        {title}
      </Typograph>
      <ul className="flex w-full flex-col gap-8">
        {anchors.map((anchor, index) => {
          return (
            <li key={`anchor-${index}`}>
              <Anchor
                darkMode={darkMode}
                fullWidth
                href={anchor.href}
                appearance={"link"}
                variant={"neutral"}
                className="[&>*]:w-full"
              >
                <div className="flex w-full flex-row gap-8">
                  <span className="flex-1 text-m-regular">{anchor.children}</span>
                  <AppIcon
                    name={anchor?.icon ?? "agora-line-arrow-right-circle"}
                    className="h-24 w-24 self-center"
                  />
                </div>
              </Anchor>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
