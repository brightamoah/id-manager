import { useRangeQueries } from "~~/server/db/queries";
import { useIdLogic } from "~~/server/utils/idLogic";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);

  const assignmentId = getRouterParam(event, "id");

  if (!assignmentId) {
    throw createError({
      statusCode: 400,
      message: "Bad Request - missing assignment ID",
    });
  }

  const { getAssignmentById, updateAssignmentStatus } = useRangeQueries();
  const { updateRangeStatusIfNeeded, auditOperation } = useIdLogic();

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
      message: "Cannot delete a released assignment",
    });
  }

  if (
    user.role !== "admin"
    && existingAssignment.assignedTo !== user.id
  ) {
    throw createError({
      statusCode: 403,
      message: "Forbidden - you can only delete your own assignments",
    });
  }

  const updatedAssignment = await updateAssignmentStatus(assignmentId, "released");

  if (!updatedAssignment) {
    throw createError({
      statusCode: 500,
      message: "Failed to release assignment",
    });
  }

  await auditOperation({
    action: "release",
    actor: user.role === "admin" ? "admin" : "user",
    entityId: assignmentId,
    entityType: "assignment",
    actorUserId: user.id,
    description: `Assignment ${assignmentId} released by ${user.name || user.email}`,
    beforeState: JSON.stringify(existingAssignment),
    afterState: JSON.stringify(updatedAssignment),
  });

  await updateRangeStatusIfNeeded(existingAssignment.rangeId);

  return {
    success: true,
    message: `Assignment ${assignmentId} has been released`,
  };
});
