"use client";

import { Suspense } from "react";
import PostsEditClient from "@/components/admin/posts/PostsEditClient";

export default function PostEditPage() {
  return (
    <Suspense>
      <PostsEditClient />
    </Suspense>
  );
}
