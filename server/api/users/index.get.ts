import type { UserWithAccounts } from "~~/shared/types";
import { useUserQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { getAllUsers, getUserById } = useUserQueries();

  const currentUser = session.user.role === "admin"
    ? null
    : await getUserById(session.user.id);

  const users: UserWithAccounts[] = session.user.role === "admin"
    ? await getAllUsers()
    : currentUser
      ? [currentUser]
      : [];

  const userData = users.map(({ accounts, ...u }) => ({
    ...u,
    oauthAccounts: accounts.map(({ accessToken, ...a }) => a),
  }));

  return userData;
});
