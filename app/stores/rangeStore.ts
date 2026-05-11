import { acceptHMRUpdate, defineStore } from "pinia";

export const useRangeStore = defineStore("rangeStore", () => {
  const isOpen = ref(false);
  const isEditing = ref(false);
  const saving = ref(false);

  const toast = useToast();

  function defaultForm() {
    return {
      id: "",
      name: "",
      owner: "",
      startId: undefined as number | undefined,
      endId: undefined as number | undefined,
      description: "",
    };
  }

  const form = ref(defaultForm());

  const modalTitle = computed(() => isEditing.value ? "Edit Range" : "New Range");

  function openCreate() {
    isEditing.value = false;
    form.value = defaultForm();
    isOpen.value = true;
  }

  function openEdit(range: RangeWithStats) {
    isEditing.value = true;
    form.value = {
      id: range.id,
      name: range.name ?? "",
      owner: range.owner,
      startId: range.startId,
      endId: range.endId,
      description: range.description ?? "",
    };
    isOpen.value = true;
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

  async function save(refresh: Refresh) {
    if (!form.value.name || !form.value.owner || !form.value.startId || !form.value.endId) {
      toast.add({ title: "Missing fields", description: "Name, owner, start and end ID are required.", color: "error" });
      return;
    }
    if (form.value.startId! >= form.value.endId!) {
      toast.add({ title: "Invalid bounds", description: "Start ID must be less than End ID.", color: "error" });
      return;
    }

    saving.value = true;
    try {
      if (isEditing.value) {
        await $fetch(`/api/ranges/${form.value.id}`, {
          method: "PATCH",
          body: {
            name: form.value.name,
            owner: form.value.owner,
            startId: form.value.startId,
            endId: form.value.endId,
            description: form.value.description,
          },
        });
        toast.add({ title: "Range updated", color: "success" });
      }
      else {
        await $fetch("/api/ranges", {
          method: "POST",
          body: {
            name: form.value.name,
            owner: form.value.owner,
            startId: form.value.startId,
            endId: form.value.endId,
            description: form.value.description,
          },
        });
        toast.add({ title: "Range created", color: "success" });
      }
      isOpen.value = false;
      await refresh();
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
  return {
    modalTitle,
    form,
    isOpen,
    deprecatingId,
    saving,
    isEditing,
    openCreate,
    openEdit,
    deprecate,
    save,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRangeStore, import.meta.hot));
}
