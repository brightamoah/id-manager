import { useUserQueries } from "~~/server/db/queries";

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    const { upsertGithubUser } = useUserQueries();

    const dbUser = await upsertGithubUser({
      ...user,
      accessToken: tokens.access_token,
    });

    await setUserSession(event, {
      user: dbUser,
      loggedInAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    return sendRedirect(event, "/dashboard");
  },

  async onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/?error=github");
  },
});
