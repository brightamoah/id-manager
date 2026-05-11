import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const rangeId = getRouterParam(event, "id");

  if (!rangeId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing range ID",
    });
  }

  const { getRangeById } = useRangeQueries();
  const { getNextAvailableId } = useIdLogic();

  const range = await getRangeById(rangeId);

  if (!range) {
    throw createError({
      statusCode: 404,
      message: "Range not found",
    });
  }

  if (range.status === "deprecated") {
    throw createError({
      statusCode: 400,
      message: "Cannot get next ID for a deprecated range",
    });
  }

  const nextId = await getNextAvailableId(rangeId);

  return {
    rangeId,
    nextAvailableId: nextId,
    isFull: nextId === null,
  };
});
