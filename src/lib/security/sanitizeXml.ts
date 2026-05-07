import {
  EVENT_ATTRIBUTE_REGEX,
  FORBIDDEN_TAGS,
  MAX_XML_SIZE,
  URI_ATTRIBUTES,
} from "./constants";
import { isDangerousUri } from "./uri";

export class XmlSanitizationError extends Error {}

const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>\n';

function isParserError(doc: Document): boolean {
  return Boolean(doc.getElementsByTagName("parsererror")[0]);
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

export function sanitizeXml(content: string): string {
  if (!content) return content;

  if (content.length > MAX_XML_SIZE) {
    throw new XmlSanitizationError(
      `Ficheiro demasiado grande (máximo ${Math.floor(MAX_XML_SIZE / 1024 / 1024)}MB)`,
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, "application/xml");

  if (isParserError(doc)) {
    throw new XmlSanitizationError("Ficheiro XML inválido (XML malformado)");
  }

  const root = doc.documentElement;
  if (!root) {
    throw new XmlSanitizationError("Ficheiro XML inválido (XML malformado)");
  }

  const elements: Element[] = [root];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    elements.push(current as Element);
    current = walker.nextNode();
  }

  for (const el of elements) {
    const tagLocal = localName(el.nodeName).toLowerCase();
    if (FORBIDDEN_TAGS.has(tagLocal)) {
      throw new XmlSanitizationError(
        "O ficheiro XML contém conteúdo malicioso não permitido e foi bloqueado.",
      );
    }

    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes.item(i)!;
      const attrLocal = attrLocalName(attr);

      if (EVENT_ATTRIBUTE_REGEX.test(attrLocal)) {
        throw new XmlSanitizationError(
          "O ficheiro XML contém conteúdo malicioso não permitido e foi bloqueado.",
        );
      }

      if (isUriAttr(attr) && isDangerousUri(attr.value)) {
        throw new XmlSanitizationError(
          "O ficheiro XML contém conteúdo malicioso não permitido e foi bloqueado.",
        );
      }
    }
  }

  const serializer = new XMLSerializer();
  return XML_DECLARATION + serializer.serializeToString(doc);
}
