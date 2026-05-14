<script setup lang="ts">
const props = defineProps<{
  rangeId: string;
  range: IdRange;
  assignment?: IdAssignment | null;
  prefilledObjectId?: number;
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

const { userOptions } = useUsers();

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

const nextAvailableId = ref<number | null>(null);
const isRangeFull = ref<boolean>(false);
const loadingNext = ref(false);

async function fetchNextId() {
  loadingNext.value = true;
  try {
    const res = await $fetch<{ nextAvailableId: number | null; isFull: boolean }>(
      `/api/ranges/${props.rangeId}/nextId`,
    );

    nextAvailableId.value = res.nextAvailableId;
    isRangeFull.value = res.isFull;

    if (!isEditing.value && res.nextAvailableId !== null && !res.isFull) {
      form.value.objectId = res.nextAvailableId;
    }
  }
  catch {
    nextAvailableId.value = null;
    isRangeFull.value = false;
  }
  finally {
    loadingNext.value = false;
  }
}

const takenTypes = ref<string[]>([]);
const loadingTaken = ref(false);

async function checkTakenTypes(objectId: number | undefined) {
  if (!objectId) {
    takenTypes.value = [];
    return;
  }
  loadingTaken.value = true;
  try {
    const all = await $fetch<{ assignments: IdAssignment[] }>(`/api/assignments`, {
      query: {
        rangeId: props.rangeId,
        objectId,
      },
    });
    takenTypes.value = (all.assignments ?? [])
      .filter(a => a.status === "in_use" || a.status === "reserved")
      .map(a => a.objectType);
  }
  catch {
    takenTypes.value = [];
  }
  finally {
    loadingTaken.value = false;
  }
}

let takenTimer: ReturnType<typeof setTimeout>;

watch(() => form.value.objectId, (val) => {
  clearTimeout(takenTimer);
  takenTimer = setTimeout(checkTakenTypes, 400, val);
});

const takenByOthers = computed(() =>
  isEditing.value
    ? takenTypes.value.filter(t => t !== props.assignment?.objectType)
    : takenTypes.value,
);

const selectedTypeAlreadyTaken = computed(() =>
  !!form.value.objectType
  && takenByOthers.value.includes(form.value.objectType),
);

const freeTypes = computed<IdAssignment["objectType"][]>(() =>
  OBJECT_TYPES.filter(t => !takenByOthers.value.includes(t)),
);

const showNextIdHint = computed(() =>
  !isEditing.value
  && !loadingNext.value
  && (nextAvailableId.value !== null || isRangeFull.value),
);

const showTakenPanel = computed(() =>
  !form.value.objectId
  && (!loadingTaken.value || takenByOthers.value.length > 0),
);

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
    await checkTakenTypes(props.assignment.objectId);
  }
  else {
    form.value = {
      objectId: props.prefilledObjectId ?? undefined,
      objectName: "",
      objectType: undefined,
      assignedTo: "",
      status: undefined,
      notes: "",
    };
    takenTypes.value = [];
    nextAvailableId.value = null;
    isRangeFull.value = false;

    if (props.prefilledObjectId) {
      await checkTakenTypes(props.prefilledObjectId);
    }
    else {
      await fetchNextId();
    }
  }
}, { immediate: true });

async function save() {
  if (
    !form.value.objectId
    || !form.value.objectName
    || !form.value.assignedTo
  ) {
    toast.add({
      title: "Missing fields",
      description: "Object ID, name and assignee are required.",
      color: "error",
    });
    return;
  }

  if (selectedTypeAlreadyTaken.value) {
    toast.add({
      title: "Duplicate assignment",
      description: `ID ${form.value.objectId} already has an active ${form.value.objectType} in this range.`,
      color: "error",
    });
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      const response = await $fetch(`/api/assignments/${props.assignment?.id}`, {
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
      toast.add({
        title: "Assignment updated",
        description: `Assignment with ID ${response.assignment.id} updated`,
        color: "success",
      });
    }
    else {
      const response = await $fetch("/api/assignments", {
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
      toast.add({
        title: "Assignment created",
        description: `ID ${response.assignment.objectId} assigned to ${response.assignment.assignedTo}`,
        color: "success",
      });
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

          <span class="text-toned">({{ range.startId }} - {{ range.endId }})</span>
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

        <template v-if="showNextIdHint">
          <p
            v-if="nextAvailableId !== null"
            class="-mt-2 font-mono text-muted text-xs"
          >
            ↳ Next ID with no assignments yet:
            <span class="font-semibold text-highlighted">{{ nextAvailableId }}</span>
          </p>

          <p
            v-else-if="isRangeFull"
            class="-mt-2 font-mono text-warning text-xs"
          >
            ↳ All numeric IDs in this range have at least one active assignment.
            You can still assign a new object type to an existing ID.
          </p>
        </template>

        <p
          v-else-if="!isEditing && loadingNext"
          class="flex items-center gap-1 -mt-2 font-mono text-muted text-xs"
        >
          <UIcon
            name="i-lucide-loader"
            class="text-sm animate-spin"
          />
          Finding next available ID…
        </p>

        <div
          v-if="showTakenPanel"
          class="space-y-2 p-3 border border-default rounded-lg"
        >
          <div class="flex items-center gap-1.5">
            <UIcon
              v-if="loadingTaken"
              name="i-lucide-loader"
              class="text-muted text-base animate-spin"
            />

            <p class="font-mono font-semibold text-muted text-xs uppercase tracking-widest">
              ID {{ form.objectId }} — types already assigned
            </p>
          </div>

          <div
            v-if="!loadingTaken"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-for="t in takenByOthers"
              :key="t"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px]"
              :class="t === form.objectType
                ? 'bg-error-100 text-error-700 ring-1 ring-error-300'
                : 'bg-elevated text-muted'"
            >
              <UIcon
                name="i-lucide-lock"
                class="text-sm"
              />
              {{ t }}
            </span>
          </div>

          <template v-if="!loadingTaken">
            <p
              v-if="freeTypes.length"
              class="font-mono text-muted text-xs"
            >
              Still available:
              <span class="text-success">{{ freeTypes.join(', ') }}</span>
            </p>

            <p
              v-else
              class="font-mono text-warning text-xs"
            >
              All 13 object types are assigned to this ID.
            </p>
          </template>

          <p
            v-if="selectedTypeAlreadyTaken"
            class="flex items-center gap-1 font-mono text-error text-xs"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="text-sm"
            />
            {{ form.objectType }} is already active on ID {{ form.objectId }} — pick a different type.
          </p>
        </div>

        <!-- Object Name -->
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
            <USelectMenu
              v-model="form.assignedTo"
              :items="userOptions"
              value-key="value"
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

        <!-- Notes -->
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
          :disabled="selectedTypeAlreadyTaken"
          icon="i-lucide-check"
          class="cursor-pointer"
          @click="save"
        >
          {{ isEditing ? 'Update' : 'Create Assignment' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
