<script setup lang="ts">
import type { IdRange, RangeUsageStats } from "~~/shared/types";

interface RangeWithStats extends IdRange {
  stats?: RangeUsageStats;
}

const toast = useToast();

const { data: ranges, refresh, status } = await useFetch<IdRange[]>("/api/ranges", {
  default: () => [],
});

const rangesWithStats = ref<RangeWithStats[]>([]);

async function loadStats() {
  if (!ranges.value?.length) return;

  const results = await Promise.all(
    ranges.value.map(async (r) => {
      try {
        const res = await $fetch<IdRange & { stats: RangeUsageStats }>(
          `/api/ranges/${r.id}`,
        );

        return {
          ...r,
          stats: res.stats,
        };
      }
      catch {
        return r;
      }
    }),
  );

  rangesWithStats.value = results;
}

watch(ranges, loadStats, { immediate: true });

const search = ref("");
const statusFilter = ref("");

const filtered = computed(() => {
  return rangesWithStats.value.filter((r) => {
    const q = search.value.toLowerCase();

    const matchQ
      = !q
        || r.name.toLowerCase().includes(q)
        || r.owner.toLowerCase().includes(q);

    const matchS
      = !statusFilter.value
        || r.status === statusFilter.value;

    return matchQ && matchS;
  });
});

const totalStats = computed(() => {
  const total = rangesWithStats.value.length;

  const active = rangesWithStats.value
    .filter(r => r.status === "active")
    .length;

  const assigned = rangesWithStats.value
    .reduce((n, r) => n + (r.stats?.used ?? 0), 0);

  const avail = rangesWithStats.value
    .filter(r => r.status !== "deprecated")
    .reduce(
      (n, r) =>
        n + ((r.stats?.total ?? 0) - (r.stats?.used ?? 0)),
      0,
    );

  return {
    total,
    active,
    assigned,
    avail,
  };
});

const isOpen = ref(false);
const isEditing = ref(false);
const saving = ref(false);

function defaultForm() {
  return {
    id: "",
    name: "",
    owner: "",
    startId: undefined as number | undefined,
    endId: undefined as number | undefined,
    description: "",
  };
}

const form = ref(defaultForm());

function openCreate() {
  isEditing.value = false;
  form.value = defaultForm();
  isOpen.value = true;
}

function openEdit(range: IdRange) {
  isEditing.value = true;

  form.value = {
    id: range.id,
    name: range.name ?? "",
    owner: range.owner,
    startId: range.startId,
    endId: range.endId,
    description: range.description ?? "",
  };

  isOpen.value = true;
}

async function save() {
  saving.value = true;

  try {
    if (isEditing.value) {
      await $fetch(`/api/ranges/${form.value.id}`, {
        method: "PATCH",
        body: form.value,
      });
    }
    else {
      await $fetch("/api/ranges", {
        method: "POST",
        body: form.value,
      });
    }

    toast.add({
      title: isEditing.value
        ? "Range updated"
        : "Range created",
      color: "success",
    });

    isOpen.value = false;

    await refresh();
  }
  catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message,
      color: "error",
    });
  }
  finally {
    saving.value = false;
  }
}

const deprecatingId = ref<string | null>(null);

async function deprecate(range: IdRange) {
  deprecatingId.value = range.id;

  try {
    await $fetch(`/api/ranges/${range.id}`, {
      method: "DELETE",
    });

    toast.add({
      title: `"${range.name}" deprecated`,
      color: "warning",
    });

    await refresh();
  }
  finally {
    deprecatingId.value = null;
  }
}
</script>

<template>
  <div class="space-y-6 mx-auto px-4 py-8 max-w-5xl">
    <RangeHeader @create="openCreate" />

    <RangeStats :stats="totalStats" />

    <RangeFilters
      v-model:search="search"
      v-model:status="statusFilter"
    />

    <RangeList
      :ranges="filtered"
      :loading="status === 'pending'"
      :deprecating-id="deprecatingId"
      @edit="openEdit"
      @deprecate="deprecate"
    />

    <RangeFormModal
      v-model:open="isOpen"
      :editing="isEditing"
      :saving="saving"
      :form="form"
      @save="save"
    />
  </div>
</template>
