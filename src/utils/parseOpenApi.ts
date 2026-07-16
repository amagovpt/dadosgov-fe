/**
 * Minimal OpenAPI / Swagger parser for the API detail "Swagger" section.
 *
 * Extracts just what the lightweight summary renders (mirroring data.gouv.fr):
 * version, base URL, endpoints grouped by tag, and the list of models. It does
 * NOT validate the whole document — the input is untrusted remote JSON, so
 * every access is defensive and anything unexpected is skipped rather than
 * thrown. Supports OpenAPI 3.x (`openapi`, `servers`, `components.schemas`) and
 * Swagger 2.0 (`swagger`, `host`/`basePath`/`schemes`, `definitions`).
 */

export interface SwaggerEndpoint {
  method: string;
  path: string;
  summary: string;
}

export interface SwaggerGroup {
  tag: string;
  endpoints: SwaggerEndpoint[];
}

export interface SwaggerModel {
  name: string;
  description: string;
}

export interface ParsedSwagger {
  version: string | null;
  baseUrl: string | null;
  groups: SwaggerGroup[];
  models: SwaggerModel[];
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
const UNTAGGED = "Outros";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function resolveBaseUrl(spec: Record<string, unknown>): string | null {
  // OpenAPI 3.x
  if (Array.isArray(spec.servers) && isRecord(spec.servers[0])) {
    const url = asString(spec.servers[0].url);
    if (url) return url;
  }
  // Swagger 2.0
  const host = asString(spec.host);
  if (host) {
    const schemes = Array.isArray(spec.schemes) ? spec.schemes.map(asString) : [];
    const scheme = schemes.includes("https") ? "https" : schemes[0] || "https";
    return `${scheme}://${host}${asString(spec.basePath)}`;
  }
  return null;
}

function parseGroups(spec: Record<string, unknown>): SwaggerGroup[] {
  if (!isRecord(spec.paths)) return [];

  const byTag = new Map<string, SwaggerEndpoint[]>();

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!isRecord(op)) continue;
      const tags = Array.isArray(op.tags) && op.tags.length ? op.tags.map(asString) : [UNTAGGED];
      const summary = asString(op.summary) || asString(op.description);
      const endpoint: SwaggerEndpoint = { method: method.toUpperCase(), path, summary };
      const tag = tags[0] || UNTAGGED;
      const bucket = byTag.get(tag) ?? [];
      bucket.push(endpoint);
      byTag.set(tag, bucket);
    }
  }

  return Array.from(byTag, ([tag, endpoints]) => ({ tag, endpoints }));
}

function parseModels(spec: Record<string, unknown>): SwaggerModel[] {
  // OpenAPI 3.x: components.schemas — Swagger 2.0: definitions
  const schemas = isRecord(spec.components) ? spec.components.schemas : spec.definitions;
  if (!isRecord(schemas)) return [];

  return Object.entries(schemas).map(([name, schema]) => ({
    name,
    description: isRecord(schema) ? asString(schema.description) : "",
  }));
}

/**
 * Parse an OpenAPI/Swagger document (already JSON-decoded) into the summary
 * shape. Returns null when the input is not a recognisable spec.
 */
export function parseOpenApi(spec: unknown): ParsedSwagger | null {
  if (!isRecord(spec)) return null;
  // Must look like an OpenAPI/Swagger document.
  if (!spec.openapi && !spec.swagger && !isRecord(spec.paths)) return null;

  const info = isRecord(spec.info) ? spec.info : {};

  return {
    version: asString(info.version) || null,
    baseUrl: resolveBaseUrl(spec),
    groups: parseGroups(spec),
    models: parseModels(spec),
  };
}
