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

const envLabel = computed(() => {
  const map: Record<string, string> = { dev: "Dev", test: "Test", prod: "Prod" };
  return map[props.range.environment] || props.range.environment;
});

const envColor = computed<ColorType>(() => {
  if (props.range.environment === "prod") return "error";
  if (props.range.environment === "test") return "warning";
  return "info";
});

const createdAtFormatted = computed(() => {
  if (!props.range.createdAt) return null;
  const date = new Date(props.range.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
});

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

          <UBadge
            v-if="range.environment"
            :color="envColor"
            variant="outline"
            size="sm"
          >
            {{ envLabel }}
          </UBadge>
        </div>

        <div class="flex flex-wrap items-center gap-3 mt-0.5 text-muted text-xs">
          <span class="flex items-center gap-1">
            <UIcon
              name="i-lucide-users"
              class="size-3.5"
            />
            {{ mapUserIdToName[range.owner] || range.owner }}
          </span>

          <span
            v-if="range.publisher"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-building-2"
              class="size-3.5"
            />
            {{ range.publisher }}
          </span>

          <span
            v-if="range.createdBy"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-user-plus"
              class="size-3.5"
            />
            {{ mapUserIdToName[range.createdBy] || 'Unknown' }}
          </span>

          <span
            v-if="createdAtFormatted"
            class="flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-clock"
              class="size-3.5"
            />
            {{ createdAtFormatted }}
          </span>

          <span
            v-if="range.description"
            class="max-w-xs truncate"
            :title="range.description"
          >
            <UIcon
              name="i-lucide-message-square"
              class="inline -mt-0.5 size-3.5"
            />
            {{ range.description }}
          </span>
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
        <span>{{ range.stats.used }} of {{ range.stats.total.toLocaleString() }} IDs used ({{ range.stats.percentUsed }}%)</span>

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
