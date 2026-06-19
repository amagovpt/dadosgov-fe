import { permanentRedirect } from "next/navigation";

// Legacy route: the "Licenças" FAQ content lives under the "licenses" slug in the
// CMS (there is no "licences" entry). Permanently redirect the old, content-less
// URL to the canonical one so any existing bookmarks/indexed links keep working.
export default function LicencesRedirect() {
  permanentRedirect("/pages/faqs/licenses");
}
