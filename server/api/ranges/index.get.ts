import { useRangeQueries } from "~~/server/db/queries";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const { getAllIdRanges, getUsageStatsForRanges } = useRangeQueries();

  const ranges = await getAllIdRanges();
  const allStats = await getUsageStatsForRanges(ranges);

  const rangesWithStats = ranges.map((range, index) => ({
    ...range,
    stats: allStats[index],
  }));

  return {
    data: rangesWithStats,
  };
});
