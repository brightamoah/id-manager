import type { ConflictResult, IdAssignment, IdRange, NewAuditLog, NewIdAssignment, NewIdRange, RangeUsageStats } from "~~/shared/types";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "uncrypto";
import { auditLog, idAssignments, idRanges } from "../schema";

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
        objectType: true,
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

    // ID's that have at least one active assignment of any type
    const usedIds = new Set(active.map(a => a.objectId));

    for (let id = range.startId; id <= range.endId; id++) {
      if (!usedIds.has(id))
        return id;
    }

    return null;
  };

  /**
   *
   * "used"     = distinct objectIds with at least one in_use or reserved row
   *
   * "released" = distinct objectIds where ALL rows are released (none active)
   *
   * "inUse"    = distinct objectIds that have at least one in_use row
   *
   * "reserved" = distinct objectIds that have at least one reserved row
   *              but no in_use row
   *
   * percentUsed = used / total * 100
   * isFull      = no numeric ID in [startId, endId] has zero active rows
   */
  async function getUsageStatsForRanges(ranges: IdRange[]): Promise<RangeUsageStats[]> {
    if (ranges.length === 0) return [];

    const rangeIds = ranges.map(range => range.id);

    const allAssignments = await db.query.idAssignments.findMany({
      where: {
        rangeId: {
          in: rangeIds,
        },
      },
      columns: {
        rangeId: true,
        objectId: true,
        status: true,
      },
    });

    const assignmentsByRange = new Map<string, typeof allAssignments>();

    for (const assignment of allAssignments) {
      if (!assignmentsByRange.has(assignment.rangeId)) {
        assignmentsByRange.set(assignment.rangeId, []);
      }
      assignmentsByRange.get(assignment.rangeId)!.push(assignment);
    }

    return ranges.map((range) => {
      const assignments = assignmentsByRange.get(range.id) || [];
      const total = range.endId - range.startId + 1 || 0;

      const groupedById = new Map<number, Set<IdAssignment["status"]>>();

      for (const assignment of assignments) {
        if (!groupedById.has(assignment.objectId)) {
          groupedById.set(assignment.objectId, new Set());
        }
        groupedById.get(assignment.objectId)?.add(assignment.status);
      }

      let usedCount = 0;
      let releasedCount = 0;

      for (const [_, statuses] of groupedById) {
        const hasActive = statuses.has("in_use") || statuses.has("reserved");
        if (hasActive) usedCount++;
        else if (statuses.has("released")) releasedCount++;
      }

      const percentUsed = total > 0 ? Math.round((usedCount / total) * 100) : 0;

      let nextAvailableId: number | null = null;
      for (let id = range.startId; id <= range.endId; id++) {
        const statuses = groupedById.get(id);
        if (!statuses || (!statuses.has("in_use") && !statuses.has("reserved"))) {
          nextAvailableId = id;
          break;
        }
      }

      return {
        rangeId: range.id,
        total,
        used: usedCount,
        released: releasedCount,
        reserved: 0,
        percentUsed,
        nextAvailableId,
        isFull: nextAvailableId === null,
      };
    });
  }

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

    const [stats] = await getUsageStatsForRanges([range]);
    return stats!;
  }

  const checkRangeOverlap = async (
    startId: number,
    endId: number,
    excludeRangeId?: string,
  ): Promise<ConflictResult> => {
    const conflicting = await db.query.idRanges.findMany({
      where: {
        status: "active",
        startId: { lte: endId },
        endId: { gte: startId },
        ...(excludeRangeId && { id: { ne: excludeRangeId } }),
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
    objectType: IdAssignment["objectType"],
    excludeAssignmentId?: string,
  ): Promise<boolean> => {
    const existing = await db.query.idAssignments.findFirst({
      where: {
        rangeId,
        objectId,
        objectType,
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

  const updateRangeStatus = async (rangeId: string, newStatus: IdRange["status"]) => {
    await db.update(idRanges)
      .set({ status: newStatus })
      .where(eq(idRanges.id, rangeId));
  };

  const createNewRange = async (data: NewIdRange) => {
    const [newRange] = await db
      .insert(idRanges)
      .values({
        ...data,
      })
      .returning();
    return newRange;
  };

  const updateRange = async (rangeId: string, updates: Partial<NewIdRange>) => {
    const [updated] = await db.update(idRanges)
      .set(updates)
      .where(eq(idRanges.id, rangeId))
      .returning();
    return updated;
  };

  const createAssignment = async (data: NewIdAssignment) => {
    const [newAssignment] = await db
      .insert(idAssignments)
      .values({
        ...data,
      })
      .returning();
    return newAssignment;
  };

  const updateAssignment = async (assignmentId: string, updates: Partial<NewIdAssignment>) => {
    const [updated] = await db
      .update(idAssignments)
      .set(updates)
      .where(eq(idAssignments.id, assignmentId))
      .returning();
    return updated;
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: NewIdAssignment["status"]) => {
    return await db.transaction(async (tx) => {
      const [updated] = await tx.update(idAssignments)
        .set({ status: newStatus })
        .where(eq(idAssignments.id, assignmentId))
        .returning();
      return updated;
    });
  };

  return {
    getAllIdRanges,
    getRangeById,
    getActiveAssignmentsForRange,
    getAssignmentById,
    getAssignmentByRangeId,
    getRangeUsageStats,
    getUsageStatsForRanges,
    checkRangeOverlap,
    checkDuplicatedId,
    logAudit,
    validateRangeShrink,
    updateRangeStatus,
    updateRange,
    createNewRange,
    createAssignment,
    updateAssignment,
    updateAssignmentStatus,
    getNextAvailableId,
  };
}
