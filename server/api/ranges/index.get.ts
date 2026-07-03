import { useRangeQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const { getAllIdRanges, getRangeUsageStats } = useRangeQueries();

  const ranges = await getAllIdRanges();

  const rangesWithStats = await Promise.all(
    ranges.map(async range => ({
      ...range,
      stats: await getRangeUsageStats(range.id),
    })),
  );

  return {
    data: rangesWithStats,
  };
});
