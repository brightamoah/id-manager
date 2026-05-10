import { useUserQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Forbidden - you do not have permission to access this resource",
    });
  }

  const { getAllUsers } = useUserQueries();

  const users = await getAllUsers();

  return {
    data: users.map(({ accounts, ...u }) => ({
      ...u,
      oauthAccounts: accounts.map(({ accessToken, ...a }) => a),
    })),
  };
});
