import type { accounts, auditLog, idAssignments, idRanges, syncMeta, syncQueue, users } from "~~/server/db/schema/index";
import type { useDB } from "~~/server/utils/db";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type IdRange = typeof idRanges.$inferSelect;
export type NewIdRange = typeof idRanges.$inferInsert;
export type IdAssignment = typeof idAssignments.$inferSelect;
export type NewIdAssignment = typeof idAssignments.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
export type SyncMeta = typeof syncMeta.$inferSelect;
export type SyncQueueItem = typeof syncQueue.$inferSelect;

export type DB = ReturnType<typeof useDB>["db"];

export interface RangeUsageStats {
  rangeId: string;
  total: number;
  used: number;
  released: number;
  reserved: number;
  percentUsed: number;
  nextAvailableId: number | null;
  isFull: boolean;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingRanges: IdRange[];
}

export type DbForAudit = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

export interface OAuthProfile {
  id: string | number;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
}
