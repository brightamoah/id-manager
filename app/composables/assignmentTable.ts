import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/table-core";

function summarize<T>(
  subRows: Row<IdAssignment>[],
  getter: (r: IdAssignment) => T,
  format: (v: T) => string,
  limit = 2,
): string {
  const unique = [...new Set(subRows.map(r => format(getter(r.original))))];
  if (unique.length <= limit) return unique.join(", ");
  return `${unique.slice(0, limit).join(", ")}…`;
}

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
  const { mapUserIdToName } = useUsers();

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
      { type: "label", label: "Actions" },
      { label: "View user details", icon: "i-lucide-eye", onSelect: () => { } },
      {
        label: "Edit assignment",
        icon: "i-lucide-pencil",
        disabled: assignment.status === "released",
        onSelect: () => { },
      },
      {
        label: "Release ID",
        icon: "i-lucide-archive",
        disabled: assignment.status === "released",
        onSelect: () => { },
      },
    ];
  };

  const columns = computed<TableColumn<IdAssignment>[]>(() => [
    {
      id: "id",
      header: "ID",
      accessorFn: row => row.objectId,
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          return h("div", { class: "flex items-center gap-1" }, [
            h(UButton, {
              size: "xs",
              variant: "link",
              square: true,
              icon: row.getIsExpanded()
                ? "i-lucide-chevron-down"
                : "i-lucide-chevron-right",
              class: "cursor-pointer",
              ui: { leadingIcon: "size-6" },
              onClick: () => row.toggleExpanded(),
            }),
            h("span", { class: "font-semibold text-default" }, String(row.getValue("id"))),
            h(UBadge, {
              variant: "subtle",
              size: "sm",
              class: "ml-1",
            }, () => `${row.subRows.length}`),
          ]);
        }
        return h("p", { class: "font-semibold text-default pl-9" }, row.original.objectId);
      },
    },
    {
      id: "objectName",
      header: "OBJECT NAME",
      accessorFn: row => row.objectName,
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          const summary = summarize(row.subRows, r => r.objectName, v => v);
          return h("p", {
            class: "text-muted text-sm truncate max-w-[180px]",
            title: row.subRows.map(r => r.original.objectName).join(", "),
          }, summary);
        }
        return h("p", { class: "text-capitalize text-default" }, row.original.objectName);
      },
    },
    {
      id: "objectType",
      header: "OBJECT TYPE",
      accessorFn: row => row.objectType,
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          const uniqueTypes = [...new Set(row.subRows.map(r => r.original.objectType))];
          const visible = uniqueTypes.slice(0, 2);
          const extra = uniqueTypes.length - visible.length;
          return h("div", {
            class: "flex items-center gap-1 flex-wrap",
            title: uniqueTypes.join(", "),
          }, [
            ...visible.map(type =>
              h("div", { class: "flex items-center gap-1", key: type }, [
                h(UIcon, { name: objectTypeIcon[type], class: "size-4 text-muted" }),
                h("span", { class: "capitalize text-muted text-sm" }, type),
              ]),
            ),
            extra > 0
              ? h("span", { class: "text-muted text-xs" }, `+${extra}`)
              : null,
          ]);
        };
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
      header: "RANGE",
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          const summary = summarize(
            row.subRows,
            r => r.rangeId,
            rangeId => getRangeName(rangeId),
          );
          return h("p", {
            class: "font-mono text-muted text-sm italic truncate max-w-[180px]",
            title: row.subRows.map(r => getRangeName(r.original.rangeId)).join(", "),
          }, summary);
        }
        return h(ULink, {
          to: "/dashboard",
          class: "font-mono text-muted font-medium hover:text-primary hover:underline truncate transition-colors block",
        }, () => getRangeName(row.original.rangeId));
      },
    },
    {
      id: "assignedTo",
      header: "ASSIGNED TO",
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          if (row.getIsGrouped()) {
            const summary = summarize(row.subRows, r => r.assignedTo, v => v);
            return h("p", {
              class: "text-muted text-sm italic truncate max-w-[180px]",
              title: row.subRows.map(r => r.original.assignedTo).join(", "),
            }, mapUserIdToName.value[summary]);
          }
        }
        return h("p", { class: "font-medium text-default" }, mapUserIdToName.value[row.original.assignedTo]);
      },
    },
    {
      id: "status",
      header: "STATUS",
      accessorFn: (row) => {
        const status = row.status;
        if (!status) return "N/A";
        return `${status} ${assignmentStatusMap[status]?.toLocaleLowerCase()}`;
      },
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          const uniqueStatuses = [...new Set(row.subRows.map(r => r.original.status))];
          const visible = uniqueStatuses.slice(0, 2);
          const extra = uniqueStatuses.length - visible.length;
          return h("div", { class: "flex items-center gap-1 flex-wrap" }, [
            ...visible.map(status =>
              h(UBadge, {
                key: status,
                color: assignmentStatusColor[status],
                variant: "subtle",
                size: "md",
              }, () => assignmentStatusMap[status]),
            ),
            extra > 0
              ? h(UBadge, {
                  variant: "subtle",
                  size: "md",
                }, () => `+${extra} more`)
              : null,
          ]);
        }
        return h(UBadge, {
          color: assignmentStatusColor[row.original.status],
          variant: "subtle",
          size: "md",
        }, () => assignmentStatusMap[row.original.status]);
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          return h(UButton, {
            size: "sm",
            variant: "ghost",
            icon: row.getIsExpanded() ? "i-lucide-chevron-up" : "i-lucide-chevron-down",
            label: row.getIsExpanded() ? "Collapse" : "Expand",
            class: "cursor-pointer text-muted",
            onClick: () => row.toggleExpanded(),
          });
        }
        return h("div", { class: "flex items-center gap-2" }, [
          h(UButton, {
            size: "xs",
            icon: "i-lucide-notebook-pen",
            variant: "ghost",
            disabled: row.original.status === "released",
            class: "cursor-pointer",
            ui: { leadingIcon: "size-5" },
            onClick: () => openEdit(row.original),
          }),
          h(UButton, {
            size: "xs",
            icon: "i-lucide-archive",
            variant: "ghost",
            color: "error",
            disabled: row.original.status === "released",
            class: "cursor-pointer",
            ui: { leadingIcon: "size-5" },
            onClick: () => release(row.original),
          }),
        ]);
      },
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
