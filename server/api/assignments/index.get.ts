export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const query = getQuery(event);

  const where: Record<string, unknown> = {};

  if (query.rangeId) where.rangeId = query.rangeId;
  if (query.assignedTo) where.assignedTo = query.assignedTo;
  if (query.objectType) where.objectType = query.objectType;

  if (query.status) {
    const statuses = String(query.status).split(",");
    where.status = { in: statuses };
  }

  if (query.objectId) {
    const parsed = Number(query.objectId);
    if (!Number.isNaN(parsed)) {
      where.objectId = parsed;
    }
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
