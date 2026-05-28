import type { TablePaginationProps } from "@ama-pt/agora-design-system";

export interface CreatePaginationPropsOptions {
  availablePageSizes?: number[];
  itemsPerPageLabel?: string;
  buttonDropdownAriaLabel?: string;
  dropdownListAriaLabel?: string;
  prevButtonAriaLabel?: string;
  nextButtonAriaLabel?: string;
  currentPageIsZeroBased?: boolean;
  resetPageOnPageSizeChange?: number | false;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
}

export function createPaginationProps(
  pageSize: number,
  totalItems: number,
  currentPage: number,
  setPage?: (page: number) => void,
  setPageSize?: (pageSize: number) => void,
  options?: CreatePaginationPropsOptions
): TablePaginationProps {
  const {
    availablePageSizes = [10, 20, 50],
    itemsPerPageLabel = "Linhas por página",
    buttonDropdownAriaLabel = "Selecionar linhas por página",
    dropdownListAriaLabel = "Opções de linhas por página",
    prevButtonAriaLabel = "Página anterior",
    nextButtonAriaLabel = "Próxima página",
    currentPageIsZeroBased = false,
    resetPageOnPageSizeChange,
    onPageChange,
    onPageSizeChange,
  } = options ?? {};

  const current = currentPageIsZeroBased ? currentPage : currentPage - 1;
  const pageChangeHandler = onPageChange
    ? onPageChange
    : setPage
    ? (newPage: number) => setPage(currentPageIsZeroBased ? newPage : newPage + 1)
    : undefined;

  const defaultResetPage = currentPageIsZeroBased ? 0 : 1;
  const pageSizeChangeHandler = onPageSizeChange
    ? onPageSizeChange
    : setPageSize
    ? (newPageSize: number) => {
        setPageSize(newPageSize);
        const resetPage = resetPageOnPageSizeChange === false ? false : resetPageOnPageSizeChange ?? defaultResetPage;
        if (resetPage !== false && setPage) {
          setPage(resetPage);
        }
      }
    : undefined;

  return {
    itemsPerPageLabel,
    itemsPerPage: pageSize,
    totalItems,
    availablePageSizes,
    currentPage: current,
    buttonDropdownAriaLabel,
    dropdownListAriaLabel,
    prevButtonAriaLabel,
    nextButtonAriaLabel,
    onPageChange: pageChangeHandler,
    onPageSizeChange: pageSizeChangeHandler,
  };
}
