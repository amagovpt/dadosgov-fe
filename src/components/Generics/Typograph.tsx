import React, { JSX } from "react";

type TruncateOptions = {
  enabled?: boolean;
  length: number;
};

type TypographProps<T extends keyof JSX.IntrinsicElements> = {
  tag: T;
  truncate?: TruncateOptions;
} & React.ComponentPropsWithoutRef<T>;

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export const Typograph = <T extends keyof JSX.IntrinsicElements>(
  props: TypographProps<T>
): React.ReactElement => {
  const {
    tag,
    truncate,
    ...restProps
  } = props;

  // Extract children and dangerouslySetInnerHTML safely
  const { 
    children, 
    dangerouslySetInnerHTML,
    ...propsWithoutTag 
  } = restProps as React.ComponentPropsWithoutRef<T> & {
    children?: React.ReactNode;
    dangerouslySetInnerHTML?: { __html: string };
  };

  let content = children;
  if (truncate?.enabled && typeof children === "string") {
    content = truncateText(children, truncate.length);
  }

  const elementProps = propsWithoutTag as Record<string, unknown>;

  if (dangerouslySetInnerHTML) {
    return React.createElement(
      tag, 
      {
        ...elementProps,
        dangerouslySetInnerHTML,
      }
    );
  }

  return React.createElement(
    tag,
    elementProps,
    content
  );
};