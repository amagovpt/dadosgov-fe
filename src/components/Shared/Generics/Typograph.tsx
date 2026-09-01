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

  // Whatever is passed here bypasses React's escaping, so the caller owns the
  // sanitising. Two things in particular must not reach it unsanitised:
  // content from the backend, and the output of `t()` — i18next's own escaping
  // of interpolated values is deliberately off (see src/app/i18n.ts), on the
  // grounds that React escapes text children, which this path does not.
  // No call site uses this prop today, and a test in
  // src/app/__tests__/i18n.test.tsx fails if a raw-HTML sink appears elsewhere.
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