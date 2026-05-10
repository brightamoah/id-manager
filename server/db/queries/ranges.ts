import type { ConflictResult, NewAuditLog, RangeUsageStats } from "~~/shared/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "uncrypto";
import { auditLog, idAssignments } from "../schema";

export function useRangeQueries() {
  const { db } = useDB();

  const getAllIdRanges = async () => {
    return db
      .query
      .idRanges
      .findMany({
        orderBy: { startId: "asc" },
      });
  };

  const getRangeById = async (rangeId: string) => {
    const range = await db.query.idRanges.findFirst({
      where: { id: rangeId },
    });
    return range;
  };

  const getAssignmentByRangeId = async (rangeId: string) => {
    const assignment = await db.query.idAssignments.findFirst({
      where: { rangeId },
    });
    return assignment;
  };

  const getAssignmentById = async (assignmentId: string) => {
    const assignment = await db.query.idAssignments.findFirst({
      where: { id: assignmentId },
    });
    return assignment;
  };

  const getActiveAssignmentsForRange = async (rangeId: string) => {
    return db.query.idAssignments.findMany({
      where: {
        rangeId,
        status: {
          in: ["in_use", "reserved"],
        },
      },
      columns: {
        objectId: true,
      },
    });
  };

  const getNextAvailableId = async (rangeId: string): Promise<number | null> => {
    const range = await getRangeById(rangeId);

    if (!range) {
      throw createError({
        statusCode: 404,
        message: `Range with ID ${rangeId} not found`,
      });
    }

    const active = await getActiveAssignmentsForRange(rangeId);

    const activeSet = new Set(active.map(a => a.objectId));

    for (let id = range.startId; id <= range.endId; id++) {
      if (!activeSet.has(id))
        return id;
    }

    return null;
  };

  async function getRangeUsageStats(
    rangeId: string,
  ): Promise<RangeUsageStats> {
    const range = await getRangeById(rangeId);

    if (!range) {
      throw createError({
        statusCode: 404,
        message: `Range with ID ${rangeId} not found`,
      });
    }

    const assignments = await db.query.idAssignments.findMany({
      where: { rangeId },
      columns: { status: true },
    });

    const total = range.endId - range.startId + 1 || 0;
    const inUse = assignments?.filter(a => a.status === "in_use").length || 0;
    const reserved = assignments?.filter(a => a.status === "reserved").length || 0;
    const released = assignments?.filter(a => a.status === "released").length || 0;
    const used = inUse + reserved || 0;
    const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;
    const nextAvailableId = await getNextAvailableId(rangeId);

    return {
      rangeId,
      total,
      used,
      released,
      reserved,
      percentUsed,
      nextAvailableId,
      isFull: nextAvailableId === null,
    };
  }

  const checkRangeOverlap = async (
    startId: number,
    endId: number,
    excludeRangeId?: string,
  ): Promise<ConflictResult> => {
    const conflicting = await db.query.idRanges.findMany({
      where: {
        AND: [
          {
            status: "active",
            startId: { lte: endId },
            endId: { gte: startId },
            ...(excludeRangeId && { id: { ne: excludeRangeId } }),
          },
        ],
      },
    });

    return {
      hasConflict: conflicting.length > 0,
      conflictingRanges: conflicting,
    };
  };

  const checkDuplicatedId = async (
    rangeId: string,
    objectId: number,
    excludeAssignmentId?: string,
  ): Promise<boolean> => {
    const existing = await db.query.idAssignments.findFirst({
      where: {
        rangeId,
        objectId,
        status: { in: ["in_use", "reserved"] },
        ...(excludeAssignmentId && { id: { ne: excludeAssignmentId } }),

      },

    });

    return !!existing;
  };

  const logAudit = async (entry: Omit<NewAuditLog, "id" | "createdAt">) => {
    await db.insert(auditLog).values({
      id: randomUUID(),
      ...entry,
    });
  };

  const validateRangeShrink = async (
    rangeId: string,
    newEndId: number,
  ): Promise<{ valid: boolean; maxAssignedId: number | null }> => {
    const result = await db.select({
      maxId: sql<number>`MAX(${idAssignments.objectId})`,
    })
      .from(idAssignments)
      .where(
        and(
          eq(idAssignments.rangeId, rangeId),
          inArray(idAssignments.status, ["in_use", "reserved"]),
        ),
      );

    const maxAssignedId = result[0]?.maxId ?? null;

    if (maxAssignedId !== null && newEndId < maxAssignedId) {
      return { valid: false, maxAssignedId };
    }

    return { valid: true, maxAssignedId };
  };

  return {
    getAllIdRanges,
    getRangeById,
    getActiveAssignmentsForRange,
    getAssignmentById,
    getAssignmentByRangeId,
    getRangeUsageStats,
    checkRangeOverlap,
    checkDuplicatedId,
    logAudit,
    validateRangeShrink,
  };
}
