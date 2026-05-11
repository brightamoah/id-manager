<script setup lang="ts">
const toast = useToast();

const { data: response } = await useFetch<{ data: RangeWithStats[] }>("/api/ranges", {
  key: "ranges",
  lazy: true,
  default: () => ({ data: [] }),
  getCachedData: (key, nuxtApp, ctx) => {
    if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
  },
});

const ranges = computed<IdRange[]>(() => response.value?.data ?? []);

const search = ref("");
const typeFilter = ref("");
const statusFilter = ref("");

const queryParams = computed(() => ({
  ...(typeFilter.value && { objectType: typeFilter.value }),
  ...(statusFilter.value && { status: statusFilter.value }),
}));

const assignmentsKey = computed(() => `assignments:${JSON.stringify(queryParams.value)}`);

const { data: assignmentResponse, refresh, status: fetchStatus } = await useFetch<{ assignments: IdAssignment[] }>("/api/assignments", {
  key: assignmentsKey,
  query: queryParams,
  lazy: true,
  default: () => ({ assignments: [] }),
  getCachedData: (key, nuxtApp, ctx) => {
    if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
  },
});

const assignments = computed<IdAssignment[]>(() => assignmentResponse.value?.assignments ?? []);

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return assignments.value;
  return assignments.value.filter(a =>
    a.objectName.toLowerCase().includes(q)
    || a.objectType.toLowerCase().includes(q)
    || a.assignedTo.toLowerCase().includes(q)
    || String(a.objectId).includes(q),
  );
});

const OBJECT_TYPES = [
  "Table",
  "Page",
  "Codeunit",
  "Report",
  "Enum",
  "Query",
  "XmlPort",
  "TableExtension",
  "PageExtension",
  "EnumExtension",
  "Interface",
  "PermissionSet",
  "Other",
];

const typeItems = [
  { label: "All types", value: undefined },
  ...OBJECT_TYPES.map(t => ({ label: t, value: t })),
];

const statusItems = [
  { label: "All status", value: undefined },
  { label: "In Use", value: "in_use" },
  { label: "Reserved", value: "reserved" },
  { label: "Released", value: "released" },
];

// const columns = [
//   { key: "objectId", label: "ID", class: "font-mono w-20" },
//   { key: "objectName", label: "Object Name" },
//   { key: "objectType", label: "Type", class: "w-36" },
//   { key: "range", label: "Range", class: "w-36" },
//   { key: "assignedTo", label: "Assigned To", class: "font-mono w-32" },
//   { key: "status", label: "Status", class: "w-24" },
//   { key: "actions", label: "", class: "w-20" },
// ];

function getRangeName(rangeId: string) {
  return ranges.value?.find(r => r.id === rangeId)?.name ?? rangeId;
}

function getRangeForAssignment(rangeId: string): IdRange | undefined {
  return ranges.value?.find(r => r.id === rangeId);
}

function statusColor(s: string) {
  return s === "in_use" ? "success" : s === "reserved" ? "info" : "neutral";
}

const objectTypeIcon: Record<string, string> = {
  Table: "i-lucide-table",
  Page: "i-lucide-layout",
  Codeunit: "i-lucide-code-2",
  Report: "i-lucide-file-bar-chart",
  Enum: "i-lucide-list",
  Query: "i-lucide-search-code",
  XmlPort: "i-lucide-file-code",
  TableExtension: "i-lucide-table-2",
  PageExtension: "i-lucide-layout-panel-left",
  EnumExtension: "i-lucide-list-plus",
  Interface: "i-lucide-component",
  PermissionSet: "i-lucide-shield",
  Other: "i-lucide-box",
};

// const stats = computed(() => {
//   const all = assignments.value;
//   return {
//     total: all.length,
//     inUse: all.filter(a => a.status === "in_use").length,
//     reserved: all.filter(a => a.status === "reserved").length,
//     released: all.filter(a => a.status === "released").length,
//   };
// });

const assignModal = ref(false);
const editingAssignment = ref<IdAssignment | null>(null);
const editingRange = ref<IdRange | null>(null);

watch(assignModal, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      editingRange.value = null;
      editingAssignment.value = null;
    }, 300);
  }
});

function openEdit(a: IdAssignment) {
  editingAssignment.value = a;
  editingRange.value = getRangeForAssignment(a.rangeId) ?? null;
  assignModal.value = true;
}

