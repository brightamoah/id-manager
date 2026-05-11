import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Only admins can delete ranges",
    });
  }

  const rangeId = getRouterParam(event, "id");

  if (!rangeId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing range ID",
    });
  }

  const { getRangeById, updateRangeStatus } = useRangeQueries();
  const { auditOperation } = useIdLogic();

  const existingRange = await getRangeById(rangeId);

  if (!existingRange) {
    throw createError({
      statusCode: 404,
      message: "Range not found",
    });
  }

  if (existingRange.status === "deprecated") {
    throw createError({
      statusCode: 400,
      message: "Range is already deprecated",
    });
  }

  await updateRangeStatus(rangeId, "deprecated");

  await auditOperation({
    action: "deprecate",
    actor: "admin",
    entityId: rangeId,
    entityType: "range",
    actorUserId: user.id,
    description: `Range ${existingRange.name} (${rangeId}) deprecated by ${user.name || user.email}`,
    beforeState: JSON.stringify(existingRange),
    afterState: JSON.stringify({ ...existingRange, status: "deprecated" }),
  });

  return {
    success: true,
    message: `Range ${existingRange.name} has been deprecated`,
  };
});
