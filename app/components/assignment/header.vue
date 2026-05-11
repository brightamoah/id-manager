<script setup lang="ts">
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

      <p class="text-muted text-sm">
        AL Object Registry - assignment management
      </p>
    </div>

    <UButton
      icon="i-lucide-plus"
      class="cursor-pointer"
      size="lg"
      @click="$emit('create')"
    >
      New Assignment
    </UButton>
  </div>
</template>
