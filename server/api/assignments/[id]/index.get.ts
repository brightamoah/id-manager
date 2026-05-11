import { useRangeQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const rangeId = getRouterParam(event, "id");

  if (!rangeId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing range ID",
    });
  }

  const query = getQuery(event);

  const { getRangeById } = useRangeQueries();

  const range = await getRangeById(rangeId);

  if (!range) {
    throw createError({
      statusCode: 404,
      message: "Range not found",
    });
  }

  const where: Record<string, unknown> = { rangeId };

  if (query.status) {
    const statuses = String(query.status).split(",");
    where.status = { in: statuses };
  }

  if (query.objectType) {
    where.objectType = query.objectType;
  }

  if (query.assignedTo) {
    where.assignedTo = query.assignedTo;
  }

  const { db } = useDB();

  const assignments = await db.query.idAssignments.findMany({
    where,
    orderBy: {
      createdAt: "desc",
      objectId: "asc",
    },
  });

  return {
    assignments,
  };
});
