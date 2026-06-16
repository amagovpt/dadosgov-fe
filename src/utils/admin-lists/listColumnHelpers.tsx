import TableActionsCell from "@/components/admin/TableActionsCell";
import type { AdminListColumn } from "@/components/admin/lists/AdminListTable";

type ViewAction = {
  href: string;
};

type EditAction = {
  href: string;
};

type DeleteAction = {
  ariaLabel: string;
  disabled?: boolean;
  handler: () => void;
};

interface TableActionsColumnOptions<T> {
  header?: string;
  headerLabel?: string;
  viewAction?: (item: T) => ViewAction | undefined;
  editAction?: (item: T) => EditAction | undefined;
  deleteAction?: (item: T) => DeleteAction | undefined;
}

export function createTableActionsColumn<T>({
  header = "Ações",
  headerLabel = "Ações",
  viewAction,
  editAction,
  deleteAction,
}: TableActionsColumnOptions<T>): AdminListColumn<T> {
  return {
    id: "actions",
    header,
    headerLabel,
    renderCell: (item) => (
      <TableActionsCell
        viewAction={viewAction?.(item)}
        editAction={editAction?.(item)}
        deleteAction={deleteAction?.(item)}
      />
    ),
  };
}
