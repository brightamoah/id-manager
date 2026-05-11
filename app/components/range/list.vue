<script setup lang="ts">
import type { IdRange, RangeUsageStats } from "~~/shared/types";

interface RangeWithStats extends IdRange {
  stats?: RangeUsageStats;
}

defineProps<{
  ranges: RangeWithStats[];
  loading: boolean;
  deprecatingId: string | null;
}>();

defineEmits<{
  edit: [range: RangeWithStats];
  deprecate: [range: RangeWithStats];
}>();
</script>

<template>
  <div
    v-if="loading"
    class="py-12 text-center"
  >
    Loading...
  </div>

  <div
    v-else-if="!ranges.length"
    class="py-12 text-center"
  >
    No ranges found
  </div>

  <div
    v-else
    class="space-y-3"
  >
    <RangeCard
      v-for="range in ranges"
      :key="range.id"
      :range="range"
      :deprecating="deprecatingId === range.id"
      @edit="$emit('edit', range)"
      @deprecate="$emit('deprecate', range)"
    />
  </div>
</template>
