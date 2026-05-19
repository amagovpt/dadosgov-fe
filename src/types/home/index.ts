import { Image } from "@/service/types/common";

export type Datastory = {
    slug: string;
    title: string;
    image: Image[];
    createdAt: string;
};

export type UsedDailyBy = {
    alt: string;
    anchor: {
        children: string;
        href: string;
    }
    logo: Image[];
};

export type Home = {
    datastories: Datastory[];
    usedDailyBy: UsedDailyBy[]
};
