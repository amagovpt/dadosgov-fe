"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import { ResourceType } from "@/service/types/catalog";
import { ResourceItem } from "./ResourceItem";
import { formatFileSize, getFileExtension } from "./utils";
import { PendingResourceItem, PendingResourceMeta } from "./types";

interface PendingResourceTableProps {
  files: File[];
  urls: string[];
  onFileReplace: (index: number, file: File) => void;
  onFileRemove: (index: number) => void;
  onUrlRemove: (url: string) => void;
  resourceTypes: ResourceType[];
  resourceMetadata: Record<string, PendingResourceMeta>;
  onEditMeta: (key: string, meta: PendingResourceMeta, newUrl?: string) => void;
}

export function PendingResourceTable({
  files,
  urls,
  onFileReplace,
  onFileRemove,
  onUrlRemove,
  resourceTypes,
  resourceMetadata,
  onEditMeta,
}: PendingResourceTableProps) {
  const items: PendingResourceItem[] = [];

  files.forEach((file, i) => {
    items.push({
      key: `file-${file.name}`,
      name: file.name,
      size: formatFileSize(file.size),
      isUrl: false,
      index: i,
      file,
    });
  });

  urls.forEach((url, i) => {
    items.push({ key: `url-${url}`, name: url, isUrl: true, index: i });
  });

  const getMeta = (key: string, name: string): PendingResourceMeta =>
    resourceMetadata[key] ?? { title: name, resourceType: "main", description: "" };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Nome do ficheiro</TableHeaderCell>
          <TableHeaderCell>Tipo</TableHeaderCell>
          <TableHeaderCell>Formato</TableHeaderCell>
          <TableHeaderCell>Tamanho</TableHeaderCell>
          <TableHeaderCell>Ação</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const meta = getMeta(item.key, item.name);
          const typeLabel =
            resourceTypes.find((rt) => rt.id === meta.resourceType)?.label ?? meta.resourceType;
          const fileExt = getFileExtension(item.name, item.isUrl);
          const formatLabel =
            (meta.format || (fileExt ? fileExt.slice(1) : "")).toUpperCase() || "-";
          const baseName = fileExt ? item.name.slice(0, -fileExt.length) : item.name;
          const displayName =
            meta.title && meta.title !== item.name
              ? meta.title +
                (fileExt && !meta.title.toLowerCase().endsWith(fileExt.toLowerCase())
                  ? fileExt
                  : "")
              : item.isUrl
                ? item.name
                : baseName + fileExt;

          return (
            <TableRow key={item.key}>
              <TableCell headerLabel="Nome do ficheiro">
                <span className="break-all">{displayName}</span>
              </TableCell>
              <TableCell headerLabel="Tipo">{typeLabel}</TableCell>
              <TableCell headerLabel="Formato">{formatLabel}</TableCell>
              <TableCell headerLabel="Tamanho">{item.size ?? "-"}</TableCell>
              <TableCell headerLabel="Ação">
                <div className="flex items-center gap-8">
                  <ResourceItem
                    name={item.name}
                    size={item.size}
                    file={item.file}
                    isUrl={item.isUrl}
                    resourceTypes={resourceTypes}
                    currentMeta={meta}
                    onSaveMeta={(m, newUrl) => onEditMeta(item.key, m, newUrl)}
                    onReplace={!item.isUrl ? (f) => onFileReplace(item.index, f) : undefined}
                    onRemove={
                      !item.isUrl ? () => onFileRemove(item.index) : () => onUrlRemove(item.name)
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
