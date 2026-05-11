import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";
import { updateAssignmentSchema } from "~~/shared/utils/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const assignmentId = getRouterParam(event, "id");

  if (!assignmentId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing assignment ID",
    });
  }

  const body = await readValidatedBody(event, body => updateAssignmentSchema.safeParse(body));

  if (!body.success) {
    throw createError({
      statusCode: 400,
      message: `${body.error.issues
        .map(i => i.message)
        .join(", ")}`,
    });
  }

  const {
    getAssignmentById,
    updateAssignment,
  } = useRangeQueries();

  const {
    validateIdBounds,
    validateNoDuplicateActiveId,
    auditOperation,
  } = useIdLogic();

  const existingAssignment = await getAssignmentById(assignmentId);

  if (!existingAssignment) {
    throw createError({
      statusCode: 404,
      message: "Assignment not found",
    });
  }

  if (existingAssignment.status === "released") {
    throw createError({
      statusCode: 400,
      message: "Cannot update a released assignment",
    });
  }

  if (
    user.role !== "admin"
    && existingAssignment.assignedTo !== user.id
  ) {
    throw createError({
      statusCode: 403,
      message: "You can only edit your own assignments",
    });
  }

  const {
    assignedTo,
    notes,
    status,
    objectId,
    objectName,
    objectType,
  } = body.data;

  if (objectId != null && objectId !== existingAssignment.objectId) {
    await validateIdBounds(existingAssignment.rangeId, objectId);
    await validateNoDuplicateActiveId(existingAssignment.rangeId, objectId, assignmentId);
  }

  const updates: Record<string, unknown> = {};
  if (objectName != null) updates.objectName = objectName;
  if (objectType != null) updates.objectType = objectType;
  if (assignedTo != null) updates.assignedTo = assignedTo;
  if (notes !== undefined) updates.notes = notes;
  if (objectId != null) updates.objectId = objectId;
  if (status != null) updates.status = status;

  const updatedAssignment = await updateAssignment(assignmentId, updates);

  if (!updatedAssignment) {
    throw createError({
      statusCode: 500,
      message: "Failed to update assignment",
    });
  }

  await auditOperation({
    action: "update",
    actor: user.role === "admin" ? "admin" : "user",
    entityId: assignmentId,
    entityType: "assignment",
    actorUserId: user.id,
    beforeState: JSON.stringify(existingAssignment),
    afterState: JSON.stringify(updatedAssignment),
    description: `Assignment for object ${existingAssignment.objectType} '${existingAssignment.objectName}' (ID: ${existingAssignment.objectId}) updated by ${user.name || user.email}`,
  });

  return {
    assignment: updatedAssignment,
  };
});
