<script setup lang="ts">
const { user } = useUserSession();
</script>

<template>
  <UContainer class="py-12">
    <h1>Dashboard</h1>
    <pre>{{ user }}</pre>

    <UButton
      color="error"
      variant="outline"
      label="Logout"
      class="cursor-pointer"
      :to="{ name: 'auth-logout' }"
    />
  </UContainer>
</template>
