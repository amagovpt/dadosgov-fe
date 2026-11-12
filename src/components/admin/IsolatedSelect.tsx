"use client";

import React, { type ReactElement } from "react";
import {
  InputSelect,
  type DropdownSectionProps,
  type DropdownOptionProps,
} from "@ama-pt/agora-design-system";
import styles from "./IsolatedSelect.module.css";

export interface SelectOptionAvatar {
  src: string | null;
  type: "user" | "organization";
}

function avatarFallbackIcon(avatar: SelectOptionAvatar): string {
  return avatar.type === "organization" ? "agora-line-buildings" : "agora-line-user";
}

function avatarStyle(avatar: SelectOptionAvatar): React.CSSProperties {
  const isOrganization = avatar.type === "organization";
  return {
    "--select-avatar-image": `url(${JSON.stringify(avatar.src)})`,
    "--select-avatar-radius": isOrganization ? "4px" : "50%",
    "--select-avatar-fit": isOrganization ? "contain" : "cover",
  } as React.CSSProperties;
}

/**
 * Isolated InputSelect wrapper to prevent re-render cascades.
 *
 * The Agora Design System InputSelect calls setState during the render cycle
 * of other components (React 19 incompatibility), causing sibling selects to
 * lose their selection when any form field triggers a re-render.
 *
 * This component wraps InputSelect in React.memo so it only re-renders when
 * its own props change. Values are stored via a MutableRefObject to avoid
 * triggering parent re-renders on selection.
 *
 * The children are cloned to inject `selected={true}` on the matching option
 * so that InputSelect's internal useEffect([children]) re-reads the correct
 * selection state even when the children reference changes.
 */

interface IsolatedSelectProps {
  label: string;
  placeholder: string;
  id: string;
  onChangeRef?: React.RefObject<string>;
  defaultValue?: string;
  type?: "checkbox" | "text";
  hasError?: boolean;
  errorFeedbackText?: string;
  helperText?: string;
  hideLabel?: boolean;
  hideSectionNames?: boolean;
  searchable?: boolean;
  required?: boolean;
  searchInputPlaceholder?: string;
  searchNoResultsText?: string;
  onChangeCallback?: (value: string) => void;
  onSearchCallback?: (query: string) => void;
  optionAvatars?: Record<string, SelectOptionAvatar>;
  children: ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[];
}

function injectSelected(
  children: ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[],
  selectedValues: string[],
  optionAvatars?: Record<string, SelectOptionAvatar>
): ReactElement<DropdownSectionProps> | ReactElement<DropdownSectionProps>[] {
  return React.Children.map(children, (section) => {
    if (!React.isValidElement(section)) return section;
    const sectionEl = section as ReactElement<DropdownSectionProps>;
    const modifiedOptions = React.Children.map(
      sectionEl.props.children as
        | ReactElement<DropdownOptionProps>
        | ReactElement<DropdownOptionProps>[],
      (option) => {
        if (!React.isValidElement(option)) return option;
        const optionEl = option as ReactElement<
          DropdownOptionProps & { style?: React.CSSProperties }
        >;
        const isSelected = selectedValues.includes(String(optionEl.props.value));
        const avatar = optionAvatars?.[optionEl.props.value];
        // Keep children as text: Agora stringifies them for filtering and the
        // selected label. Native option styles are forwarded to the rendered li.
        return React.cloneElement(optionEl, {
          selected: isSelected,
          ...(avatar && {
            className: [optionEl.props.className, avatar.src && styles.avatarOption]
              .filter(Boolean)
              .join(" "),
            style: avatar.src
              ? { ...optionEl.props.style, ...avatarStyle(avatar) }
              : optionEl.props.style,
            hasIcon: !avatar.src,
            icon: avatar.src ? undefined : avatarFallbackIcon(avatar),
          }),
        });
      }
    );
    return React.cloneElement(sectionEl, {}, modifiedOptions);
  }) as ReactElement<DropdownSectionProps>[];
}

