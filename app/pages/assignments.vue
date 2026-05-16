<script setup lang="ts">
const toast = useToast();
const search = ref("");

const isMobile = inject(isMobileKey, computed(() => false));

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

const isNewModalOpen = ref(false);
const targetRangeForNew = ref<IdRange | null>(null);

function openNewAssignment() {
  const ranges = rangesResponse.value?.data ?? [];
  const defaultRange = ranges.find(r => r.status === "active") || ranges[0];

  if (defaultRange) {
    targetRangeForNew.value = defaultRange;
    isNewModalOpen.value = true;
  }
  else {
    toast.add({ title: "No ranges available", description: "Create a range first to assign IDs.", color: "error" });
  }
}

function onSaved() {
  refresh();
}
</script>

<template>
  <UContainer
    v-auto-animate
    class="space-y-6 mx-auto px-4 py-8"
  >
    <AssignmentHeader
      :is-mobile
      @create="openNewAssignment"
    />

    <AssignmentSearchFilter
      v-model:search="search"
      v-model:type-filter="typeFilter"
      v-model:status-filter="statusFilter"
      :status-items
      :type-items
    />

    <UCard :ui="{ body: 'p-0' }">
      <AssignmentTable
        ref="table"
        :fetch-status
        :assignments="filtered"
        :ranges-response
        :refresh
      />
    </UCard>

    <div v-if="tableComponent?.editingRange">
      <AssignmentModal
        v-model:open="tableComponent.assignModal"
        :range-id="tableComponent?.editingRange?.id"
        :range="tableComponent?.editingRange"
        :assignment="tableComponent?.editingAssignment"
        @saved="onSaved"
      />
    </div>

    <div v-if="targetRangeForNew">
      <AssignmentModal
        v-model:open="isNewModalOpen"
        :range-id="targetRangeForNew.id"
        :range="targetRangeForNew"
        :assignment="null"
        @saved="onSaved"
      />
    </div>
  </UContainer>
</template>
