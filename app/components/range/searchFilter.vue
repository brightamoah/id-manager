<script setup lang="ts">
const {
  statusOptions,
  environmentOptions,
  sortOptions,
  activeFilterCount,
} = defineProps<{
  statusOptions: { label: string; value: string | undefined }[];
  environmentOptions: { label: string; value: string | undefined }[];
  sortOptions: { label: string; value: string }[];
  activeFilterCount: number;
}>();

const emit = defineEmits<{
  (e: "clear"): void;
}>();

const search = defineModel<string>("search", { required: true });
const statusFilter = defineModel<string | undefined>("statusFilter", { required: true });
const environmentFilter = defineModel<string | undefined>("environmentFilter", { required: true });
const sortBy = defineModel<string>("sortBy", { required: true });
</script>

<template>
  <div
    v-auto-animate
    class="gap-3 grid grid-cols-2 lg:grid-cols-7"
  >
    <UInput
      v-model="search"
      placeholder="Search ranges…"
      icon="i-lucide-search"
      size="md"
      class="col-span-2 w-full"
    >
      <template #trailing>
        <UButton
          v-if="search"
          icon="i-lucide-x"
          variant="ghost"
          color="neutral"
          size="sm"
          class="-mr-2 cursor-pointer"
          @click="() => { search = '' }"
        />
      </template>
    </UInput>

    <USelectMenu
      v-model="statusFilter"
      :items="statusOptions"
      placeholder="Status"
      value-key="value"
      label-key="label"
      size="md"
      clear
      class="col-span-1 w-full cursor-pointer"
      :ui="{ item: 'cursor-pointer' }"
    />

    <USelectMenu
      v-model="environmentFilter"
      :items="environmentOptions"
      placeholder="Environment"
      value-key="value"
      label-key="label"
      size="md"
      clear
      class="col-span-1 w-full cursor-pointer"
      :ui="{ item: 'cursor-pointer' }"
    />

    <USelectMenu
      v-model="sortBy"
      :items="sortOptions"
      placeholder="Sort by"
      value-key="value"
      label-key="label"
      size="md"
      clear
      class="col-span-1 w-full cursor-pointer"
      :ui="{ item: 'cursor-pointer' }"
    />

    <div class="flex flex-wrap gap-2 col-span-2">
      <UButton
        v-if="activeFilterCount > 0"
        variant="subtle"
        color="neutral"
        size="md"
        icon="i-lucide-filter-x"
        :label="`Clear (${activeFilterCount})`"
        class="cursor-pointer"
        @click="emit('clear')"
      />

      <slot name="refresh" />
    </div>
  </div>
</template>
