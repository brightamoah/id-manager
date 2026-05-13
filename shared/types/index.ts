import type { Table } from "@tanstack/vue-table";
import type { ComputedOptions, ConcreteComponent, MethodOptions, Ref, ShallowRef, ShallowUnwrapRef } from "vue";
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

export interface RangeWithStats extends IdRange {
  stats: RangeUsageStats;
}

export interface OAuthProfile {
  id: string | number;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  accessToken: string;
}

export interface CardItem {
  label: string;
  value: number | string;
  subText: string;
  color: "success" | "primary" | "info" | "warning" | "error";
  icon: string;
}

export type ColorType = "error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral";

export type VariantType = "solid" | "outline" | "soft" | "subtle" | "ghost";

export type SizeType = "xs" | "sm" | "md" | "lg" | "xl";

export type ModalType = "confirm" | "delete" | "warning" | "info" | "success";

export type EnvironmentType = "dev" | "test" | "prod";

type AsyncDataRequestStatus = "idle" | "pending" | "success" | "error";

interface AsyncDataExecuteOptions {
  dedupe?: "cancel" | "defer";
  timeout?: number;
  signal?: AbortSignal;
}

export type Refresh = (opts?: AsyncDataExecuteOptions) => Promise<void>;
export type Status = AsyncDataRequestStatus;

// eslint-disable-next-line ts/no-empty-object-type
export type ComponentType = string | ConcreteComponent<{}, any, any, ComputedOptions, MethodOptions, {}, any>;

export interface AssignmentDataResponse { assignments: IdAssignment[] }
export interface RangeDataResponse { data: RangeWithStats[] }

export type TableType<T> = Readonly<ShallowRef<ShallowUnwrapRef<{
  tableRef: Ref<HTMLTableElement | null, HTMLTableElement | null>;
  tableApi: Table<T>;
}> | null>>;

export type DataType<T> = Ref<T, T>;
