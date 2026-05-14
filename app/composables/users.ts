export function useUsers() {
  const { data: users } = useFetch<Users>("/api/users", {
    key: "users",
    lazy: true,
    default: () => [],
    getCachedData: (key, nuxtApp, ctx) => {
      if (ctx.cause === "refresh:manual" || ctx.cause === "refresh:hook") return undefined;
      return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key];
    },
  });

  const userOptions = computed(() => {
    if (!Array.isArray(users.value)) return [];
    return users.value.map(user => ({
      label: user.name ?? user.oauthAccounts[0]?.username ?? user.email,
      value: user.id,
    }));
  });

  const mapUserIdToName = computed(() => {
    if (!Array.isArray(users.value)) return {};
    const map: Record<string, string> = {};
    users.value.forEach((user) => {
      map[user.id] = user.name ?? user.oauthAccounts[0]?.username ?? user.email;
    });
    return map;
  });

  return {
    users,
    userOptions,
    mapUserIdToName,
  };
}
