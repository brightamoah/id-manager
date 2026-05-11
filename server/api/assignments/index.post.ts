import { randomUUID } from "node:crypto";
import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";
import { createAssignmentSchema } from "~~/shared/utils/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const body = await readValidatedBody(event, body => createAssignmentSchema.safeParse(body));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: `${body.error.issues
        .map(i => i.message)
        .join(", ")}`,
    });
  }

  const {
    assignedTo,
    notes,
    rangeId,
    status,
    objectId,
    objectName,
    objectType,
  } = body.data;

  const { getRangeById, createAssignment } = useRangeQueries();

  const {
    validateIdBounds,
    validateNoDuplicateActiveId,
    updateRangeStatusIfNeeded,
    auditOperation,
  } = useIdLogic();

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
      message: "Cannot assign IDs from a deprecated range",
    });
  }

  if (range.status === "full") {
    throw createError({
      statusCode: 409,
      message: "Range is full - Cannot assign IDs from a full range",
    });
  }

  await validateIdBounds(rangeId, objectId);
  await validateNoDuplicateActiveId(rangeId, objectId);

  const assignmentStatus = status === "released" ? "released" : "in_use";

  const id = randomUUID();

  const assignment = await createAssignment({
    id,
    rangeId,
    objectId,
    objectType,
    objectName,
    assignedTo,
    status: assignmentStatus,
    notes,
    assignedBy: user.id,
  });

  if (!assignment) {
    throw createError({
      statusCode: 500,
      message: "Failed to create assignment",
    });
  }

  await updateRangeStatusIfNeeded(rangeId);

  await auditOperation({
    action: "assign",
    actor: user.role === "admin" ? "admin" : "user",
    actorUserId: user.id,
    entityType: "assignment",
    entityId: id,
    beforeState: null,
    afterState: JSON.stringify(assignment),
    description: `ID ${objectId} assigned to ${assignedTo} by ${user.name || user.email} in range ${range.name} (${rangeId}) with status ${assignmentStatus}`,
  });

  return {
    assignment,
  };
});
