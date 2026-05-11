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

  const { getRangeById, getRangeUsageStats } = useRangeQueries();

  const range = await getRangeById(rangeId);

  if (!range) {
    throw createError({
      statusCode: 404,
      message: "Range not found",
    });
  }

  const stats = await getRangeUsageStats(rangeId);

  return {
    range,
    stats,
  };
});
