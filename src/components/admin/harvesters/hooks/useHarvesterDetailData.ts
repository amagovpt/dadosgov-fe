"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchHarvester,
  fetchHarvestBackends,
  fetchHarvestJobs,
} from "@/service/api/harvesters";
import type {
  HarvestBackend,
  HarvestJob,
  HarvestSource,
} from "@/service/types/harvester";

interface UseHarvesterDetailDataParams {
  slug: string;
}

export function useHarvesterDetailData({ slug }: UseHarvesterDetailDataParams) {
  const [source, setSource] = useState<HarvestSource | null>(null);
  const [jobs, setJobs] = useState<HarvestJob[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(10);
  const [backends, setBackends] = useState<HarvestBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const jobsInitialLoadDone = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const [data, backendsData] = await Promise.all([
          fetchHarvester(slug),
          fetchHarvestBackends(),
        ]);
        setBackends(backendsData);
        setSource(data);

        if (data) {
          const jobsResponse = await fetchHarvestJobs(data.id, jobsPage, jobsPageSize);
          setJobs(jobsResponse.data || []);
          setJobsTotal(jobsResponse.total || 0);
        }
      } catch (error) {
        console.error("Error loading harvester:", error);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [slug]);

  useEffect(() => {
    if (!jobsInitialLoadDone.current) {
      jobsInitialLoadDone.current = true;
      return;
    }
    if (!source) return;
    const sourceId = source.id;

    async function loadJobsPage() {
      try {
        const jobsResponse = await fetchHarvestJobs(sourceId, jobsPage, jobsPageSize);
        setJobs(jobsResponse.data || []);
        setJobsTotal(jobsResponse.total || 0);
      } catch (error) {
        console.error("Error loading jobs:", error);
      }
    }

    loadJobsPage();
  }, [jobsPage, jobsPageSize, source]);

  return {
    backends,
    isLoading,
    jobs,
    jobsPage,
    jobsPageSize,
    jobsTotal,
    setJobsPage,
    setJobsPageSize,
    setSource,
    source,
  };
}
