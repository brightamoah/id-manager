<script lang="ts" setup>
import type { FormSubmitEvent } from "@nuxt/ui";

const { isEditing } = defineProps<{
  modalTitle: string;
  saving: boolean;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  save: [payload: FormSubmitEvent<RangeFormSchema>];
}>();

const isOpen = defineModel("open", { default: false, required: true });

const state = defineModel<Partial<RangeFormSchema>>("state", { required: true });

const { userOptions } = useUsers();

const environmentOptions = [
  { label: "Development", value: "dev" },
  { label: "Testing", value: "test" },
  { label: "Production", value: "prod" },
];

const schema = computed(() => isEditing
  ? updateRangeSchema
  : createRangeSchema);

const formRef = useTemplateRef("formRef");
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
      <UForm
        ref="formRef"
        :state
        :schema
        class="space-y-4"
        @submit="emit('save', $event)"
      >
        <div class="gap-3 grid grid-cols-2">
          <UFormField
            name="name"
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
            name="environment"
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
            name="owner"
            label="Owner"
            required
          >
            <USelectMenu
              v-model="state.owner"
              :items="userOptions!"
              value-key="value"
              placeholder="Select owner"
              class="w-full cursor-pointer"
              :ui="{
                item: 'cursor-pointer',
              }"
            />
          </UFormField>

          <UFormField
            name="publisher"
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
            name="startId"
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
            name="endId"
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

        <UFormField
          label="Description"
          name="description"
        >
          <UTextarea
            v-model="state.description"
            placeholder="Optional description…"
            class="w-full"
          />
        </UFormField>
      </UForm>
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
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>
