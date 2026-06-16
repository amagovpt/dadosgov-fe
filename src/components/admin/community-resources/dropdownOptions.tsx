import React from "react";
import { DropdownOption, DropdownSection } from "@ama-pt/agora-design-system";

export interface DropdownItem {
  value: string;
  label: string;
}

export const COMMUNITY_RESOURCE_FORMATS = [
  "csv",
  "json",
  "xml",
  "pdf",
  "xls",
  "xlsx",
  "ods",
  "doc",
  "docx",
  "zip",
  "gz",
  "tar",
  "shp",
  "geojson",
  "kml",
  "rdf",
  "ttl",
  "txt",
  "html",
];

export const COMMUNITY_RESOURCE_CHECKSUM_TYPES = ["sha1", "sha256", "md5", "crc"];

export function renderDropdownSection(
  name: string,
  items: DropdownItem[],
  selectedValue?: string,
) {
  const options = items.map((item) => {
    const selectedProps =
      selectedValue === undefined ? {} : { selected: item.value === selectedValue };

    return (
      <DropdownOption key={item.value} value={item.value} {...selectedProps}>
        {item.label}
      </DropdownOption>
    );
  });

  return <DropdownSection name={name}>{options}</DropdownSection>;
}

export function buildSchemaItems(schemas: string[], loadedSchema = ""): DropdownItem[] {
  const list =
    loadedSchema && !schemas.includes(loadedSchema) ? [loadedSchema, ...schemas] : schemas;

  return [{ value: "", label: "Nenhum" }, ...list.map((item) => ({ value: item, label: item }))];
}

export function buildResourceTypeItems(types: { id: string; label: string }[]): DropdownItem[] {
  return types.map((type) => ({ value: type.id, label: type.label }));
}

export function buildDatasetItems(datasets: { id: string; title: string }[]): DropdownItem[] {
  return datasets.map((dataset) => ({ value: dataset.id, label: dataset.title }));
}

export function buildProducerItems(
  userLabel: string,
  organizations: { id: string; name: string }[],
): DropdownItem[] {
  return [
    { value: "user", label: userLabel },
    ...organizations.map((organization) => ({
      value: organization.id,
      label: organization.name,
    })),
  ];
}

export function buildFormatItems(currentFormat: string): DropdownItem[] {
  const normalizedFormat = currentFormat.toLowerCase();
  const allFormats =
    normalizedFormat && !COMMUNITY_RESOURCE_FORMATS.includes(normalizedFormat)
      ? [...COMMUNITY_RESOURCE_FORMATS, normalizedFormat]
      : COMMUNITY_RESOURCE_FORMATS;

  return allFormats.map((item) => ({ value: item, label: item }));
}

export function buildChecksumTypeItems(): DropdownItem[] {
  return COMMUNITY_RESOURCE_CHECKSUM_TYPES.map((item) => ({
    value: item,
    label: item.toUpperCase(),
  }));
}
