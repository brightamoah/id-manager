import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";

export function useAssignmentTable(
  UBadge: ComponentType,
  UIcon: ComponentType,
  ULink: ComponentType,
  UButton: ComponentType,
  getRangeName: (id: string) => string,
  getRangeForAssignment: (rangeId: string) => IdRange | undefined,
  refresh: Refresh,
) {
  const toast = useToast();

  const assignModal = ref(false);
  const editingAssignment = ref<IdAssignment | null>(null);
  const editingRange = ref<IdRange | null>(null);

  function openEdit(a: IdAssignment) {
    editingAssignment.value = a;
    editingRange.value = getRangeForAssignment(a.rangeId) ?? null;
    assignModal.value = true;
  }

  const releasingId = ref<string | null>(null);

  async function release(a: IdAssignment) {
    releasingId.value = a.id;
    try {
      await $fetch(`/api/assignments/${a.id}/release`, { method: "POST" });
      toast.add({ title: `ID ${a.objectId} released`, color: "success" });
      await refresh();
    }
    catch (err: any) {
      toast.add({ title: "Error", description: err?.data?.message, color: "error" });
    }
    finally {
      releasingId.value = null;
    }
  }

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
            class: "size-5",
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
        color: assignmentStatusColor[row.original.status],
        variant: "subtle",
        size: "md",
      }, () => assignmentStatusMap[row.original.status]),
    },
    {
      id: "actions",
      key: "actions",
      header: "ACTIONS",
      cell: ({ row }) => h("div", { class: "flex items-center gap-2" }, [
        h(UButton, {
          size: "xs",
          icon: "i-lucide-notebook-pen",
          variant: "ghost",
          disabled: row.original.status === "released",
          class: "cursor-pointer",
          ui: {
            leadingIcon: "size-5",
          },
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          size: "xs",
          icon: "i-lucide-archive",
          variant: "ghost",
          color: "error",
          disabled: row.original.status === "released",
          class: "cursor-pointer",
          ui: {
            leadingIcon: "size-5",
          },
          onClick: () => release(row.original),
        }),
      ]),
    },
  ]);

  return {
    assignModal,
    editingAssignment,
    editingRange,
    releasingId,
    columns,
    getRowItems,
  };
}
