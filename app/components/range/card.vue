<script setup lang="ts">
const props = defineProps<{
  range: RangeWithStats;
  deprecating: boolean;
  progressColor: ColorType;
  rangeBadgeColor: ColorType;
}>();

const emit = defineEmits<{
  edit: [];
  deprecate: [];
}>();

const { mapUserIdToName } = useUsers();

const toast = useToast();
const expanded = ref(false);
const assignments = ref<IdAssignment[]>([]);
const loadingAssignments = ref(false);

const tableComponent = useTemplateRef("table");

async function toggleExpand() {
  expanded.value = !expanded.value;
  if (expanded.value && !assignments.value.length) {
    loadingAssignments.value = true;
    try {
      const { data } = await useFetch<AssignmentDataResponse>(`/api/assignments/${props.range.id}`, {
        getCachedData: (key, nuxtApp, ctx) => {
          if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
          return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
        },
      });

      assignments.value = data.value?.assignments ?? [];
    }
    catch {
      toast.add({ title: "Failed to load assignments", color: "error" });
    }
    finally {
      loadingAssignments.value = false;
    }
  }
}

async function refreshAssignments() {
  if (!expanded.value) return;
  const { data } = await useFetch<AssignmentDataResponse>(`/api/assignments/${props.range.id}`, {
    getCachedData: (key, nuxtApp, ctx) => {
      if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
    },
  });

  assignments.value = data.value?.assignments ?? [];
}

const assignModal = ref(false);
const editingAssignment = ref<IdAssignment | null>(null);
const prefilledObjectId = ref<number | undefined>(undefined);

function openNewAssignment() {
  editingAssignment.value = null;
  prefilledObjectId.value = undefined;
  assignModal.value = true;
}

async function onAssignmentSaved() {
  assignModal.value = false;
  await refreshAssignments();
}
</script>

<template>
  <UCard
    class="overflow-hidden transition-all"
    :ui="{
      body: 'p-2 sm:p-2',
    }"
  >
    <div class="flex items-start gap-3 p-2">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <span class="bg-elevated p-0.5 rounded font-semibold text-toned text-xs">
            {{ range.startId }} – {{ range.endId }}
          </span>

          <span class="font-semibold text-default text-sm">{{ range.name }}</span>

          <UBadge
            :color="rangeBadgeColor"
            variant="subtle"
            size="sm"
          >
            {{ range.status }}
          </UBadge>
        </div>

        <div class="flex items-center gap-3 mt-0.5 font-mono text-muted text-xs">
          <span class="flex items-center gap-1">
            <UIcon
              name="i-lucide-users"
              class="size-4"
            />
            {{ mapUserIdToName[range.owner] }}
          </span>

          <span
            v-if="range.description"
            class="max-w-xs truncate"
          >{{ range.description }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <UButton
          variant="ghost"
          size="sm"
          :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          :label="`${range.stats.used} obj${range.stats.used !== 1 ? 's' : ''}`"
          class="text-sm cursor-pointer"
          :ui="{
            leadingIcon: 'size-5',
          }"
          @click="toggleExpand"
        />

        <UTooltip
          arrow
          text="Edit range details"
        >
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-pencil"
            class="cursor-pointer"
            @click="emit('edit')"
          />
        </UTooltip>

        <UTooltip
          v-if="range.status !== 'deprecated'"
          arrow
          text="Deprecate range"
        >
          <RangeDeprecate
            :deprecating
            @deprecate="emit('deprecate')"
          />
        </UTooltip>
      </div>
    </div>

    <div class="px-4 pb-1">
      <div class="flex justify-between mb-1 font-mono text-[10px] text-muted">
        <span>{{ range.stats.percentUsed }}% used · {{ range.stats.total.toLocaleString() }} total IDs</span>

        <span>
          {{ range.stats.used }} in use ·
          {{ range.stats.reserved }} reserved ·
          {{ range.stats.released }} released
        </span>
      </div>

      <UProgress
        :model-value="range.stats.percentUsed ?? 0"
        :color="progressColor"
        size="sm"
        class="mb-3"
      />
    </div>

    <Transition
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
    >
      <div
        v-if="expanded"
        v-auto-animate
        class="border-default border-t"
      >
        <div
          v-if="loadingAssignments"
          class="flex justify-center py-6"
        >
          <UIcon
            name="i-lucide-loader"
            class="size-6 text-muted animate-spin"
          />
        </div>

        <template v-else>
          <AssignmentTable
            ref="table"
            :fetch-status="loadingAssignments ? 'pending' : 'success'"
            :assignments="assignments"
            :ranges-response="{ data: [range] }"
            :refresh="refreshAssignments"
          />

          <div class="p-2 border-default border-t">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-plus"
              label="Add assignment"
              class="cursor-pointer"
              @click="openNewAssignment"
            />
          </div>
        </template>
      </div>
    </Transition>
  </UCard>

  <AssignmentModal
    v-model:open="assignModal"
    :range-id="range.id"
    :range="range"
    :assignment="editingAssignment"
    @saved="onAssignmentSaved"
  />

  <div v-if="tableComponent?.editingRange">
    <AssignmentModal
      v-model:open="tableComponent.assignModal"
      :range-id="tableComponent.editingRange.id"
      :range="tableComponent.editingRange"
      :assignment="tableComponent.editingAssignment"
      @saved="onAssignmentSaved"
    />
  </div>
</template>

<style scoped>

</style>