async function onSaved() {
  assignModal.value = false;
  await refresh();
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
</script>

<template>
  <div class="space-y-6 mx-auto px-4 py-8 max-w-6xl">
    <AssignmentHeader />

    <div class="flex flex-wrap gap-2">
      <UInput
        v-model="search"
        placeholder="Search by name, type, or assignee…"
        icon="i-lucide-search"
        size="lg"
        class="flex-1 min-w-48"
      />

      <USelectMenu
        v-model="typeFilter"
        :items="typeItems"
        placeholder="Filter by type"
        value-key="value"
        label-key="label"
        size="lg"
        class="w-40 sm:w-80 cursor-pointer"
        clear
        :ui="{
          item: 'cursor-pointer',
        }"
      />

      <USelectMenu
        v-model="statusFilter"
        :items="statusItems"
        placeholder="Filter by status"
        value-key="value"
        label-key="label"
        size="lg"
        class="w-40 sm:w-50 cursor-pointer"
        clear
        :ui="{
          item: 'cursor-pointer',
        }"
      />
    </div>

    <div
      v-if="fetchStatus === 'pending'"
      class="py-12 font-mono text-muted text-xs text-center"
    >
      <UIcon
        name="i-lucide-loader"
        class="block mx-auto mb-4 size-16 text-muted text-2xl animate-spin"
      />
    </div>
    <!-- Empty -->
    <div
      v-else-if="!filtered.length"
      class="py-12 font-mono text-muted text-sm text-center"
    >
      <UIcon
        name="i-lucide-clipboard-x"
        class="block mx-auto mb-2 text-3xl"
      />
      No assignments found
    </div>

    <!-- Table -->
    <UCard
      v-else
      :ui="{ body: 'p-0' }"
    >
      <div class="gap-2 grid grid-cols-[80px_1fr_130px_130px_120px_100px_80px] bg-elevated px-4 py-2.5 border-default border-b rounded-2xl font-mono font-semibold text-[10px] text-muted uppercase tracking-wider">
        <span>ID</span>

        <span>Object Name</span>

        <span>Type</span>

        <span>Range</span>

        <span>Assigned To</span>

        <span>Status</span>

        <span>Actions</span>
      </div>

      <div
        v-for="a in filtered"
        :key="a.id"
        class="items-center gap-2 grid grid-cols-[80px_1fr_130px_130px_120px_100px_80px] px-4 py-2.5 border-default last:border-0 border-b text-sm transition-colors"
      >
        <span class="font-mono font-semibold text-default">{{ a.objectId }}</span>

        <span
          class="text-default text-xs truncate"
          :title="a.objectName"
        >
          {{ a.objectName }}
        </span>

        <div class="flex items-center gap-1.5">
          <UIcon
            :name="objectTypeIcon[a.objectType] ?? 'i-lucide-box'"
            class="size-5 text-muted shrink-0"
          />

          <span class="bg-elevated px-1.5 py-0.5 rounded font-mono text-muted text-xs truncate">
            {{ a.objectType }}
          </span>
        </div>

        <ULink
          to="/dashboard"
          class="font-mono text-muted hover:text-default text-xs truncate transition-colors"
          :title="getRangeName(a.rangeId)"
        >
          {{ getRangeName(a.rangeId) }}
        </ULink>

        <span class="font-mono text-muted text-sm truncate">{{ a.assignedTo }}</span>

        <!-- Status -->
        <UBadge
          :color="statusColor(a.status)"
          variant="soft"
          size="xs"
        >
          {{ a.status }}
        </UBadge>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-lucide-pencil"
            :disabled="a.status === 'released'"
            @click="openEdit(a)"
          />

          <UButton
            v-if="a.status !== 'released'"
            variant="ghost"
            size="xs"
            icon="i-lucide-archive"
            color="warning"
            :loading="releasingId === a.id"
            @click="release(a)"
          />
        </div>
      </div>
    </UCard>

    <AssignmentTable />

    <div v-if="editingRange">
      <AssignmentModal
        v-model:open="assignModal"
        :range-id="editingRange.id"
        :range="editingRange"
        :assignment="editingAssignment"
        @saved="onSaved"
      />
    </div>
  </div>
</template>
