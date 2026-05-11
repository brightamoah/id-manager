<template>
  <div class="flex justify-center items-center px-4 h-screen">
    <!-- <UButton
      icon="i-lucide-chevron-left"
      to="/"
      size="xl"
      color="neutral"
      variant="subtle"
      class="top-8 left-8 z-10 absolute rounded-full"
    /> -->

    <UColorModeButton class="top-8 right-8 z-10 absolute rounded-full cursor-pointer" />

    <UPageCard
      variant="subtle"
      class="w-full max-w-sm"
    >
      <slot />
    </UPageCard>
  </div>
</template>
