export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  const currentUser = session?.user ?? event.context.user;

  return {
    data: currentUser,
  };
});
