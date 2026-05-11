<script lang="ts" setup>
definePageMeta({
  layout: "auth",
});

const { clear: clearUserSession } = useUserSession();

onMounted(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    await clearUserSession();
    clearNuxtData();

    await nextTick();
  }
  finally {
    await navigateTo({ name: "index" }, { replace: true });
  }
});
</script>

<template>
  <div class="flex flex-col justify-center items-center h-full">
    <UIcon
      name="i-lucide-loader"
      size="48"
      class="mx-auto mb-4 text-primary animate-spin"
    />

    <h2 class="mb-2 font-semibold text-xl">
      Logging Out...
    </h2>

    <p class="text-muted text-sm text-center">
      You are being logged out of your account.
    </p>
  </div>
</template>

<style scoped>

</style>
