"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary for every localized page. Any uncaught render
 * error — most likely the CMS being unreachable on a cold start, before the
 * stale-while-revalidate cache in apollo-client.ts has a copy to serve —
 * shows a friendly retry page instead of the bare framework 500. The
 * header/footer from the [locale] layout stay visible around it.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side details are in the Next.js container logs under the digest.
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="flex w-full flex-col items-center justify-center bg-primary-50 px-4 py-24">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-primary-900">
          Ocorreu um erro ao carregar esta página
        </h1>
        <p className="text-neutral-700">
          O serviço pode estar temporariamente indisponível. Por favor, tente
          novamente dentro de instantes.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded bg-primary-600 px-6 py-3 font-semibold text-white hover:bg-primary-700"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
