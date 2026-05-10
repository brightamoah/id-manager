import { useUserQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Forbidden - you do not have permission to access this resource",
    });
  }

  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - Missing user ID parameter",
    });
  }

  if (id === user.id) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - You cannot change your own role",
    });
  }

  const body = await readValidatedBody(event, body => userRole.safeParse(body));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: `${body.error.issues
        .map(i => i.message)
        .join(", ")}`,
    });
  }

  const { role } = body.data;

  const { updateUserRole } = useUserQueries();

  const updated = await updateUserRole(id, role, user.id);

  return {
    data: updated,
  };
});
