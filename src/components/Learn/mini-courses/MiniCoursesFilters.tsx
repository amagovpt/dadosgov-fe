'use client';
import { useId, useState, Children, isValidElement } from 'react';
import { InputSelect, DropdownSection, DropdownOption, type DropdownOptionProps, type DropdownSectionProps } from '@ama-pt/agora-design-system';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export interface MiniCoursesFiltersProps {
  onSortChange: (sortKey: string) => void;
}

const sortOptions = [
  { label: 'Ordem alfabética A-Z', value: 'asc' },
  { label: 'Ordem alfabética Z-A', value: 'desc' },
  { label: 'Mais recentes', value: 'newest' },
];

export default function MiniCoursesFilters({ onSortChange }: MiniCoursesFiltersProps) {
  const { t } = useTranslation('learning');
  const id = useId();


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterGroups = [
    { name: 'Áreas técnicas', type: 'static' },
    { name: 'Perfis', type: 'static' }
  ];

  const [sections, setSections] = useState<ReactElement<DropdownSectionProps>[]>([
    <DropdownSection key={`sort-${id}`} name="order">
      {sortOptions.map((opt, i) => (
        <DropdownOption key={`sort-${id}-${i}`} value={opt.value} selected={i === 0}>
          {t(`sortOptions.${opt.value}`)}
        </DropdownOption>
      ))}
    </DropdownSection>,
  ]);

  const handleSort = (selected: DropdownOptionProps[]) => {
    const newSections = sections.map((s) => (
      <DropdownSection {...s.props} key={`sort-${id}`}>
        {Children.toArray(s.props.children).map((item, i) => {
          if (isValidElement<DropdownOptionProps>(item)) {
            return (
              <DropdownOption
                {...item.props}
                key={`sort-${id}-${i}`}
                selected={!!selected.find((sel) => sel.value === item.props.value)}
              />
            );
          }
          return null;
        }).filter((item): item is ReactElement<DropdownOptionProps> => item !== null)}
      </DropdownSection>
    ));

    setSections(newSections);

    if (selected.length > 0) {
      onSortChange(selected[0].value as string);
    }
  };

  return (
    <div className=" flex flex-col gap-64">
      <div className="flex flex-col gap-16">
        <h2 className="text-l-bold text-neutral-900">{t('sort')}</h2>
        <InputSelect label={t('sort')} hideLabel onChange={handleSort}>
          {sections}
        </InputSelect>
      </div>
      {/* <div className="">
        <h2 className="text-l-bold text-neutral-900 ">Filtrar</h2>
        <Sidebar variant="filter">
          {filterGroups.map((group, index) => (
            <SidebarItem
              key={index}
              variant="filter"
              item={{
                children: group.name,
                hasIcon: true,
                collapsedIconTrailing: 'agora-line-minus-circle',
                collapsedIconHoverTrailing: 'agora-solid-minus-circle',
                expandedIconTrailing: 'agora-line-plus-circle',
                expandedIconHoverTrailing: 'agora-solid-plus-circle'
              }}
            >
              <div className="px-6 py-4 bg-white border-t border-neutral-100">
                <div className="flex flex-col gap-2">
                  <Checkbox label="Opção 1" value="opt1" />
                  <Checkbox label="Opção 2" value="opt2" />
                </div>
              </div>
            </SidebarItem>
          ))}
        </Sidebar>
      </div> */}
    </div>
  );
}
