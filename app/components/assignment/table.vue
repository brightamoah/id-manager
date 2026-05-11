<script setup lang="ts">
const toast = useToast();

const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");
const ULink = resolveComponent("ULink");
const UButton = resolveComponent("UButton");

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

const { columns } = useAssignmentTable(
  UBadge,
  UIcon,
  ULink,
  UButton,
  getRangeName,
  statusColor,
);
</script>

<template>
  <div class="space-y-6 mx-aut0 py-8 max-w-6xl">
    <AssignmentHeader />

    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :data="filtered"
        :columns
        :loading="fetchStatus === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default text-muted first:border-l last:border-r',
          td: 'border-b border-default',
        }"
      >
        <template #objectId-data="{ row }">
          <span class="font-mono font-semibold text-default">
            {{ row.original.objectId }}
          </span>
        </template>

        <template #objectName-data="{ row }">
          <span
            class="block text-default text-xs truncate"
            :title="row.original.objectName"
          >
            {{ row.original.objectName }}
          </span>
        </template>

        <template #objectType-data="{ row }">
          <div class="flex items-center gap-1.5">
            <UIcon
              :name="objectTypeIcon[row.original.objectType] ?? 'i-lucide-box'"
              class="text-muted text-sm shrink-0"
            />

            <span class="bg-elevated px-1.5 py-0.5 rounded font-mono text-[10px] text-muted">
              {{ row.original.objectType }}
            </span>
          </div>
        </template>

        <template #rangeId-data="{ row }">
          <ULink
            to="/dashboard"
            class="block font-mono text-muted hover:text-default text-xs truncate transition-colors"
          >
            {{ getRangeName(row.original.rangeId) }}
          </ULink>
        </template>

        <template #assignedTo-data="{ row }">
          <span class="font-mono text-muted text-xs">{{ row.original.assignedTo }}</span>
        </template>

        <template #status-data="{ row }">
          <UBadge
            :color="statusColor(row.original.status)"
            variant="soft"
            size="xs"
          >
            {{ row.original.status }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-pencil"
              :disabled="row.original.status === 'released'"
              @click="openEdit(row.original)"
            />

            <UButton
              v-if="row.original.status !== 'released'"
              variant="ghost"
              size="xs"
              icon="i-lucide-archive"
              color="warning"
              :loading="releasingId === row.original.id"
              @click="release(row.original)"
            />
          </div>
        </template>

        <template #empty-state>
          <div class="flex flex-col justify-center items-center py-12 font-mono text-muted text-sm">
            <UIcon
              name="i-lucide-clipboard-x"
              class="mb-2 text-3xl"
            />

            <p>No assignments found</p>
          </div>
        </template>

        <template #loading-state>
          <div class="flex flex-col justify-center items-center py-12">
            <UIcon
              name="i-lucide-loader"
              class="size-16 text-muted animate-spin"
            />
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
