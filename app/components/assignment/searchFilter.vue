<script lang="ts" setup>
defineProps<{
  typeItems: { label: string; value: string }[];
  statusItems: { label: string; value: string }[];
}>();

const search = defineModel("search", { default: "", required: true });
const typeFilter = defineModel("typeFilter", { default: "", required: true });
const statusFilter = defineModel("statusFilter", { default: "", required: true });
</script>

<template>
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
</template>

<style scoped>

</style>
