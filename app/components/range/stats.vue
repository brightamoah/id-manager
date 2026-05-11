<script setup lang="ts">
defineProps<{
  stats: {
    total: number;
    active: number;
    assigned: number;
    avail: number;
  };
}>();
</script>

<template>
  <div class="gap-3 grid grid-cols-2 sm:grid-cols-4">
    <UCard
      v-for="stat in [
        { label: 'Total Ranges', value: stats.total },
        { label: 'Active', value: stats.active },
        { label: 'IDs Assigned', value: stats.assigned },
        { label: 'Available', value: stats.avail },
      ]"
      :key="stat.label"
      class="text-center"
    >
      <div class="font-mono text-xs uppercase">
        {{ stat.label }}
      </div>

      <div class="font-semibold text-2xl">
        {{ stat.value }}
      </div>
    </UCard>
  </div>
</template>
