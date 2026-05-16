import type { FormSubmitEvent } from "@nuxt/ui";
import { acceptHMRUpdate, defineStore } from "pinia";

export const useRangeStore = defineStore("rangeStore", () => {
  const isOpen = ref(false);
  const isEditing = ref(false);
  const saving = ref(false);

  const overlapConflict = ref<OverlapConflict | null>(null);

  const toast = useToast();

  function defaultForm() {
    return {
      id: "",
      name: "",
      publisher: "",
      environment: undefined as EnvironmentType | undefined,
      owner: undefined as string | undefined,
      startId: undefined as number | undefined,
      endId: undefined as number | undefined,
      description: "",
    };
  }

  const form = ref(defaultForm());

  const modalTitle = computed(() => isEditing.value
    ? "Edit Range"
    : "New Range");

  function openCreate() {
    isEditing.value = false;
    overlapConflict.value = null;
    form.value = defaultForm();
    isOpen.value = true;
  }

  function openEdit(range: RangeWithStats) {
    isEditing.value = true;
    overlapConflict.value = null;
    form.value = {
      id: range.id,
      name: range.name ?? "",
      owner: range.owner,
      publisher: range.publisher ?? "",
      environment: range.environment,
      startId: range.startId,
      endId: range.endId,
      description: range.description ?? "",
    };
    isOpen.value = true;
  }

  function clearOverlapConflict() {
    overlapConflict.value = null;
  }

  const deprecatingId = ref<string | null>(null);

  async function deprecate(range: RangeWithStats, refresh: Refresh) {
    deprecatingId.value = range.id;
    try {
      await $fetch(`/api/ranges/${range.id}`, { method: "DELETE" });
      toast.add({ title: `"${range.name}" deprecated`, color: "warning" });
      await refresh();
    }
    catch (err: any) {
      toast.add({ title: "Error", description: err?.data?.message, color: "error" });
    }
    finally {
      deprecatingId.value = null;
    }
  }

  async function save(event: FormSubmitEvent<RangeFormSchema>, refresh: Refresh) {
    const data = event.data;

    if (form.value.startId! >= form.value.endId!) {
      toast.add({
        title: "Invalid bounds",
        description: "Start ID must be less than End ID.",
        color: "error",
      });
      return;
    }
    overlapConflict.value = null;
    saving.value = true;
    try {
      if (isEditing.value) {
        await $fetch(`/api/ranges/${form.value.id}`, {
          method: "PATCH",
          body: {
            name: data.name,
            owner: data.owner,
            startId: data.startId,
            endId: data.endId,
            description: data.description,
            publisher: data.publisher,
            environment: data.environment,
          },
        });
        toast.add({
          title: "Range updated",
          description: `Range "${data.name}" has been updated.`,
          color: "success",
        });

        isOpen.value = false;
        await refresh();
      }
      else {
        await $fetch("/api/ranges", {
          method: "POST",
          body: {
            name: data.name,
            owner: data.owner,
            startId: data.startId,
            endId: data.endId,
            description: data.description,
            publisher: data.publisher,
            environment: data.environment,
          },
        });
        toast.add({
          title: "Range created",
          description: `Range "${data.name}" has been created.`,
          color: "success",
        });
      }
      isOpen.value = false;
      await refresh();
    }
    catch (error: any) {
      const errorData = error?.data;

      if (errorData?.statusCode === 409 && errorData?.data?.code === "RANGE_OVERLAP") {
        overlapConflict.value = {
          suggestedStartId: errorData.data.suggestedStartId,
          conflictingRanges: errorData.data.conflictingRanges ?? [],
        };

        toast.add({
          title: "Range overlap",
          description: `The specified ID range overlaps with existing ranges.`,
          color: "error",
        });
      }
      else {
        toast.add({
          title: "Error",
          description: errorData?.message ?? "Something went wrong.",
          color: "error",
        });
      }
    }
    finally {
      saving.value = false;
    }
  }
  return {
    modalTitle,
    form,
    isOpen,
    deprecatingId,
    saving,
    isEditing,
    overlapConflict,
    openCreate,
    openEdit,
    deprecate,
    save,
    clearOverlapConflict,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRangeStore, import.meta.hot));
}
