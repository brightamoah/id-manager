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
    if (!range) throw createError({ statusCode: 404, message: "Range not found" });

    if (objectId < range.startId || objectId > range.endId) {
      throw createError({
        statusCode: 400,
        message: `ID ${objectId} is out of bounds for range [${range.startId}, ${range.endId}]`,
      });
    }
    return range;
  };

  const validateNoDuplicateActiveId = async (rangeId: string, objectId: number, excludeAssignmentId?: string) => {
    const isDuplicate = await checkDuplicatedId(rangeId, objectId, excludeAssignmentId);
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

  const getNextAvailableId = async (rangeId: string): Promise<number | null> => {
    const range = await getRangeById(rangeId);
    if (!range) throw createError({ statusCode: 404, message: "Range not found" });

    const activeAssignments = await getActiveAssignmentsForRange(rangeId);
    const activeSet = new Set(activeAssignments.map(a => a.objectId));

    for (let id = range.startId; id <= range.endId; id++) {
      if (!activeSet.has(id)) {
        return id;
      }
    }
    return null;
  };

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
