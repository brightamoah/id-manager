import { useRangeQueries } from "../db/queries";

export function useIdLogic() {
  const {
    checkRangeOverlap,
    checkDuplicatedId,
    validateRangeShrink,
    getRangeById,
    getActiveAssignmentsForRange,
    getRangeUsageStats,
    updateRangeStatus,
    logAudit,
  } = useRangeQueries();

  const validateNoOverlap = async (startId: number, endId: number, excludeRangeId?: string) => {
    const { hasConflict, conflictingRanges } = await checkRangeOverlap(startId, endId, excludeRangeId);
    if (hasConflict) {
      throw createError({
        statusCode: 400,
        message: `Range overlaps with existing ranges: ${conflictingRanges.map(r => r.name).join(", ")}`,
      });
    }
  };

  const validateIdBounds = async (rangeId: string, objectId: number) => {
    const range = await getRangeById(rangeId);
    if (!range) {
      throw createError({
        statusCode: 404,
        message: "Range not found",
      });
    }

    if (objectId < range.startId || objectId > range.endId) {
      throw createError({
        statusCode: 400,
        message: `ID ${objectId} is out of bounds for range [${range.startId}, ${range.endId}]`,
      });
    }
    return range;
  };

  const validateNoDuplicateActiveId = async (
    rangeId: string,
    objectId: number,
    objectType: IdAssignment["objectType"],
    excludeAssignmentId?: string,
  ) => {
    const isDuplicate = await checkDuplicatedId(
      rangeId,
      objectId,
      objectType,
      excludeAssignmentId,
    );
    if (isDuplicate) {
      throw createError({
        statusCode: 409,
        message: `ID ${objectId} is already in_use or reserved in this range.`,
      });
    }
  };

  const validateShrinkBounds = async (rangeId: string, newEndId: number) => {
    const { valid, maxAssignedId } = await validateRangeShrink(rangeId, newEndId);
    if (!valid) {
      throw createError({
        statusCode: 400,
        message: `Cannot shrink range end below ${maxAssignedId} as it is currently assigned.`,
      });
    }
  };

  /**
   * Returns the first numeric ID in the range that has ZERO active assignments
   * of any object type. Teams can still reuse that ID for multiple types -
   * this just gives them the next "clean" number to start from.
   */
  const getNextAvailableId = async (rangeId: string): Promise<number | null> => {
    const range = await getRangeById(rangeId);
    if (!range) {
      throw createError({
        statusCode: 404,
        message: "Range not found",
      });
    }

    const activeAssignments = await getActiveAssignmentsForRange(rangeId);
    const usedIds = new Set(activeAssignments.map(a => a.objectId));

    for (let id = range.startId; id <= range.endId; id++) {
      if (!usedIds.has(id)) return id;
    }
    return null;
  };

  /**
   * A range is "full" when every numeric ID in [startId, endId] has at least
   * one active assignment. Individual types can still be added to existing IDs.
   */
  const updateRangeStatusIfNeeded = async (rangeId: string) => {
    const stats = await getRangeUsageStats(rangeId);
    const range = await getRangeById(rangeId);

    if (!range) return;

    const newStatus = stats.isFull ? "full" : "active";

    if (range.status !== "deprecated" && range.status !== newStatus) {
      await updateRangeStatus(rangeId, newStatus);
    }
  };

  const auditOperation = async (entry: Omit<NewAuditLog, "id" | "createdAt">) => {
    await logAudit(entry);
  };

  return {
    validateNoOverlap,
    validateIdBounds,
    validateNoDuplicateActiveId,
    validateShrinkBounds,
    getNextAvailableId,
    updateRangeStatusIfNeeded,
    auditOperation,
  };
}
