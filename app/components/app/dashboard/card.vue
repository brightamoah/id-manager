<script lang="ts" setup>
interface CardItem {
  label: string;
  value: number | string;
  subText: string;
  color: "success" | "primary" | "info" | "warning" | "error";
  icon: string;
}

const { card, pretty = false } = defineProps<{
  card: CardItem;
  pretty?: boolean;
}>();

const colorMap: Record<string, string> = {
  success: "text-success",
  primary: "text-primary",
  info: "text-info",
  warning: "text-warning",
  error: "text-error",
};

const colorClass = computed(() => pretty ? colorMap[card.color!] : "text-default");
</script>

<template>
  <UCard
    class="shadow-sm"
    :ui="{
      body: 'p-4 md:p-5 ',
    }"
  >
    <div class="flex justify-between items-start">
      <header class="min-w-0">
        <p class="mb-1 font-semibold text-muted text-xs truncate uppercase tracking-wide">
          {{ card.label }}
        </p>

        <p
          class="font-bold text-2xl leading-none"
          :class="colorClass"
        >
          {{ card.value }}
        </p>

        <p class="mt-2 font-medium text-muted text-sm truncate">
          {{ card.subText }}
        </p>
      </header>

      <UIcon
        :name="card.icon"
        class="size-6 shrink-0"
        :class="colorClass"
      />
    </div>
  </UCard>
</template>
