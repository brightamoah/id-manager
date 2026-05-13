<script setup lang="ts">
const search = ref("");

const tableComponent = useTemplateRef("table");

const tableRef = computed(() => tableComponent.value?.tableRef ?? null);

const { data: rangesResponse } = await useFetch<{ data: RangeWithStats[] }>("/api/ranges", {
  key: "ranges",
  lazy: true,
  default: () => ({ data: [] }),
  getCachedData: (key, nuxtApp, ctx) => {
    if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
  },
});

const { data: assignmentResponse, refresh, status: fetchStatus } = await useFetch<AssignmentDataResponse>("/api/assignments", {
  key: "assignments",
  lazy: true,
  default: () => ({ assignments: [] }),
  getCachedData: (key, nuxtApp, ctx) => {
    if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
  },
});

const {
  typeFilter,
  statusFilter,
  typeItems,
  statusItems,
} = useAssignmentFilter(tableRef, assignmentResponse);

const assignments = computed<IdAssignment[]>(() => assignmentResponse.value?.assignments ?? []);

const filtered = computed(() => {
  let list = assignments.value;

  if (typeFilter.value && typeFilter.value !== "all") {
    list = list.filter(a => a.objectType === typeFilter.value);
  }
  if (statusFilter.value && statusFilter.value !== "all") {
    list = list.filter(a => a.status === statusFilter.value);
  }
  const q = search.value.toLowerCase();
  if (q) {
    list = list.filter(a =>
      a.objectName?.toLowerCase().includes(q)
      || a.objectType?.toLowerCase().includes(q)
      || a.assignedTo?.toLowerCase().includes(q)
      || a.status?.toLowerCase().includes(q)
      || String(a.objectId).includes(q),
    );
  }
  return list;
});

function onSaved() {
  refresh();
}
</script>

<template>
  <div class="space-y-6 mx-auto px-4 py-8 max-w-6xl">
    <AssignmentHeader />

    <AssignmentSearchFilter
      v-model:search="search"
      v-model:type-filter="typeFilter"
      v-model:status-filter="statusFilter"
      :status-items
      :type-items
    />

    <AssignmentTable
      ref="table"
      :fetch-status
      :assignments="filtered"
      :ranges-response
      :refresh
    />

    <div v-if="tableComponent?.editingRange">
      <AssignmentModal
        v-model:open="tableComponent.assignModal"
        :range-id="tableComponent?.editingRange?.id"
        :range="tableComponent?.editingRange"
        :assignment="tableComponent?.editingAssignment"
        @saved="onSaved"
      />
    </div>
  </div>
</template>
