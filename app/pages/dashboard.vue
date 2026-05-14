<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";

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

const search = ref("");
const statusFilter = ref<string | undefined>(undefined);

const statusOptions = [
  { label: "All status", value: undefined },
  { label: "Active", value: "active" },
  { label: "Full", value: "full" },
  { label: "Deprecated", value: "deprecated" },
];

const filtered = computed(() => {
  return rangesWithStats.value.filter((r) => {
    const q = search.value.toLowerCase();
    const matchQ = !q || r.name.toLowerCase().includes(q) || mapUserIdToName.value[r.owner]?.toLowerCase().includes(q);
    const matchS = !statusFilter.value || r.status === statusFilter.value;
    return matchQ && matchS;
  });
});

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

const store = useRangeStore();

const {
  form,
  isOpen,
  modalTitle,
  deprecatingId,
  isEditing,
  saving,
} = storeToRefs(store);

const {
  openCreate,
  openEdit,
  deprecate,
  save,
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
    <RangeHeader @click="openCreate" />

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

    <div class="flex gap-2">
      <UInput
        v-model="search"
        placeholder="Search by name or owner…"
        icon="i-lucide-search"
        size="lg"
        class="flex-1"
      />

      <USelectMenu
        v-model="statusFilter"
        :items="statusOptions"
        size="lg"
        placeholder="Filter by status"
        value-key="value"
        label-key="label"
        class="w-40 sm:w-80 cursor-pointer"
        clear
        :ui="{
          item: 'cursor-pointer',
        }"
      />

      <AppRefresh
        :can-resend
        :cool-down-time
        :refresh-is-loading
        :handle-refresh
      />
    </div>

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

    <div
      v-else
      v-auto-animate
      class="space-y-3"
    >
      <RangeCard
        v-for="range in filtered"
        :key="range.id"
        :range="range"
        :deprecating="deprecatingId === range.id"
        :progress-color="progressColor(range.stats.percentUsed, range.status)"
        :range-badge-color="statusColor(range.status)"
        @edit="openEdit(range)"
        @deprecate="deprecateItem(range)"
      />
    </div>

    <RangeModal
      v-model:state="form"
      v-model:open="isOpen"
      :is-editing
      :saving
      :modal-title
      @save="saveItem($event)"
    />
  </UContainer>
</template>
