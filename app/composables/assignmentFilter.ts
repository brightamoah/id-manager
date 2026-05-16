export function useAssignmentFilter(table: TableType<IdAssignment>, data: DataType<AssignmentDataResponse>) {
  const typeItems = [
    { label: "All types", value: "all" },
    ...OBJECT_TYPES.map(t => ({ label: t, value: t })),
  ];

  const statusItems = [
    { label: "All status", value: "all" },
    { label: "In Use", value: "in_use" },
    { label: "Reserved", value: "reserved" },
    { label: "Released", value: "released" },
  ];

  const typeFilter = ref("");
  const statusFilter = ref("");

  const {
    safeTableApi,
    updatePage,
    selectedItemsLength: selectedAssignmentsLength,
    totalItems: totalAssignments,
    currentItemShowing: currentAssignmentsShowing,
    lastItemShowing: lastAssignmentShowing,
    selectedIds: selectedAssignmentIds,
    defaultPage,
    itemsToDisplay,
    itemsPerPage,
  } = useTableFilters<IdAssignment>(table, data, "assignments");

  watch(() => [typeFilter.value, statusFilter.value], async ([newType, newStatus]) => {
    await nextTick();
    const tableApi = safeTableApi();
    if (!tableApi) return;

    const statusColumn = tableApi.getColumn?.("status");

    if (!statusColumn) return;

    if (!newStatus || newStatus === "all") statusColumn.setFilterValue(undefined);

    else statusColumn.setFilterValue(newStatus);

    const typeColumn = tableApi.getColumn?.("objectType");

    if (!typeColumn) return;

    if (!newType || newType === "all") typeColumn.setFilterValue(undefined);

    else typeColumn.setFilterValue(newType);
  }, { immediate: true });

  return {
    typeItems,
    statusItems,
    typeFilter,
    statusFilter,
    selectedAssignmentsLength,
    totalAssignments,
    currentAssignmentsShowing,
    lastAssignmentShowing,
    selectedAssignmentIds,
    defaultPage,
    itemsToDisplay,
    itemsPerPage,
    safeTableApi,
    updatePage,
  };
}
