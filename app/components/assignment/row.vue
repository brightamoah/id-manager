<script setup lang="ts">
const props = defineProps<{
  assignment: IdAssignment;
  icon: string;
  statusColor: ColorType;
}>();

const emit = defineEmits<{
  edit: [];
  released: [];
}>();

const toast = useToast();
const releasing = ref(false);

async function release() {
  releasing.value = true;
  try {
    await $fetch(`/api/assignments/${props.assignment.id}/release`, { method: "POST" });
    toast.add({ title: `ID ${props.assignment.objectId} released`, color: "success" });
    emit("released");
  }
  catch (err: any) {
    toast.add({ title: "Error", description: err?.data?.message, color: "error" });
  }
  finally {
    releasing.value = false;
  }
}
</script>

<template>
  <div class="items-center gap-2 grid grid-cols-[72px_1fr_110px_110px_90px_80px] hover:bg-elevated px-4 py-2 border-default last:border-0 border-b text-sm transition-colors">
    <span class="font-mono font-semibold text-default">
      {{ assignment.objectId }}
    </span>

    <span
      class="text-default text-xs truncate"
      :title="assignment.objectName"
    >
      {{ assignment.objectName }}
    </span>

    <div class="flex items-center gap-1">
      <UIcon
        :name="icon"
        class="size-5 text-muted shrink-0"
      />

      <span class="bg-elevated px-1.5 py-0.5 rounded font-mono text-muted text-xs truncate">
        {{ assignment.objectType }}
      </span>
    </div>

    <span class="font-mono text-muted text-xs truncate">
      {{ assignment.assignedTo }}
    </span>

    <UBadge
      :color="statusColor"
      variant="soft"
      size="sm"
      class="text-center"
    >
      {{ assignment.status }}
    </UBadge>

    <div class="flex items-center gap-1">
      <UButton
        variant="ghost"
        size="xs"
        icon="i-lucide-pencil"
        :disabled="assignment.status === 'released'"
        @click="emit('edit')"
      />

      <UButton
        v-if="assignment.status !== 'released'"
        variant="ghost"
        size="xs"
        icon="i-lucide-archive"
        color="warning"
        :loading="releasing"
        @click="release"
      />
    </div>
  </div>
</template>
