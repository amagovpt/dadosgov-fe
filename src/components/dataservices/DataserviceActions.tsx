import "server-only";

import { setDataserviceFavorite } from "@/service/api/dataservices/actions";
import type { DataserviceActionsState } from "@/service/types/dataservice/detail";
import { DataserviceFavoriteForm } from "./DataserviceFavoriteForm";
import { DataserviceActionIcon } from "./DataserviceActionIcon";

const favoriteClass = "agora-btn agora-btn-link-neutral agora-btn-with-icon flex flex-shrink-0 items-center justify-center content-center";

function UnavailableFavorite({ label }: { label: string }) {
  return <button className={favoriteClass} disabled><DataserviceActionIcon name="star" /><span className="children-wrapper">{label}</span></button>;
}

export function DataserviceActions({ id, slug, locale, state: initial, labels }: {
  id: string;
  slug: string;
  locale: string;
  state: DataserviceActionsState;
  labels: { add: string; remove: string; error: string; edit: string };
}) {
  return <>
    {!initial.userId ? (
      <a href={`/${locale}/login`} className={favoriteClass}><DataserviceActionIcon name="star" /><span className="children-wrapper">{labels.add}</span></a>
    ) : initial.favorite === null ? (
      <><UnavailableFavorite label={labels.add} /><span role="alert">{labels.error}</span></>
    ) : (
      <DataserviceFavoriteForm
        key={`${id}:${initial.userId}`}
        action={setDataserviceFavorite.bind(null, id, locale)}
        favorite={initial.favorite}
        permalink={`/${locale}/dataservices/${encodeURIComponent(slug)}`}
        labels={labels}
      />
    )}
    {initial.canEdit && (
      <a href={`/${locale}/admin/dataservices/edit?id=${encodeURIComponent(id)}`}
        className="agora-btn agora-btn-solid-primary agora-btn-with-icon flex items-center justify-center content-center">
        <DataserviceActionIcon name="edit" />
        <span className="children-wrapper">{labels.edit}</span>
      </a>
    )}
  </>;
}
