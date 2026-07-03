<script setup lang="ts">
type Variant = "link" | "outline" | "solid" | "soft" | "subtle" | "ghost" | undefined;

const {
  variant = "outline",
  color = "primary",
  label = "Refresh",
  refreshIsLoading,
  canResend,
  coolDownTime,
  handleRefresh,
} = defineProps<{
  refreshIsLoading: boolean;
  canResend: boolean;
  coolDownTime: number;
  variant?: Variant;
  color?: ColorType;
  handleRefresh: () => Promise<boolean>;
  label?: string;
}>();

const buttonLabel = computed(() => {
  return refreshIsLoading
    ? `${label}...`
    : canResend
      ? label
      : `Wait ${coolDownTime}s`;
});
</script>

<template>
  <UButton
    :label="buttonLabel"
    icon="i-lucide-refresh-cw"
    :loading="refreshIsLoading"
    :disabled="!canResend || refreshIsLoading"
    size="md"
    :variant
    :color
    class="justify-center items-center md:min-w-[13ch] tabular-nums text-center cursor-pointer"
    @click="() => { handleRefresh() }"
  />
</template>

<style scoped>

</style>
