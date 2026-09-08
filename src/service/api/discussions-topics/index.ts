import type { Discussion, DiscussionCreatePayload } from "@/service/types/discussion";
import type { APIResponse } from "@/service/types/shared";
import type {
  Topic,
  TopicCreatePayload,
  TopicElement,
  TopicElementCreatePayload,
  TopicUpdatePayload,
} from "@/service/types/topic";
import { API_AUTH_URL, API_BASE_URL, API_V2_BASE_URL } from "@/service/utils/API";
import { rethrowControlFlow } from "@/service/utils/rethrowControlFlow";


export async function fetchOrgDiscussions(
  orgId: string,
  page: number = 1,
  pageSize: number = 20,
  sort?: string
): Promise<APIResponse<Discussion>> {
  try {
    const params = new URLSearchParams({
      org: orgId,
      page: String(page),
      page_size: String(pageSize),
    });
    if (sort) params.set("sort", sort);
    const res = await fetch(`${API_BASE_URL}/discussions/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch org discussions: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching org discussions:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


export async function fetchDiscussions(
  subjectId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<APIResponse<Discussion>> {
  try {
    const params = new URLSearchParams({
      for: subjectId,
      page: String(page),
      page_size: String(pageSize),
    });
    const res = await fetch(`${API_BASE_URL}/discussions/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch discussions: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching discussions:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


// --- Topics (API v2) ---

export async function fetchTopics(
  page: number = 1,
  pageSize: number = 20,
  sort?: string
): Promise<APIResponse<Topic>> {
  try {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (sort) params.set("sort", sort);
    const res = await fetch(`${API_V2_BASE_URL}/topics/?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch topics: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching topics:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


export async function createDiscussion(
  payload: DiscussionCreatePayload
): Promise<Discussion | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/discussions/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to create discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error creating discussion:", error);
    return null;
  }
}


export async function fetchTopic(slugOrId: string): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${slugOrId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching topic:", error);
    return null;
  }
}


export async function replyToDiscussion(
  discussionId: string,
  comment: string,
  options?: { organization?: string, close?: boolean }
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment, organization: options?.organization }),
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to reply to a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to reply to discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error replying to discussion:", error);
    return null;
  }
}


export async function fetchTopicElements(
  topicId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<APIResponse<TopicElement>> {
  try {
    const res = await fetch(
      `${API_V2_BASE_URL}/topics/${topicId}/elements/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch topic elements: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error fetching topic elements:", error);
    return {
      data: [],
      page: 1,
      page_size: pageSize,
      total: 0,
      next_page: null,
      previous_page: null,
    };
  }
}


export async function createTopic(
  payload: TopicCreatePayload
): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to create topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error creating topic:", error);
    return null;
  }
}


export async function updateTopic(
  id: string,
  payload: TopicUpdatePayload
): Promise<Topic | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to update topic: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error updating topic:", error);
    return null;
  }
}


export async function deleteTopic(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to delete a topic");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete topic: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error deleting topic:", error);
    return false;
  }
}


export async function addTopicElement(
  topicId: string,
  payload: TopicElementCreatePayload
): Promise<TopicElement | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${topicId}/elements/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to add a topic element");
    }

    if (!res.ok) {
      throw new Error(`Failed to add topic element: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error adding topic element:", error);
    return null;
  }
}


export async function removeTopicElement(
  topicId: string,
  elementId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_V2_BASE_URL}/topics/${topicId}/elements/${elementId}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to remove a topic element");
    }

    if (!res.ok) {
      throw new Error(`Failed to remove topic element: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error removing topic element:", error);
    return false;
  }
}


export async function updateTopicElements(
  topicId: string,
  elements: TopicElementCreatePayload[]
): Promise<TopicElement[] | null> {
  try {
    const res = await fetch(`${API_V2_BASE_URL}/topics/${topicId}/elements/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(elements),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update topic elements");
    }

    if (!res.ok) {
      throw new Error(`Failed to update topic elements: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error updating topic elements:", error);
    return null;
  }
}


export async function closeDiscussion(
  discussionId: string,
  comment?: string
): Promise<Discussion | null> {
  try {
    const body: Record<string, unknown> = { close: true };
    if (comment) body.comment = comment;

    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to close a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to close discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error closing discussion:", error);
    return null;
  }
}


export async function deleteDiscussion(
  discussionId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (res.status === 401) {
      throw new Error("Authentication required to delete a discussion");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete discussion: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error deleting discussion:", error);
    return false;
  }
}


export async function updateDiscussion(
  discussionId: string,
  title: string
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to update discussion: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error updating discussion:", error);
    return null;
  }
}


export async function editDiscussionComment(
  discussionId: string,
  commentIndex: number,
  comment: string
): Promise<Discussion | null> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/comments/${commentIndex}/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to edit comment: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error editing comment:", error);
    return null;
  }
}


export async function deleteDiscussionComment(
  discussionId: string,
  commentIndex: number
): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_AUTH_URL}/discussions/${discussionId}/comments/${commentIndex}/`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to delete comment: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    rethrowControlFlow(error);
    console.error("Error deleting comment:", error);
    return false;
  }
}
