<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

const isMobile = inject(isMobileKey, computed(() => false));

const { data: response, refresh, status } = await useFetch<{ data: RangeWithStats[] }>("/api/ranges", {
  key: "ranges",
  default: () => ({ data: [] }),
  getCachedData: (key, nuxtApp, ctx) => {
    if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
  },
});

const { mapUserIdToName } = useUsers();

const rangesWithStats = computed<RangeWithStats[]>(() => response.value?.data ?? []);

// --- Search & Filters ---
const search = ref("");
const statusFilter = ref<string | undefined>(undefined);
const environmentFilter = ref<string | undefined>(undefined);
const sortBy = ref<string>("name");

const statusOptions = [
  { label: "All status", value: undefined },
  { label: "Active", value: "active" },
  { label: "Full", value: "full" },
  { label: "Deprecated", value: "deprecated" },
];

const environmentOptions = [
  { label: "All environments", value: undefined },
  { label: "Development", value: "dev" },
  { label: "Test", value: "test" },
  { label: "Production", value: "prod" },
];

const sortOptions = [
  { label: "Name (A–Z)", value: "name" },
  { label: "Usage %", value: "usage" },
  { label: "Date created", value: "created" },
  { label: "ID range", value: "startId" },
];

const activeFilterCount = computed(() => {
  let count = 0;
  if (search.value) count++;
  if (statusFilter.value) count++;
  if (environmentFilter.value) count++;
  return count;
});

function clearFilters() {
  search.value = "";
  statusFilter.value = undefined;
  environmentFilter.value = undefined;
}

const filtered = computed(() => {
  let list = rangesWithStats.value.filter((r) => {
    const q = search.value.toLowerCase();
    const matchQ = !q
      || r.name.toLowerCase().includes(q)
      || mapUserIdToName.value[r.owner]?.toLowerCase().includes(q)
      || r.description?.toLowerCase().includes(q)
      || r.publisher?.toLowerCase().includes(q)
      || r.environment?.toLowerCase().includes(q)
      || String(r.startId).includes(q)
      || String(r.endId).includes(q);
    const matchS = !statusFilter.value || r.status === statusFilter.value;
    const matchE = !environmentFilter.value || r.environment === environmentFilter.value;
    return matchQ && matchS && matchE;
  });

  // Sort
  const key = sortBy.value;
  list = [...list].sort((a, b) => {
    if (key === "name") return a.name.localeCompare(b.name);
    if (key === "usage") return b.stats.percentUsed - a.stats.percentUsed;
    if (key === "created") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (key === "startId") return a.startId - b.startId;
    return 0;
  });

  return list;
});

const page = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() => Math.ceil(filtered.value.length / itemsPerPage));

const paginatedRanges = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  return filtered.value.slice(start, start + itemsPerPage);
});

const showingFrom = computed(() => {
  if (!filtered.value.length) return 0;
  return (page.value - 1) * itemsPerPage + 1;
});

const showingTo = computed(() => Math.min(page.value * itemsPerPage, filtered.value.length));

// Reset page when filters change
watch([search, statusFilter, environmentFilter, sortBy], () => {
  page.value = 1;
});

// --- Stats ---
const totalStats = computed(() => {
  const all = rangesWithStats.value;
  return {
    total: all.length,
    active: all.filter(r => r.status === "active").length,
    assigned: all.reduce((n, r) => n + r.stats.used, 0),
    available: all
      .filter(r => r.status !== "deprecated")
      .reduce((n, r) => n + (r.stats.total - r.stats.used), 0),
  };
});

const cardItems = computed<CardItem[]>(() => [
  {
    label: "Total Ranges",
    value: totalStats.value.total ?? 0,
    subText: "registered",
    color: "success",
    icon: "i-lucide-layers",
  },
  {
    label: "Active",
    value: totalStats.value.active ?? 0,
    subText: "in use",
    color: "primary",
    icon: "i-lucide-activity",
  },
  {
    label: "IDs Assigned",
    value: totalStats.value.assigned ?? 0,
    subText: "across all ranges",
    color: "info",
    icon: "i-lucide-square-check",
  },
  {
    label: "Available",
    value: totalStats.value.available ?? 0,
    subText: "Remaining",
    color: "warning",
    icon: "i-lucide-square-minus",
  },
]);

// --- Range Store ---
const store = useRangeStore();

const {
  form,
  isOpen,
  modalTitle,
  deprecatingId,
  isEditing,
  saving,
  overlapConflict,
} = storeToRefs(store);

const {
  openCreate,
  openEdit,
  deprecate,
  save,
  clearOverlapConflict,
} = store;

async function saveItem(event: FormSubmitEvent<RangeFormSchema>) {
  await save(event, refresh);
}

async function deprecateItem(range: RangeWithStats) {
  await deprecate(range, refresh);
}

const {
  canResend,
  coolDownTime,
  isLoading: refreshIsLoading,
  handleRefresh,
} = useDataRefresh(
  "rangesRefresh",
  "Ranges",
  refresh,
);
</script>

<template>
  <UContainer
    v-auto-animate
    class="space-y-6 mx-auto py-8"
  >
    <RangeHeader
      :is-mobile
      @click="openCreate"
    />

    <div class="gap-4 grid grid-cols-2 sm:grid-cols-4">
      <AppDashboardCard
        v-for="card in cardItems"
        :key="card.label"
        :card
        :label="card.label"
        :value="card.value"
        :icon="card.icon"
        :color="card.color"
        :sub-text="card.subText"
        class="w-full"
      />
    </div>

    <RangeSearchFilter
      v-model:search="search"
      v-model:status-filter="statusFilter"
      v-model:environment-filter="environmentFilter"
      v-model:sort-by="sortBy"
      :status-options="statusOptions"
      :environment-options="environmentOptions"
      :sort-options="sortOptions"
      :active-filter-count="activeFilterCount"
      @clear="clearFilters"
    >
      <template #refresh>
        <AppRefresh
          :can-resend
          :cool-down-time
          :refresh-is-loading
          :handle-refresh
        />
      </template>
    </RangeSearchFilter>

    <div
      v-if="status === 'pending'"
      class="py-12 font-mono text-muted text-xs text-center"
    >
      <UIcon
        name="i-lucide-loader"
        class="block mx-auto mb-4 size-16 text-muted text-2xl animate-spin"
      />
      Fetching ranges…
    </div>

    <div
      v-else-if="!filtered.length"
      class="py-12 font-mono text-muted text-sm text-center"
    >
      <UIcon
        name="i-lucide-database-zap"
        class="block mx-auto mb-2 size-20 text-3xl"
      />
      No ranges found
    </div>

    <template v-else>
      <div class="flex justify-between items-center text-muted text-sm">
        <span>
          Showing {{ showingFrom }}–{{ showingTo }} of {{ filtered.length }} range{{ filtered.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div
        v-auto-animate
        class="space-y-3"
      >
        <RangeCard
          v-for="range in paginatedRanges"
          :key="range.id"
          :range="range"
          :deprecating="deprecatingId === range.id"
          :progress-color="progressColor(range.stats.percentUsed, range.status)"
          :range-badge-color="statusColor(range.status)"
          @edit="openEdit(range)"
          @deprecate="deprecateItem(range)"
        />
      </div>

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
    </template>

    <RangeModal
      v-model:state="form"
      v-model:open="isOpen"
      :overlap-conflict
      :is-editing
      :saving
      :modal-title
      @clear-overlap="clearOverlapConflict"
      @save="saveItem($event)"
    />
  </UContainer>
</template>
