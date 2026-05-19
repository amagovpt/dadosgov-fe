import { Image } from "@/service/types/common";

export type DataStoryMetadata = {
  slug: string;
  theme: string;
  organizationName: string;
  title: string;
  description: string;
  image: Image[];
  createdAt: string;
  tags: {
    tag: string;
  };
};

export type Datastories = DataStoryMetadata[];
