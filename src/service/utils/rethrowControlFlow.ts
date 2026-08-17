import { unstable_rethrow } from "next/navigation";
import { ApiPageError } from "./apiErrorPolicy";

/**
 * Guard for the `catch` blocks in the service layer.
 *
 * Those blocks were written as blanket `catch (error) { console.error(...);
 * return { data: [] } }`. That shape hides two very different things: a
 * genuine parse/logic error (fine to degrade) and the backend being down
 * (which currently renders as an empty result set, indistinguishable from a
 * search that found nothing). It also swallows the errors Next throws to
 * *implement* `redirect()` and `notFound()`, so neither would work from
 * anywhere below one of these calls — and the server-side interceptor calls
 * `redirect()` from inside `fetch`.
 *
 * Calling this as the first statement of a `catch` fixes both: control-flow
 * errors are re-thrown for Next to handle, and a failure that means "this page
 * has no data" reaches the `error.tsx` boundary instead of being painted as
 * an empty page.
 *
 * A call site that must survive a backend failure does not opt out here — it
 * opts out of the interceptor itself, with `SKIP_GLOBAL_ERROR_HANDLING` on the
 * fetch (see `app/backend-fetch.ts`, which must forward the backend's status
 * verbatim), so no `ApiPageError` is ever raised for it.
 */
export function rethrowControlFlow(error: unknown): void {
  unstable_rethrow(error);
  if (error instanceof ApiPageError) throw error;
}
