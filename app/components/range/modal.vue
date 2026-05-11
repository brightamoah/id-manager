<script lang="ts" setup>
defineProps<{
  modalTitle: string;
  saving: boolean;
  isEditing: boolean;
  save: () => Promise<void>;
}>();

const isOpen = defineModel("open", { default: false, required: true });

const state = defineModel<Partial<CreateRangeInput>>("state", { required: true });

const environmentOptions = [
  { label: "Development", value: "dev" },
  { label: "Testing", value: "test" },
  { label: "Production", value: "prod" },
];
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :ui="{
      footer: 'justify-end',
    }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="gap-3 grid grid-cols-2">
          <UFormField
            label="Project / Extension Name"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="e.g. Core Financial"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Environment"
            required
          >
            <USelectMenu
              v-model="state.environment"
              :items="environmentOptions"
              value-key="value"
              placeholder="Select environment"
              class="w-full cursor-pointer"
              :ui="{
                item: 'cursor-pointer',
              }"
            />
          </UFormField>
        </div>

        <div class="gap-3 grid grid-cols-2">
          <UFormField
            label="Owner"
            required
          >
            <UInput
              v-model="state.owner"
              placeholder="e.g. Team Alpha"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Publisher"
            required
          >
            <UInput
              v-model="state.publisher"
              placeholder="e.g. Publisher Name"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="gap-3 grid grid-cols-2">
          <UFormField
            label="Start ID"
            required
          >
            <UInput
              v-model.number="state.startId"
              type="number"
              placeholder="50000"
              class="w-full font-mono"
            />
          </UFormField>

          <UFormField
            label="End ID"
            required
          >
            <UInput
              v-model.number="state.endId"
              type="number"
              placeholder="50999"
              class="w-full font-mono"
            />
          </UFormField>
        </div>

        <UFormField label="Description">
          <UTextarea
            v-model="state.description"
            placeholder="Optional description…"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-2">
        <UButton
          label="Cancel"
          color="error"
          variant="outline"
          class="cursor-pointer"
          @click="isOpen = false; close"
        />

        <UButton
          :loading="saving"
          icon="i-lucide-check"
          :label=" isEditing ? 'Update Range' : 'Create Range'"
          class="cursor-pointer"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>
