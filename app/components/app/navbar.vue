<script lang="ts" setup>
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const isMobile = inject(isMobileKey, computed(() => false));

const { user } = useUserSession();

const userInitials = computed(() => generateInitials(user.value?.name ?? "User"));

const avatar = computed(() => user.value?.avatarUrl ?? undefined);

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "Ranges",
    to: { name: "dashboard" },
    active: route.name === "dashboard",
    icon: "i-lucide-layers",
  },
  {
    label: "Assignments",
    to: { name: "assignments" },
    active: route.name === "assignments",
    icon: "i-lucide-clipboard-list",
  },
]);
</script>

<template>
  <UHeader
    to="/dashboard"
    mode="slideover"
    toggle-side="left"
  >
    <template #title>
      <div class="flex flex-col py-1 leading-tight">
        <span class="font-mono font-semibold text-xl tracking-tight">
          BC ID Manager
        </span>

        <span class="font-code font-light text-muted text-xs">
          AL Object Registry
        </span>
      </div>
    </template>

    <UNavigationMenu
      :items
      highlight
      variant="link"
      :ui="{
        link: 'after:-bottom-0.5 text-base',
      }"
    />

    <template #right>
      <UColorModeButton
        variant="link"
        class="cursor-pointer"
        :ui="{
          leadingIcon: 'size-6',
        }"
      />

      <UAvatar
        :src="avatar"
        :alt="userInitials"
        :text="userInitials"
        size="md"
        class="rounded-full cursor-pointer"
      />

      <UButton
        class="flex text-center cursor-pointer"
        size="md"
        color="error"
        variant="subtle"
        :to="{ name: 'auth-logout' }"
      >
        <p class="flex justify-center items-center gap-2">
          <UIcon
            name="i-lucide-log-out"
            class="size-4 font-bold"
          />

          <span v-if="!isMobile">Logout</span>
        </p>
      </UButton>
    </template>

    <template #body>
      <UNavigationMenu
        :items
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
