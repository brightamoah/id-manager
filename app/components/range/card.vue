<script setup lang="ts">
import type { ColorType, IdAssignment, IdRange, RangeUsageStats } from "~~/shared/types";

interface RangeWithStats extends IdRange {
  stats: RangeUsageStats;
}

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

const toast = useToast();
const expanded = ref(false);
const assignments = ref<IdAssignment[]>([]);
const loadingAssignments = ref(false);

async function toggleExpand() {
  expanded.value = !expanded.value;
  if (expanded.value && !assignments.value.length) {
    loadingAssignments.value = true;
    try {
      const { data } = await useFetch<{ assignments: IdAssignment[] }>(`/api/assignments/${props.range.id}`, {
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
  const { data } = await useFetch<{ assignments: IdAssignment[] }>(`/api/assignments/${props.range.id}`, {
    getCachedData: (key, nuxtApp, ctx) => {
      if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
    },
  });

  assignments.value = data.value?.assignments ?? [];
}


function statusColor(s: string) {
  return s === "in_use" ? "success" : s === "reserved" ? "info" : "neutral";
}

const assignModal = ref(false);
const editingAssignment = ref<IdAssignment | null>(null);

function openNewAssignment() {
  editingAssignment.value = null;
  assignModal.value = true;
}

function openEditAssignment(a: IdAssignment) {
  editingAssignment.value = a;
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
            variant="soft"
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
            {{ range.owner }}
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
          <div class="gap-2 grid grid-cols-[72px_1fr_110px_110px_90px_80px] bg-elevated px-4 py-2 font-mono text-[10px] text-muted uppercase tracking-wider">
            <span>ID</span>

            <span>Object Name</span>

            <span>Type</span>

            <span>Assigned To</span>

            <span>Status</span>

            <span>Actions</span>
          </div>

          <div
            v-if="!assignments.length"
            class="px-4 py-4 font-mono text-muted text-xs"
          >
            No assignments yet —
            <UButton
              variant="link"
              size="xs"
              class="underline cursor-pointer"
              @click="openNewAssignment"
            >
              assign first ID
            </UButton>
          </div>

          <AssignmentRow
            v-for="a in assignments"
            :key="a.id"
            :assignment="a"
            :icon="objectTypeIcon[a.objectType] ?? 'i-lucide-box'"
            :status-color="statusColor(a.status)"
            @edit="openEditAssignment(a)"
            @released="refreshAssignments"
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
    :range
    :assignment="editingAssignment"
    @saved="onAssignmentSaved"
  />
</template>

<style scoped>

</style>
