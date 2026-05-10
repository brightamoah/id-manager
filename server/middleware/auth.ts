export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);

  const publicPrefixes = [
    "/api/auth/",
    "/api/_nuxt_icon/",
    "/_nuxt/",
    "/favicon",
    "/login",
  ];

  if (publicPrefixes.some(p => url.pathname.startsWith(p))) return;

  if (url.pathname.startsWith("/api/")) {
    const session = await getUserSession(event);

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized — please sign in to access this resource",
      });
    }

    event.context.user = session.user;
  }
});
