function slugify(str: string): string {
  return str
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCamelCase(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function toVarCase(str: string): string {
  const slug = slugify(str);
  const camelCase = toCamelCase(slug);
  return camelCase.charAt(0).toLowerCase() + camelCase.slice(1);
}

export { slugify, toCamelCase, toVarCase };
