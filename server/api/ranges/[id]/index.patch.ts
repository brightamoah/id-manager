import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";
import { updateRangeSchema } from "~~/shared/utils/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  if (user.role !== "admin") {
    throw createError({
      statusCode: 403,
      message: "Only admins can update ranges",
    });
  }

  const rangeId = getRouterParam(event, "id");

  if (!rangeId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing range ID",
    });
  }

  const body = await readValidatedBody(event, body => updateRangeSchema.safeParse(body));

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

  const { updateRange, getRangeById } = useRangeQueries();
  const { validateNoOverlap, validateShrinkBounds, auditOperation } = useIdLogic();

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
      message: "Cannot update a deprecated range",
    });
  }

  const newStartId = startId ?? existingRange.startId;
  const newEndId = endId ?? existingRange.endId;

  if (
    startId !== undefined
    && endId !== undefined
    && newStartId >= newEndId
  ) {
    throw createError({
      statusCode: 400,
      message: "startId must be less than endId",
    });
  }

  await validateNoOverlap(
    newStartId,
    newEndId,
    rangeId,
  );

  if (endId != null && endId < existingRange.endId) {
    await validateShrinkBounds(rangeId, endId);
  }

  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (owner != null) updates.owner = owner;
  if (startId != null) updates.startId = startId;
  if (endId != null) updates.endId = endId;
  if (environment != null) updates.environment = environment;
  if (publisher != null) updates.publisher = publisher;

  const updatedRange = await updateRange(rangeId, updates);

  if (!updatedRange) {
    throw createError({
      statusCode: 500,
      message: "Failed to update range",
    });
  }

  await auditOperation({
    action: "update",
    actor: "admin",
    entityId: rangeId,
    entityType: "range",
    actorUserId: user.id,
    beforeState: JSON.stringify(existingRange),
    afterState: JSON.stringify(updatedRange),
    description: `Range '${existingRange.name}' updated by ${user.name} (${user.email}). Changes: ${Object.keys(updates).join(", ")}`,
  });

  return {
    range: updatedRange,
  };
});
