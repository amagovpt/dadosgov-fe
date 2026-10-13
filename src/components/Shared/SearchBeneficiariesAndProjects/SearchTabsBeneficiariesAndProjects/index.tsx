"use client";

import SearchInTab from "@/components/Primitives/Fundos-Europeus/PT2030/BeneficiariesAndProjects/SearchInTab";
import { Tabs } from "@/components/Shared/Tabs";
import { searchTabComplete } from "@/service/types/areas/fundos-europeus/pt2030/beneficiarios-e-projetos";

export default function SearchTabsBeneficiariesAndProjects({
    tabs,
    locale,
}: {
    tabs: searchTabComplete[];
    locale: string;
}) {
    return (
        <Tabs.Root>
            {tabs.map((tab, index) => (
                <Tabs.Section key={`search-tab-${index}`}>
                    <Tabs.Header>{tab.tabName}</Tabs.Header>
                    <Tabs.Body>
                        <SearchInTab content={tab} locale={locale} />
                    </Tabs.Body>
                </Tabs.Section>
            ))}
        </Tabs.Root>

    )
}