const IsolatedSelect = React.memo(function IsolatedSelect({
  label,
  placeholder,
  id,
  onChangeRef,
  defaultValue,
  type,
  hasError,
  errorFeedbackText,
  helperText,
  hideLabel,
  hideSectionNames,
  searchable,
  required,
  searchInputPlaceholder,
  searchNoResultsText,
  onChangeCallback,
  onSearchCallback,
  optionAvatars,
  children,
}: IsolatedSelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [loadedAvatarSources, setLoadedAvatarSources] = React.useState<Set<string>>(
    () => new Set()
  );

  // CSS backgrounds have no error event. Show the native Agora icon until
  // the image has loaded, and retain it if the supplied URL is broken.
  React.useEffect(() => {
    const sources = new Set(
      Object.values(optionAvatars ?? {})
        .map((avatar) => avatar.src)
        .filter((src): src is string => !!src)
    );
    const images = Array.from(sources, (src) => {
      const image = new Image();
      image.onload = () => {
        setLoadedAvatarSources((previous) =>
          previous.has(src) ? previous : new Set(previous).add(src)
        );
      };
      image.src = src;
      return image;
    });
    return () => {
      images.forEach((image) => {
        image.onload = null;
      });
    };
  }, [optionAvatars]);

  const availableAvatars = React.useMemo(
    () =>
      optionAvatars &&
      Object.fromEntries(
        Object.entries(optionAvatars).map(([value, avatar]) => [
          value,
          avatar.src && loadedAvatarSources.has(avatar.src) ? avatar : { ...avatar, src: null },
        ])
      ),
    [optionAvatars, loadedAvatarSources]
  );

  // Sync defaultValue into state and ref when it changes (e.g. after save)
  React.useEffect(() => {
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
      if (onChangeRef) onChangeRef.current = defaultValue;
    }
  }, [defaultValue, onChangeRef]);

  const selectedValues = React.useMemo(
    () => (internalValue ? internalValue.split(",").filter(Boolean) : []),
    [internalValue]
  );

  // Keep a stable snapshot of children while still updating when the actual
  // option list changes. This lets the select render new search results and
  // created tags without losing the selected state.
  const latestChildrenRef = React.useRef(children);
  latestChildrenRef.current = children;

  const childrenWithSelection = React.useMemo(
    () => injectSelected(latestChildrenRef.current, selectedValues, availableAvatars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latestChildrenRef, selectedValues, children, availableAvatars]
  );

  const selectedAvatar = availableAvatars?.[internalValue];
  const selectedFallbackIcon =
    selectedAvatar && !selectedAvatar.src ? avatarFallbackIcon(selectedAvatar) : undefined;

  const select = (
    <InputSelect
      label={label}
      placeholder={placeholder}
      id={id}
      type={type}
      hasIcon={!!selectedFallbackIcon}
      icon={selectedFallbackIcon}
      hideLabel={hideLabel}
      searchable={searchable}
      searchInputPlaceholder={searchInputPlaceholder}
      searchNoResultsText={searchNoResultsText}
      onSearchInputChange={
        onSearchCallback ? (q) => queueMicrotask(() => onSearchCallback(q)) : undefined
      }
      onChange={(options) => {
        const value = options.map((o) => o.value as string).join(",");
        // Refs don't trigger re-renders, so they're safe to set synchronously.
        if (onChangeRef) onChangeRef.current = value;
        // InputSelect can fire onChange during its own render cycle (e.g. when an
        // option is pre-selected). Defer the state updates so we never setState
        // on this component or a parent while another component is rendering.
        queueMicrotask(() => {
          setInternalValue(value);
          onChangeCallback?.(value);
        });
      }}
      hasError={hasError}
      hasFeedback={hasError}
      feedbackState="danger"
      errorFeedbackText={errorFeedbackText}
      hasHelperText={Boolean(helperText)}
      helperText={helperText}
      required={required}
      hideSectionNames={hideSectionNames}
    >
      {childrenWithSelection}
    </InputSelect>
  );

  if (!optionAvatars) return select;

  return (
    <div
      className={selectedAvatar?.src ? styles.withSelectedAvatar : undefined}
      style={selectedAvatar?.src ? avatarStyle(selectedAvatar) : undefined}
    >
      {select}
    </div>
  );
});

export default IsolatedSelect;
