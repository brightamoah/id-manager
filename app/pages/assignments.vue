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

const rangeFilter = ref<string | undefined>(undefined);

const rangeItems = computed(() => {
  const ranges = rangesResponse.value?.data ?? [];
  return [
    { label: "All ranges", value: undefined },
    ...ranges.map(r => ({ label: r.name, value: r.id })),
  ];
});

const assignments = computed<IdAssignment[]>(() => assignmentResponse.value?.assignments ?? []);

const filtered = computed(() => {
  let list = assignments.value;

  if (typeFilter.value && typeFilter.value !== "all") {
    list = list.filter(a => a.objectType === typeFilter.value);
  }
  if (statusFilter.value && statusFilter.value !== "all") {
    list = list.filter(a => a.status === statusFilter.value);
  }
  if (rangeFilter.value) {
    list = list.filter(a => a.rangeId === rangeFilter.value);
  }
  const q = search.value.toLowerCase();
  if (q) {
    list = list.filter(a =>
      a.objectName?.toLowerCase().includes(q)
      || a.objectType?.toLowerCase().includes(q)
      || a.assignedTo?.toLowerCase().includes(q)
      || a.status?.toLowerCase().includes(q)
      || String(a.objectId).includes(q)
      || a.notes?.toLowerCase().includes(q),
    );
  }
  return list;
});

// Pagination
const page = ref(1);
const itemsPerPage = 20;

const totalPages = computed(() => Math.ceil(filtered.value.length / itemsPerPage));

const paginatedAssignments = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return filtered.value.slice(start, start + itemsPerPage);
});

const showingFrom = computed(() => {
  if (!filtered.value.length) return 0;
  return (page.value - 1) * itemsPerPage + 1;
});

const showingTo = computed(() => Math.min(page.value * itemsPerPage, filtered.value.length));

const activeFilterCount = computed(() => {
  let count = 0;
  if (search.value) count++;
  if (typeFilter.value && typeFilter.value !== "all") count++;
  if (statusFilter.value && statusFilter.value !== "all") count++;
  if (rangeFilter.value) count++;
  return count;
});

function clearFilters() {
  search.value = "";
  typeFilter.value = "";
  statusFilter.value = "";
  rangeFilter.value = undefined;
}

// Reset page when filters change
watch([search, typeFilter, statusFilter, rangeFilter], () => {
  page.value = 1;
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

    <div class="space-y-3">
      <AssignmentSearchFilter
        v-model:search="search"
        v-model:type-filter="typeFilter"
        v-model:status-filter="statusFilter"
        v-model:range-filter="rangeFilter"
        :status-items
        :type-items
        :range-items
        :active-filter-count
        @clear="clearFilters"
      />
    </div>

    <!-- Results count -->
    <div
      v-if="filtered.length"
      class="flex justify-between items-center text-muted text-sm"
    >
      <span>
        Showing {{ showingFrom }}–{{ showingTo }} of {{ filtered.length }} assignment{{ filtered.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <AssignmentTable
        ref="table"
        :fetch-status
        :assignments="paginatedAssignments"
        :ranges-response
        :refresh
      />
    </UCard>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex justify-center pt-2"
    >
      <UPagination
        v-model:page="page"
        :total="filtered.length"
        :items-per-page="itemsPerPage"
      />
    </div>

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
