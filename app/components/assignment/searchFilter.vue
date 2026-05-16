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
  <div class="gap-3 grid grid-cols-1 md:grid-cols-3">
    <UInput
      v-model="search"
      placeholder="Search by name, type, or assignee…"
      leading-icon="i-lucide-search"
      size="lg"
    >
      <template #trailing>
        <UButton
          v-if="search"
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="sm"
          class="sm:-mr-2 cursor-pointer"
          @click="search = ''"
        />
      </template>
    </UInput>

    <USelectMenu
      v-model="typeFilter"
      :items="typeItems"
      placeholder="Filter by type"
      value-key="value"
      label-key="label"
      size="lg"
      class="cursor-pointer"
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
      class="cursor-pointer"
      clear
      :ui="{
        item: 'cursor-pointer',
      }"
    />
  </div>
</template>

<style scoped>

</style>
