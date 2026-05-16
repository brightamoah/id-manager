import { randomUUID } from "uncrypto";
import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";
import { createRangeSchema } from "~~/shared/utils/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Only admins can create ranges",
    });
  }

  const body = await readValidatedBody(event, body => createRangeSchema.safeParse(body));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: `${body.error.issues
        .map(i => i.message)
        .join(", ")}`,
    });
  }

  const {
    description,
    endId,
    name,
    owner,
    startId,
    environment,
    publisher,
  } = body.data;

  if (startId >= endId) {
    throw createError({
      statusCode: 400,
      message: "startId must be less than endId",
    });
  }

  const { validateNoOverlap, auditOperation } = useIdLogic();

  const { createNewRange, checkRangeOverlap } = useRangeQueries();

  const {
    hasConflict,
    conflictingRanges,
  } = await checkRangeOverlap(startId, endId);

  if (hasConflict) {
    const suggestedStartId = Math.max(...conflictingRanges.map(range => range.endId)) + 1;

    throw createError({
      statusCode: 409,
      data: {
        code: "RANGE_OVERLAP",
        suggestedStartId,
        conflictingRanges: conflictingRanges.map(range => ({
          id: range.id,
          name: range.name,
          startId: range.startId,
          endId: range.endId,
        })),
      },
      message: `Range overlaps with: ${conflictingRanges.map(r => `${r.name} (${r.startId} - ${r.endId})`).join(", ")}`,
    });
  }

  await validateNoOverlap(startId, endId);

  const id = randomUUID();

  const newRange = await createNewRange({
    id,
    name,
    description,
    startId,
    endId,
    owner,
    createdBy: user.id,
    publisher,
    environment,
  });

  if (!newRange) {
    throw createError({
      statusCode: 500,
      message: "Failed to create new range",
    });
  }

  await auditOperation({
    action: "create",
    actor: "admin",
    entityId: newRange.id,
    entityType: "range",
    actorUserId: user.id,
    afterState: JSON.stringify(newRange),
    description: `Range '${newRange.name}' created with IDs [${newRange.startId}, ${newRange.endId}] by ${user.name} (${user.email})`,
  });

  return {
    range: newRange,
  };
});
