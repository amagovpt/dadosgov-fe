import { Image } from "@/services/types/common";

export type Datastory = {
    slug: string;
    title: string;
    image: Image[];
    createdAt: string;
};

export type Home = {
    datastories: Datastory[];
};
