<script setup lang="ts">
const props = defineProps<{
  rangeId: string;
  range: IdRange;
  assignment?: IdAssignment | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "saved": [];
}>();

const open = defineModel("open", { default: false, required: true });

const toast = useToast();
const saving = ref(false);

const OBJECT_TYPES: IdAssignment["objectType"][] = [
  "Table",
  "Page",
  "Codeunit",
  "Report",
  "Enum",
  "Query",
  "XmlPort",
  "TableExtension",
  "PageExtension",
  "EnumExtension",
  "Interface",
  "PermissionSet",
  "Other",
];

const objectTypeItems = OBJECT_TYPES.map(t => ({ label: t, value: t }));

const status: IdAssignment["status"][] = [
  "in_use",
  "reserved",
  "released",
];

const statusItems = status.map(s => ({
  label: s.replace("_", " ").toUpperCase(),
  value: s,
}));

const isEditing = computed(() => !!props.assignment?.id);
const modalTitle = computed(() => isEditing.value ? "Edit Assignment" : "New Assignment");

const form = ref<{
  objectId: number | undefined;
  objectName: string;
  objectType: IdAssignment["objectType"] | undefined;
  assignedTo: string;
  status: IdAssignment["status"] | undefined;
  notes: string;
}>({
  objectId: undefined as number | undefined,
  objectName: "",
  objectType: undefined,
  assignedTo: "",
  status: undefined,
  notes: "",
});

// Next ID suggestion
const nextIdHint = ref<string>("");
const loadingNext = ref(false);

async function fetchNextId() {
  loadingNext.value = true;
  try {
    const res = await $fetch<{ nextAvailableId: number | null; isFull: boolean }>(
      `/api/ranges/${props.rangeId}/nextId`,
    );
    if (res.isFull) {
      nextIdHint.value = "↳ Range is full — no available IDs";
    }
    else {
      nextIdHint.value = `↳ Next available ID: ${res.nextAvailableId}`;
      if (!isEditing.value) {
        form.value.objectId = res.nextAvailableId ?? undefined;
      }
    }
  }
  catch {
    nextIdHint.value = "";
  }
  finally {
    loadingNext.value = false;
  }
}

watch(open, async (newVal) => {
  if (!newVal) return;
  if (props.assignment) {
    form.value = {
      objectId: props.assignment.objectId,
      objectName: props.assignment.objectName,
      objectType: props.assignment.objectType,
      assignedTo: props.assignment.assignedTo,
      status: props.assignment.status,
      notes: props.assignment.notes ?? "",
    };
    nextIdHint.value = "";
  }
  else {
    form.value = {
      objectId: undefined,
      objectName: "",
      objectType: undefined,
      assignedTo: "",
      status: undefined,
      notes: "",
    };
    await fetchNextId();
  }
}, { immediate: true });

async function save() {
  if (!form.value.objectId || !form.value.objectName || !form.value.assignedTo) {
    toast.add({ title: "Missing fields", description: "Object ID, name and assignee are required.", color: "error" });
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await $fetch(`/api/assignments/${props.assignment!.id}`, {
        method: "PATCH",
        body: {
          objectId: form.value.objectId,
          objectName: form.value.objectName,
          objectType: form.value.objectType,
          assignedTo: form.value.assignedTo,
          status: form.value.status,
          notes: form.value.notes,
        },
      });
      toast.add({ title: "Assignment updated", color: "success" });
    }
    else {
      await $fetch("/api/assignments", {
        method: "POST",
        body: {
          rangeId: props.rangeId,
          objectId: form.value.objectId,
          objectName: form.value.objectName,
          objectType: form.value.objectType,
          assignedTo: form.value.assignedTo,
          status: form.value.status,
          notes: form.value.notes,
        },
      });
      toast.add({ title: "Assignment created", color: "success" });
    }
    emit("saved");
  }
  catch (err: any) {
    toast.add({
      title: "Error",
      description: err?.data?.message ?? "Something went wrong.",
      color: "error",
    });
  }
  finally {
    saving.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    transition
    :title="modalTitle"
    :ui="{
      footer: 'justify-end',
    }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center gap-2 bg-muted p-3 rounded-lg font-mono text-sm">
          <UIcon
            name="i-lucide-layers"
            class="size-5 text-muted"
          />

          <span class="text-muted">Range:</span>

          <span class="font-semibold text-default">{{ range.name }}</span>

          <span class="text-toned">
            ({{ range.startId }} - {{ range.endId }})
          </span>
        </div>

        <div class="gap-3 grid grid-cols-2">
          <UFormField
            label="Object ID"
            required
          >
            <UInput
              v-model.number="form.objectId"
              type="number"
              :placeholder="range.startId.toString()"
              class="w-full font-mono"
            />
          </UFormField>

          <UFormField
            label="Object Type"
            required
          >
            <USelectMenu
              v-model="form.objectType"
              :items="objectTypeItems"
              placeholder="Select object type"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>

        <p
          v-if="nextIdHint"
          class="-mt-2 font-mono text-[11px]"
          :class="nextIdHint.includes('full') ? 'text-warning-500' : 'text-muted'"
        >
          <UIcon
            v-if="loadingNext"
            name="i-lucide-loader"
            class="text-xs animate-spin"
          />
          {{ nextIdHint }}
        </p>

        <UFormField
          label="Object Name"
          required
        >
          <UInput
            v-model="form.objectName"
            placeholder="e.g. Customer Credit Limit"
            class="w-full"
          />
        </UFormField>

        <div class="gap-3 grid grid-cols-2">
          <UFormField
            label="Assigned To"
            required
          >
            <UInput
              v-model="form.assignedTo"
              placeholder="developer name"
              class="w-full font-mono"
            />
          </UFormField>

          <UFormField label="Status">
            <USelectMenu
              v-model="form.status"
              :items="statusItems"
              placeholder="Select status"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Notes">
          <UTextarea
            v-model="form.notes"
            placeholder="Optional notes…"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          class="cursor-pointer"
          label="Cancel"
          @click="close"
        />

        <UButton
          :loading="saving"
          icon="i-lucide-check"
          @click="save"
        >
          {{ isEditing ? 'Update' : 'Create Assignment' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
