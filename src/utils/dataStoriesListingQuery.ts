import { Datastories } from "@/types/datastories/datastories";
import { DataStoriesFilterState } from "@/types/datastories/filters";

export const DATA_STORIES_PAGE_SIZE = 12;

function daysAgo(dateStr: string, days: number): boolean {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24) <= days;
}

export function filterDataStories(
  stories: Datastories,
  query: string,
  activeFilters: DataStoriesFilterState
): Datastories {
  const safeStories = Array.isArray(stories) ? stories : [];
  const normalizedQuery = query.trim().toLowerCase();

  return safeStories.filter((story) => {
    if (
      normalizedQuery &&
      !story.title.toLowerCase().includes(normalizedQuery) &&
      !story.description.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }

    if (activeFilters.toggles.temas !== "all" && story.theme !== activeFilters.toggles.temas) {
      return false;
    }

    if (activeFilters.tags.length > 0 && !activeFilters.tags.some((tag) => story.tags.tag === tag)) {
      return false;
    }

    if (activeFilters.toggles.atualizacao === "30_days" && !daysAgo(story.createdAt, 30)) {
      return false;
    }
    if (activeFilters.toggles.atualizacao === "12_months" && !daysAgo(story.createdAt, 365)) {
      return false;
    }
    if (activeFilters.toggles.atualizacao === "3_years" && !daysAgo(story.createdAt, 365 * 3)) {
      return false;
    }

    return true;
  });
}

export function sortDataStories(stories: Datastories): Datastories {
  return [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function paginateDataStories(stories: Datastories, page: number, pageSize = DATA_STORIES_PAGE_SIZE): Datastories {
  return stories.slice((page - 1) * pageSize, page * pageSize);
}

