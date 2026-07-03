<script lang="ts" setup>
defineProps<{
  typeItems: { label: string; value: string }[];
  statusItems: { label: string; value: string }[];
  rangeItems?: { label: string; value: string | undefined }[];
  activeFilterCount?: number;
}>();

const emit = defineEmits<{
  clear: [];
}>();

const search = defineModel<string>("search", { default: "", required: true });
const typeFilter = defineModel<string>("typeFilter", { default: "", required: true });
const statusFilter = defineModel<string>("statusFilter", { default: "", required: true });
const rangeFilter = defineModel<string | undefined>("rangeFilter", { default: undefined });
</script>

<template>
  <div class="space-y-3">
    <UInput
      v-model="search"
      placeholder="Search by name, type, ID, or assignee…"
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
          @click="() => { search = '' }"
        />
      </template>
    </UInput>

    <div class="flex flex-wrap items-center gap-2">
      <USelectMenu
        v-model="typeFilter"
        :items="typeItems"
        placeholder="Type"
        value-key="value"
        label-key="label"
        size="md"
        class="w-36 sm:w-44 cursor-pointer"
        clear
        :ui="{ item: 'cursor-pointer' }"
      />

      <USelectMenu
        v-model="statusFilter"
        :items="statusItems"
        placeholder="Status"
        value-key="value"
        label-key="label"
        size="md"
        class="w-36 sm:w-44 cursor-pointer"
        clear
        :ui="{ item: 'cursor-pointer' }"
      />

      <USelectMenu
        v-if="rangeItems?.length"
        v-model="rangeFilter"
        :items="rangeItems"
        placeholder="Range"
        value-key="value"
        label-key="label"
        size="md"
        class="w-40 sm:w-48 cursor-pointer"
        clear
        :ui="{ item: 'cursor-pointer' }"
      />

      <UButton
        v-if="activeFilterCount && activeFilterCount > 0"
        variant="soft"
        color="neutral"
        size="md"
        icon="i-lucide-filter-x"
        :label="`Clear (${activeFilterCount})`"
        class="cursor-pointer"
        @click="emit('clear')"
      />
    </div>
  </div>
</template>
