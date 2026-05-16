import type { Account, NewAccount, NewUser, OAuthProfile, User } from "~~/shared/types";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "uncrypto";
import { accounts, users } from "../schema";
import { useRangeQueries } from "./ranges";

export function useUserQueries() {
  const { db } = useDB();
  const { logAudit } = useRangeQueries();

  const getActorInfo = (id: string | null) => ({
    actor: id ? ("user" as const) : ("system" as const),
    actorUserId: id,
  });

  async function getUserById(id: string) {
    return (
      await db.query.users.findFirst({
        where: {
          id,
        },
        with: { accounts: true },
      })
    ) ?? null;
  }

  async function getUserByEmail(email: string) {
    return (
      await db.query.users.findFirst({
        where: {
          email,
        },
        with: { accounts: true },
      })
    ) ?? null;
  }

  async function getUserByGithubId(
    githubUserId: string,
  ) {
    const account = await db.query.accounts.findFirst({
      where: {
        provider: "github",
        providerUserId: githubUserId,
      },
      with: { user: true },
    });
    return account?.user ?? null;
  }

  async function getAllUsers() {
    return db.query.users.findMany({
      orderBy: {
        name: "asc",
      },
      with: { accounts: true },
    });
  }

  async function createUser(
    data: Pick<NewUser, "name" | "email" | "avatarUrl" | "role">,
    actorUserId: string | null = null,
  ): Promise<User> {
    const user: NewUser = {
      id: randomUUID(),
      name: data.name,
      email: data.email ?? null,
      avatarUrl: data.avatarUrl ?? null,
      role: data.role ?? "developer",
    };
    await db.insert(users).values(user);

    const { actor, actorUserId: finalActorId } = getActorInfo(actorUserId);

    await logAudit({
      action: "create",
      actor,
      entityId: user.id!,
      entityType: "user",
      beforeState: null,
      afterState: JSON.stringify(user),
      actorUserId: finalActorId,
    });

    return user as User;
  }

  async function updateUser(
    id: string,
    data: Partial<Pick<NewUser, "name" | "email" | "avatarUrl" | "role">>,
    actorUserId: string,
  ) {
    const beforeState = await getUserById(id);

    const [updatedUser] = await db
      .update(users)
      .set({ ...data })
      .where(eq(users.id, id))
      .returning();

    logAudit({
      action: "update",
      actor: "user",
      entityId: id,
      entityType: "user",
      beforeState: JSON.stringify(beforeState),
      afterState: JSON.stringify({ ...updatedUser }),
      actorUserId,
    });

    return updatedUser;
  }

  async function updateUserRole(
    id: string,
    role: "admin" | "developer",
    adminUserId: string,
  ) {
    const beforeState = await getUserById(id);

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();

    logAudit({
      action: "update",
      actor: "admin",
      entityId: id,
      entityType: "user",
      beforeState: JSON.stringify(beforeState),
      afterState: JSON.stringify({ ...updatedUser }),
      actorUserId: adminUserId,
    });

    return updatedUser;
  }

  async function createAccount(
    data: Pick<
      NewAccount,
      "userId" | "provider" | "providerUserId" | "username" | "accessToken"
    >,
  ): Promise<Account> {
    const account: NewAccount = {
      id: randomUUID(),
      userId: data.userId,
      provider: data.provider,
      providerUserId: data.providerUserId,
      username: data.username ?? null,
      accessToken: data.accessToken ?? null,
    };
    await db.insert(accounts).values(account);
    return account as Account;
  }

  async function updateAccount(
    provider: "github" | "google",
    providerUserId: string,
    data: Partial<Pick<NewAccount, "username" | "accessToken">>,
  ) {
    await db
      .update(accounts)
      .set({ ...data })
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerUserId, providerUserId),
        ),
      );
  }

  async function upsertOAuthUser(
    provider: "github" | "google",
    profile: OAuthProfile,
  ): Promise<User> {
    const providerUserId = String(profile.id);

    const existingAccount = await db.query.accounts.findFirst({
      where: {
        provider,
        providerUserId,
      },
      with: { user: true },
    });

    if (existingAccount) {
      await updateAccount(provider, providerUserId, {
        username: profile.username ?? profile.email,
        accessToken: profile.accessToken,
      });

      const updatedUser = await updateUser(existingAccount.userId, {
        name: profile.name ?? existingAccount?.user?.name ?? profile.username ?? profile.email,
        avatarUrl: profile.avatarUrl ?? existingAccount?.user?.avatarUrl,
        email: profile.email ?? existingAccount?.user?.email,
      }, existingAccount.userId);

      return updatedUser as User;
    }

    let user = await db.query.users.findFirst({
      where: {
        email: profile.email,
      },
    });

    if (!user) {
      user = await createUser({
        name: profile.name ?? profile.username ?? profile.email,
        email: profile.email,
        avatarUrl: profile.avatarUrl ?? null,
        role: "developer",
      });
    }

    await createAccount({
      userId: user.id,
      provider,
      providerUserId,
      username: profile.username ?? profile.email,
      accessToken: profile.accessToken,
    });

    return user;
  }

  const upsertGithubUser = async (
    github: {
      id: number;
      login: string;
      name: string | null;
      email: string | null;
      avatar_url: string | null;
      accessToken: string;
    },
  ) => {
    return upsertOAuthUser("github", {
      id: github.id,
      email: github.email!,
      name: github.name,
      username: github.login,
      avatarUrl: github.avatar_url,
      accessToken: github.accessToken,
    });
  };

  const upsertGoogleUser = async (
    google: {
      sub: string;
      name: string;
      email: string;
      picture: string;
      accessToken: string;
    },
  ) => {
    return upsertOAuthUser("google", {
      id: google.sub,
      email: google.email,
      name: google.name,
      username: google.email,
      avatarUrl: google.picture,
      accessToken: google.accessToken,
    });
  };

  return {
    getUserById,
    getUserByEmail,
    getUserByGithubId,
    getAllUsers,
    createUser,
    updateUser,
    updateUserRole,
    createAccount,
    updateAccount,
    upsertOAuthUser,
    upsertGithubUser,
    upsertGoogleUser,
  };
}
