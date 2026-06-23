"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import InputSearch from "@/components/Primitives/InputSearch";
import { InputSearchProps } from "@ama-pt/agora-design-system";

export default function MiniCoursesSearchInput(args: Omit<InputSearchProps, "onChange" | "value">) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("q") ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (value.trim()) params.set("q", value.trim());
            params.set("page", "1");
            router.replace(`/recursos/aprender/mini-courses?${params.toString()}`, { scroll: false });
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, router]);

    return (
        <InputSearch
            {...args}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        />
    );
}
