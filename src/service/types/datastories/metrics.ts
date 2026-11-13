/** `GET|POST /api/1/datastories/<slug>/...`: the metrics udata keeps for a Squidex datastory. */
export type DatastoryMetrics = {
  slug: string;
  metrics: {
    views: number;
  };
};
