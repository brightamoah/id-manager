<script setup lang="ts">
import type { GroupingOptions } from "@tanstack/vue-table";
import { getGroupedRowModel } from "@tanstack/vue-table";

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

const grouping = ["id"];
const groupingOptions = ref<GroupingOptions>({
  groupedColumnMode: "reorder",
  getGroupedRowModel: getGroupedRowModel(),
});

const tableMeta = {
  class: {
    tr: (row: any) =>
      row?.getIsGrouped()
        ? "bg-elevated/50 font-medium max-h-10"
        : "hover:bg-default/50",
  },
};

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

let observer: MutationObserver | null = null;

onMounted(() => {
  const tbody = table.value?.$el.querySelector(".my-table-tbody");
  if (!tbody) return;

  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLTableRowElement) {
          node.animate([
            { opacity: 0 },
            { opacity: 1 },
          ], { duration: 250, easing: "ease-out" });

          const cellContents = node.querySelectorAll("td > *");

          cellContents.forEach((content) => {
            content.animate([
              { opacity: 0, transform: "translateY(-12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ], {
              duration: 350,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "both",
              delay: 30,
            });
          });
        }
      });
    });
  });

  observer.observe(tbody, { childList: true });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect(); // Clean up observer
});
</script>

<template>
  <UTable
    ref="tableRef"
    v-model:global-filter="search"
    :data="assignmentsVal"
    :columns
    :loading="fetchStatus === 'pending'"
    :grouping="grouping"
    :grouping-options="groupingOptions"
    :meta="tableMeta"
    :ui="{
      base: 'table-fixed border-separate border-spacing-0',
      thead: '[&>tr]:bg-elevated [&>tr]:after:content-none',
      tbody: '[&>tr]:last:[&>td]:border-b-0 my-table-tbody [&>tr]:will-change-transform',
      th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default text-muted first:border-l last:border-r',
      td: 'border-b border-default empty:p-0',
    }"
  >
    <template #empty>
      <UEmpty
        variant="naked"
        icon="i-lucide-clipboard-x"
        title="No assignments found"
        size="lg"
        class="flex flex-1 justify-center items-center w-full"
        :ui="{ avatar: 'text-3xl' }"
      />
    </template>
  </UTable>
  <!-- </UCard> -->
</template>
