import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";

export function useAssignmentTable(
  UBadge: ComponentType,
  UIcon: ComponentType,
  ULink: ComponentType,
  UButton: ComponentType,
  getRangeName: (id: string) => string,
  statusColor: (s: string) => string,
) {
  const getRowItems = (row: Row<IdAssignment>) => {
    const assignment = row.original;

    return [
      {
        type: "label",
        label: "Actions",
      },
      {
        label: "View user details",
        icon: "i-lucide-eye",
        onSelect: () => {},
      },
      {
        label: "Edit assignment",
        icon: "i-lucide-pencil",
        disabled: assignment.status === "released",
        onSelect: () => {},
      },
      {
        label: "Release ID",
        icon: "i-lucide-archive",
        disabled: assignment.status === "released",
        onSelect: () => {},
      },

    ];
  };

  const columns = computed<TableColumn<IdAssignment>[]>(() => [
    {
      id: "id",
      header: "ID",
      accessorFn: row => row.objectId,
      cell: ({ row }) => h("p", { class: "font-semibold text-default" }, row.original.objectId),
    },
    {
      id: "objectName",
      header: "OBJECT NAME",
      accessorFn: row => row.objectName,
      cell: ({ row }) => h("p", { class: "text-capitalize text-default" }, row.original.objectName),
    },
    {
      id: "objectType",
      header: "OBJECT TYPE",
      accessorFn: row => row.objectType,
      cell: ({ row }) => {
        return h("div", { class: "flex items-center gap-2" }, [
          h(UIcon, {
            name: objectTypeIcon[row.original.objectType],
            class: "text-primary size-5",
          }),
          h("span", { class: "capitalize font-medium text-highlighted" }, row.original.objectType),
        ]);
      },
    },
    {
      id: "rangeId",
      key: "rangeId",
      header: "RANGE",
      cell: ({ row }) => h(ULink, {
        to: "/dashboard",
        class: "font-mono text-muted font-medium hover:text-primary hover:underline truncate transition-colors block",
      }, () => getRangeName(row.original.rangeId)),
    },
    {
      id: "assignedTo",
      key: "assignedTo",
      header: "ASSIGNED TO",
      cell: ({ row }) => h("p", { class: "font-medium text-default" }, row.original.assignedTo),
    },
    {
      id: "status",
      key: "status",
      header: "STATUS",
      cell: ({ row }) => h(UBadge, {
        color: statusColor(row.original.status),
        variant: "subtle",
        size: "md",
      }, () => row.original.status),
    },
    {
      id: "actions",
      key: "actions",
      header: "ACTIONS",
      cell: ({ row }) => h(UButton, {
        size: "sm",
        icon: "i-lucide-notebook-pen",
        variant: "ghost",
        disabled: row.original.status === "released",
        onClick: () => {},
      }),
    },
  ]);

  return {
    columns,
    getRowItems,
  };
}
