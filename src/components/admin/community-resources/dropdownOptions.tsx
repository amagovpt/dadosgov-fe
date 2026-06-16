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
