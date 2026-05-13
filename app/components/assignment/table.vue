<script setup lang="ts">
import autoAnimate from "@formkit/auto-animate";

const {
  assignments,
  rangesResponse,
  fetchStatus,
  refresh,
} = defineProps<{
  fetchStatus: Status;
  assignments: IdAssignment[];
  rangesResponse: RangeDataResponse;
  refresh: Refresh;
}>();

const search = ref("");

const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");
const ULink = resolveComponent("ULink");
const UButton = resolveComponent("UButton");

const table = useTemplateRef("tableRef");

const ranges = computed<IdRange[]>(() => rangesResponse?.data ?? []);

const assignmentsVal = computed(() => assignments);

function getRangeName(rangeId: string) {
  return ranges.value?.find(r => r.id === rangeId)?.name ?? rangeId;
}

function getRangeForAssignment(rangeId: string): IdRange | undefined {
  return ranges.value?.find(r => r.id === rangeId);
}

const {
  columns,
  assignModal,
  editingAssignment,
  editingRange,
} = useAssignmentTable(
  UBadge,
  UIcon,
  ULink,
  UButton,
  getRangeName,
  getRangeForAssignment,
  refresh,
);

watch(assignModal, (isOpen) => {
  if (!isOpen) {
    setTimeout(() => {
      editingRange.value = null;
      editingAssignment.value = null;
    }, 300);
  }
});

defineExpose({
  tableRef: table,
  assignModal,
  editingAssignment,
  editingRange,
});

onMounted(() => {
  const tbody = table.value?.$el.querySelector(".my-table-tbody");
  if (tbody instanceof HTMLElement) {
    autoAnimate(tbody);
  }
});
</script>

<template>
  <UCard :ui="{ body: 'p-0' }">
    <UTable
      ref="tableRef"
      v-model:global-filter="search"
      :data="assignmentsVal"
      :columns
      :loading="fetchStatus === 'pending'"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0 my-table-tbody',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default text-muted first:border-l last:border-r',
        td: 'border-b border-default',
      }"
    >
      <template #empty>
        <UEmpty
          variant="naked"
          icon="i-lucide-clipboard-x"
          title="No assignments found"
          size="lg"
          class="flex flex-1 justify-center items-center w-full"
          :ui="{
            avatar: 'text-3xl',
          }"
        />
      </template>
    </UTable>
  </UCard>
</template>
