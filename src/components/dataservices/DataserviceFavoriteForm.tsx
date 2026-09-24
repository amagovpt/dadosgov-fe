"use client";

import { useActionState } from "react";
import { DataserviceActionIcon } from "./DataserviceActionIcon";
import type { FavoriteActionState } from "@/service/types/dataservice/detail";

export function DataserviceFavoriteForm({ action, favorite, permalink, labels }: {
  action: (previous: FavoriteActionState, form: FormData) => Promise<FavoriteActionState>;
  favorite: boolean;
  permalink: string;
  labels: { add: string; remove: string; error: string };
}) {
  const [state, submit, pending] = useActionState(action, { favorite, failed: false }, permalink);
  return (
    <form action={submit} className="flex items-center gap-16">
      <input type="hidden" name="favorite" value={String(!state.favorite)} />
      <button type="submit" disabled={pending} aria-busy={pending}
        className="agora-btn agora-btn-link-neutral agora-btn-with-icon flex flex-shrink-0 items-center justify-center content-center">
        <DataserviceActionIcon name="star" filled={state.favorite} />
        <span className="children-wrapper">{state.favorite ? labels.remove : labels.add}</span>
      </button>
      {state.failed && <span role="alert">{labels.error}</span>}
    </form>
  );
}
