export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  const publicRoutes = ["/"];

  if (to.path.startsWith("/api/"))
    return;

  if (!loggedIn.value && !publicRoutes.includes(to.path)) {
    return navigateTo("/");
  }

  if (loggedIn.value && to.path === "/") {
    return navigateTo("/dashboard");
  }
});
