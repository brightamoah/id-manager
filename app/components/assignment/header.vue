<script setup lang="ts">
defineProps<{
  isMobile: boolean;
}>();

defineEmits<{
  create: [];
}>();
</script>

<template>
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-semibold text-xl">
        All Assignments
      </h1>

      <p
        v-if="!isMobile"
        class="text-muted text-sm"
      >
        AL Object Registry - assignment management
      </p>
    </div>

    <UButton
      class="flex text-center cursor-pointer"
      size="lg"
      @click="$emit('create')"
    >
      <p class="flex justify-center items-center gap-2">
        <UIcon
          name="i-lucide-plus"
          class="size-4 font-bold"
        />

        <span v-if="!isMobile">New Assignment</span>
      </p>
    </UButton>
  </div>
</template>
