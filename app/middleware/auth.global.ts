import type { RouteLocationRaw } from "vue-router";

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  const publicRoutes: RouteLocationRaw[] = ["/", "/auth/logout"];

  if (to.path.startsWith("/api/"))
    return;

  if (!loggedIn.value && !publicRoutes.includes(to.path)) {
    return navigateTo("/");
  }

  if (loggedIn.value && to.path === "/") {
    return navigateTo("/dashboard");
  }
});
