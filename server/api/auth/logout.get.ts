export default defineEventHandler(async (event) => {
  const cleared = await clearUserSession(event);

  if (!cleared) {
    throw createError({
      statusCode: 500,
      message: "Failed to clear user session",
    });
  }

  return {
    message: "Successfully logged out",
    success: true,
  };
});
