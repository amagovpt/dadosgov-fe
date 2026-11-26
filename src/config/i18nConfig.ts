export const i18nConfig = {
  prefixDefault: true,
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localeDetection: true,
  basePath: "",
};


/** Used on every page: header, footer, account gates, shared components. */
export const rootNamespaces = [
  "common",
  "footer",
  "login",
  "admin-common",
  "datastories",
  "documentation",
];

/**
 * Public route segments, keyed by their directory under `app/[locale]/(pages)`;
 * each one's `layout.tsx` loads its entry through `RouteTranslations`.
 */
export const routeNamespaces = {
  datasets: ["datasets"],
  // `DataserviceSwagger` renders the datasets `CopyField`.
  dataservices: ["dataservices", "datasets"],
  organizations: ["organizations"],
  reuses: ["reuses"],
  users: ["profile"],
  "(footer-pages)/ajuda-e-contactos": ["support"],
  "recursos/aprender": ["learning"],
  "recursos/como-usar-o-portal": ["user-guides"],
} satisfies Record<string, string[]>;

/** The backoffice, loaded as one block by the `(admin)` layout. */
export const adminNamespaces = [
  "admin-harvesters",
  "admin-dataservices",
  "admin-datasets",
  "admin-community-resources",
  "admin-organizations",
  "admin-reuses",
  "admin-discussions",
  "admin-notifications",
  "admin-users",
  "admin-members",
  "admin-profile",
  "admin-posts",
  "admin-topics",
  "admin-jobs",
  "admin-migrations",
  "admin-logs",
  "admin-editorial",
  "admin-statistics",
  // Public namespaces the backoffice components also use.
  "datasets",
  "dataservices",
  "organizations",
  "reuses",
  "profile",
];
