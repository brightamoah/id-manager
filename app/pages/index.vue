<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Login",
  description: "Login to your account to continue",
});

const toast = useToast();
const loadingProvider = ref<string | null>(null);

function loginWith(provider: string, label: string) {
  loadingProvider.value = provider;
  toast.add({
    title: label,
    description: `Signing in with ${label}...`,
  });
  window.location.href = `/api/auth/${provider}`;
}

const providers = computed<ButtonProps[]>(() => [
  {
    label: loadingProvider.value === "google" ? "Signing in with Google..." : "Sign in with Google",
    icon: "i-logos-google-icon",
    size: "xl",
    color: "info",
    variant: "subtle",
    class: "cursor-pointer rounded-xl",
    external: true,
    loading: loadingProvider.value === "google",
    disabled: !!loadingProvider.value,
    onClick: () => loginWith("google", "Google"),
  },
  {
    label: loadingProvider.value === "github" ? "Signing in with GitHub..." : "Sign in with GitHub",
    icon: "i-simple-icons-github",
    size: "xl",
    color: "neutral",
    class: "cursor-pointer rounded-xl",
    external: true,
    loading: loadingProvider.value === "github",
    disabled: !!loadingProvider.value,
    onClick: () => loginWith("github", "GitHub"),
  },
]);
</script>

<template>
  <UAuthForm
    :providers="providers"
    title="ID Manager for AL Devs"
    description="Sign in to your account to continue"
    icon="i-lucide-lock"
    :ui="{
      title: 'text-primary font-newsreader',
      providers: 'space-y-6',
    }"
  />
</template>

<style scoped></style>
