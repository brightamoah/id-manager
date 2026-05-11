<script setup lang="ts">
const search = defineModel<string>("search");
const status = defineModel<string>("status");

const statusOptions = [
  { label: "All status", value: "" },
  { label: "Active", value: "active" },
  { label: "Full", value: "full" },
  { label: "Deprecated", value: "deprecated" },
];
</script>

<template>
  <div class="flex gap-2">
    <UInput
      v-model="search"
      placeholder="Search..."
      icon="i-lucide-search"
      class="flex-1"
    />

    <USelect
      v-model="status"
      :items="statusOptions"
      value-key="value"
      label-key="label"
      class="w-40"
    />
  </div>
</template>
