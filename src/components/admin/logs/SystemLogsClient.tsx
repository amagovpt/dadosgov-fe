"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumb,
  Button,
  CardNoResults,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSelect,
  Pill,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { fetchSystemLogContent, fetchSystemLogs } from "@/services/api";
import { SystemLogContent, SystemLogFile } from "@/types/api";

const AUTO_REFRESH_MS = 10_000;

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDateTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
};

const lineSeverity = (line: string): "error" | "warn" | "info" | null => {
  const upper = line.toUpperCase();
  if (/\b(ERROR|CRITICAL|FATAL|EXCEPTION|TRACEBACK)\b/.test(upper)) return "error";
  if (/\bWARN(ING)?\b/.test(upper)) return "warn";
  if (/\bINFO\b/.test(upper)) return "info";
  return null;
};

export default function SystemLogsClient() {
  const [files, setFiles] = useState<SystemLogFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<SystemLogContent | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const viewerRef = useRef<HTMLPreElement>(null);

  const loadFiles = useCallback(async (preserveSelection: boolean = true) => {
    setIsLoadingFiles(true);
    try {
      const list = await fetchSystemLogs();
      setFiles(list);
      setSelected((prev) => {
        if (preserveSelection && prev && list.some((f) => f.name === prev)) return prev;
        return list[0]?.name ?? null;
      });
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  const loadContent = useCallback(async (filename: string) => {
    setIsLoadingContent(true);
    setError(null);
    try {
      const data = await fetchSystemLogContent(filename);
      if (!data) {
        setError("Não foi possível carregar o conteúdo do ficheiro.");
        setContent(null);
        return;
      }
      setContent(data);
      setLastRefresh(new Date());
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    loadFiles(false);
  }, [loadFiles]);

  useEffect(() => {
    if (selected) {
      loadContent(selected);
    } else {
      setContent(null);
    }
  }, [selected, loadContent]);

  useEffect(() => {
    if (!autoRefresh || !selected) return;
    const id = window.setInterval(() => {
      loadFiles(true);
      loadContent(selected);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, selected, loadFiles, loadContent]);

  useEffect(() => {
    if (viewerRef.current && content) {
      viewerRef.current.scrollTop = viewerRef.current.scrollHeight;
    }
  }, [content]);

  const lines = useMemo(() => {
    if (!content?.content) return [] as string[];
    const split = content.content.split("\n");
    if (split.length > 0 && split[split.length - 1] === "") split.pop();
    return split;
  }, [content]);

  const handleManualRefresh = () => {
    loadFiles(true);
    if (selected) loadContent(selected);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = content.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <div className="admin-page__breadcrumb">
        <Breadcrumb
          items={[
            { label: "Administração", url: "/pages/admin" },
            { label: "Sistema", url: "#" },
            { label: "Logs", url: "/pages/admin/system/logs" },
          ]}
        />
      </div>

      <div className="admin-page__header">
        <h1 className="admin-page__title">Logs</h1>
        <div className="flex items-center gap-[8px]">
          <Button
            variant="primary"
            appearance="outline"
            hasIcon={true}
            leadingIcon={
              autoRefresh ? "agora-line-pause-circle" : "agora-line-refresh"
            }
            leadingIconHover={
              autoRefresh ? "agora-solid-pause-circle" : "agora-solid-refresh"
            }
            onClick={() => setAutoRefresh((v) => !v)}
          >
            {autoRefresh ? "Parar auto-atualizar" : "Auto-atualizar (10s)"}
          </Button>
          <Button
            variant="primary"
            hasIcon={true}
            leadingIcon="agora-line-refresh"
            leadingIconHover="agora-solid-refresh"
            onClick={handleManualRefresh}
            disabled={isLoadingFiles || isLoadingContent}
          >
            Atualizar
          </Button>
        </div>
      </div>

      <p className="text-neutral-700 text-sm mb-[16px]">
        Visualização do conteúdo dos ficheiros de log do servidor. Para ficheiros grandes, é
        apresentado apenas o final (até 1&nbsp;MB).
      </p>

      {isLoadingFiles && files.length === 0 ? (
        <p className="text-neutral-700 text-sm">A carregar ficheiros de log...</p>
      ) : files.length === 0 ? (
        <CardNoResults
          position="center"
          icon={
            <Icon name="agora-line-monitor" className="w-12 h-12 text-primary-500 icon-xl" />
          }
          title="Sem logs disponíveis"
          description="Não foi possível encontrar ficheiros de log no servidor."
          hasAnchor={false}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-[16px] mb-[16px]">
            <div className="admin-search-wrapper">
              <InputSelect
                id="log-file-select"
                label="Ficheiro de log"
                placeholder="Selecionar ficheiro"
                onChange={(options) => {
                  const value = options[0]?.value as string | undefined;
                  setSelected(value || null);
                }}
              >
                <DropdownSection name="log-file">
                  {files.map((f) => (
                    <DropdownOption
                      key={f.name}
                      value={f.name}
                      selected={selected === f.name}
                    >
                      {`${f.name} · ${formatBytes(f.size)}`}
                    </DropdownOption>
                  ))}
                </DropdownSection>
              </InputSelect>
            </div>

            <Button
              variant="primary"
              appearance="outline"
              hasIcon={true}
              leadingIcon="agora-line-download"
              leadingIconHover="agora-solid-download"
              onClick={handleDownload}
              disabled={!content}
            >
              Descarregar
            </Button>
          </div>

          {content && (
            <div className="flex flex-wrap items-center gap-[8px] mb-[12px]">
              <Pill variant="neutral">
                <Icon name="agora-line-file" className="w-[14px] h-[14px] mr-[4px]" />
                {content.name}
              </Pill>
              <Pill variant="neutral">{formatBytes(content.size)}</Pill>
              <Pill variant="neutral">
                <Icon name="agora-line-clock" className="w-[14px] h-[14px] mr-[4px]" />
                {formatDateTime(content.modified)}
              </Pill>
              {content.truncated && (
                <Pill variant="warning">A mostrar apenas o final do ficheiro</Pill>
              )}
              {lastRefresh && (
                <span className="text-neutral-600 text-xs ml-auto">
                  Atualizado às {formatDateTime(lastRefresh.toISOString())}
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="mb-[12px]">
              <StatusCard variant="danger" showIcon description={error} />
            </div>
          )}

          <pre
            ref={viewerRef}
            className="admin-log-viewer"
            aria-label="Conteúdo do ficheiro de log"
            tabIndex={0}
          >
            {isLoadingContent && !content ? (
              <span className="admin-log-viewer__placeholder">A carregar conteúdo...</span>
            ) : !content || lines.length === 0 ? (
              <span className="admin-log-viewer__placeholder">
                Ficheiro vazio.
              </span>
            ) : (
              lines.map((line, idx) => {
                const severity = lineSeverity(line);
                return (
                  <span
                    key={idx}
                    className={`admin-log-viewer__line${
                      severity ? ` admin-log-viewer__line--${severity}` : ""
                    }`}
                  >
                    <span className="admin-log-viewer__lineno">{idx + 1}</span>
                    <span className="admin-log-viewer__text">{line || " "}</span>
                  </span>
                );
              })
            )}
          </pre>
        </>
      )}
    </div>
  );
}
