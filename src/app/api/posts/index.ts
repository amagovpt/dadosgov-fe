import {
  APIResponse,
  Post,
  PostCreatePayload,
  PostUpdatePayload,
} from "@/service/types/api";
import { getApiBaseUrl, getAuthApiBaseUrl } from "@/service/utils/API";

const API_BASE_URL = getApiBaseUrl(1);
const API_AUTH_URL = getAuthApiBaseUrl();

export async function fetchPosts(
  page: number = 1,
  pageSize: number = 3,
  sort: string = "-published",
  q?: string
): Promise<APIResponse<Post>> {
  try {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), sort });
    if (q) params.set("q", q);
    const res = await fetch(`${API_BASE_URL}/posts/?${params.toString()}`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
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

export async function fetchPost(slugOrId: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${slugOrId}/`, {
      cache: "no-store",
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function createPost(
  payload: PostCreatePayload
): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to create a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to create post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}

export async function updatePost(
  id: string,
  payload: PostUpdatePayload
): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new Error("Authentication required to update a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to update post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

export async function fetchAdminPosts(
  page: number = 1,
  pageSize: number = 100,
  sort: string = "-created_at"
): Promise<APIResponse<Post>> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort,
      with_drafts: "true",
    });
    const res = await fetch(`${API_AUTH_URL}/posts/?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch admin posts: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching admin posts:", error);
    return { data: [], page: 1, page_size: pageSize, total: 0, next_page: null, previous_page: null };
  }
}

export async function publishPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/publish/`, {
      method: "POST",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to publish a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to publish post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error publishing post:", error);
    return null;
  }
}

export async function unpublishPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/publish/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to unpublish a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to unpublish post: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error unpublishing post:", error);
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_AUTH_URL}/posts/${id}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      throw new Error("Authentication required to delete a post");
    }

    if (!res.ok) {
      throw new Error(`Failed to delete post: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

export async function uploadPostImage(
  id: string,
  file: File
): Promise<Post | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_AUTH_URL}/posts/${id}/image/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 401) {
      throw new Error("Authentication required to upload a post image");
    }

    if (!res.ok) {
      throw new Error(`Failed to upload post image: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error uploading post image:", error);
    return null;
  }
}
