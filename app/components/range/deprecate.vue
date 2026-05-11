<script setup lang="ts">
defineProps<{
  deprecating: boolean;
}>();

const emit = defineEmits<{
  (e: "deprecate"): void;
}>();

const openModal = ref(false);
</script>

<template>
  <AppConfirmation
    v-model:open="openModal"
    type="delete"
    title="Deprecate ID Range"
    description="Are you sure you want to deprecate this ID range? This action cannot be undone."
    :confirm-loading="deprecating"
    confirm-label="Deprecate"

    @confirm="emit('deprecate')"
  >
    <UButton
      variant="ghost"
      size="sm"
      icon="i-lucide-archive"
      color="error"
      class="cursor-pointer"
      :loading="deprecating"
    />
  </AppConfirmation>
</template>

<style scoped>

</style>
