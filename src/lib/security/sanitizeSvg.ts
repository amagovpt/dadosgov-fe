import {
  EVENT_ATTRIBUTE_REGEX,
  FORBIDDEN_TAGS,
  MAX_SVG_SIZE,
  SVG_NAMESPACE,
  URI_ATTRIBUTES,
} from "./constants";
import { isDangerousUri } from "./uri";

export class SvgSanitizationError extends Error {}

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>\n';

function isParserError(doc: Document): boolean {
  const errorNode = doc.getElementsByTagName("parsererror")[0];
  return Boolean(errorNode);
}

function localName(tag: string): string {
  return tag.includes(":") ? tag.split(":").pop()! : tag;
}

function attrLocalName(attr: Attr): string {
  return (attr.localName ?? attr.name).toLowerCase();
}

function isUriAttr(attr: Attr): boolean {
  const local = attrLocalName(attr);
  if (URI_ATTRIBUTES.has(local)) return true;
  return URI_ATTRIBUTES.has(attr.name.toLowerCase());
}

export function sanitizeSvg(content: string): string {
  if (!content) return content;

  if (content.length > MAX_SVG_SIZE) {
    throw new SvgSanitizationError(
      `Ficheiro demasiado grande (máximo ${Math.floor(MAX_SVG_SIZE / 1024 / 1024)}MB)`,
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "image/svg+xml");

  if (isParserError(doc)) {
    throw new SvgSanitizationError("Ficheiro XML inválido (XML malformado)");
  }

  const root = doc.documentElement;
  if (!root) {
    throw new SvgSanitizationError("Ficheiro XML inválido (XML malformado)");
  }

  const rootLocal = localName(root.nodeName).toLowerCase();
  if (rootLocal !== "svg") {
    throw new SvgSanitizationError(
      "Ficheiro não é um SVG válido (elemento raiz deve ser <svg>)",
    );
  }

  if (root.namespaceURI && root.namespaceURI !== SVG_NAMESPACE) {
    throw new SvgSanitizationError(
      "Ficheiro não é um SVG válido (elemento raiz deve ser <svg>)",
    );
  }

  const elements: Element[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  elements.push(root);
  let current = walker.nextNode();
  while (current) {
    elements.push(current as Element);
    current = walker.nextNode();
  }

  const toRemove: Element[] = [];

  for (const el of elements) {
    const tagLocal = localName(el.nodeName).toLowerCase();
    if (FORBIDDEN_TAGS.has(tagLocal)) {
      toRemove.push(el);
      continue;
    }

    const attrsToRemove: Attr[] = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes.item(i)!;
      const attrLocal = attrLocalName(attr);

      if (EVENT_ATTRIBUTE_REGEX.test(attrLocal)) {
        attrsToRemove.push(attr);
        continue;
      }

      if (isUriAttr(attr) && isDangerousUri(attr.value)) {
        attrsToRemove.push(attr);
      }
    }

    for (const attr of attrsToRemove) {
      if (attr.namespaceURI) {
        el.removeAttributeNS(attr.namespaceURI, attr.localName ?? attr.name);
      } else {
        el.removeAttribute(attr.name);
      }
    }
  }

  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
  }

  const serializer = new XMLSerializer();
  return XML_DECLARATION + serializer.serializeToString(doc);
}
