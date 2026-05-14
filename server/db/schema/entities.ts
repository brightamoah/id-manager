import { sql } from "drizzle-orm";
import { index, integer, sqliteTable } from "drizzle-orm/sqlite-core";

const updatedAtColumn = {
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdateFn(() => new Date()),
};

export const users = sqliteTable("users", t => (
  {
    id: t.text().primaryKey().$defaultFn(() => sql`(uuid())`),
    name: t.text(),
    email: t.text().unique().notNull(),
    avatarUrl: t.text(),
    role: t.text({ enum: ["admin", "developer"] })
      .notNull()
      .default("developer"),
    createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    ...updatedAtColumn,
  }
), table => [
  index("idx_users_email").on(table.email),
]);

export const accounts = sqliteTable("accounts", t => (
  {
    id: t.text().primaryKey().$defaultFn(() => sql`(uuid())`),
    userId: t.text().notNull().references(() => users.id, { onDelete: "cascade" }),
    username: t.text(),
    accessToken: t.text(),
    provider: t.text({ enum: ["github", "google"] }).notNull(),
    providerUserId: t.text().notNull(),
    createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    ...updatedAtColumn,
  }
), table => [
  index("idx_accounts_user_provider").on(table.userId, table.provider),
  index("idx_accounts_provider_user").on(table.provider, table.providerUserId),
]);

export const idRanges = sqliteTable("id_ranges", t => ({
  id: t.text().primaryKey(),
  name: t.text().notNull(),
  description: t.text(),
  startId: t.integer().notNull(),
  endId: t.integer().notNull(),
  owner: t.text().notNull().references(() => users.id, { onDelete: "set null" }),
  publisher: t.text(),
  environment: t.text({ enum: ["dev", "test", "prod"] }).notNull().default("dev"),
  status: t.text({ enum: ["active", "deprecated", "full"] })
    .notNull()
    .default("active"),
  createdBy: t.text().notNull().references(() => users.id, { onDelete: "set null" }),
  createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  ...updatedAtColumn,
}), table => [
  index("idx_ranges_status").on(table.status),
  index("idx_ranges_owner").on(table.owner),
  index("idx_ranges_publisher").on(table.publisher),
  index("idx_ranges_environment").on(table.environment),
]);

export const idAssignments = sqliteTable("id_assignments", t => ({
  id: t.text().primaryKey(),
  rangeId: t.text()
    .notNull()
    .references(() => idRanges.id, { onDelete: "cascade" }),
  objectId: t.integer().notNull(),
  objectName: t.text().notNull(),
  objectType: t.text(
    {
      enum: [
        "Table",
        "Page",
        "Codeunit",
        "Report",
        "Enum",
        "Query",
        "XmlPort",
        "TableExtension",
        "PageExtension",
        "EnumExtension",
        "Interface",
        "PermissionSet",
        "Other",
      ],
    },
  ).notNull(),
  assignedTo: t.text().notNull().references(() => users.id, { onDelete: "set null" }),
  assignedBy: t.text().notNull().references(() => users.id, { onDelete: "set null" }),
  notes: t.text(),
  status: t.text({ enum: ["in_use", "released", "reserved"] })
    .notNull()
    .default("in_use"),
  createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  ...updatedAtColumn,
}), table => [
  index("idx_assignments_range_id").on(table.rangeId),
  index("idx_assignments_object_id").on(table.objectId),
  index("idx_assignments_status").on(table.status),
  index("idx_assignments_assigned_to").on(table.assignedTo),
  index("idx_assignments_range_object").on(
    table.rangeId,
    table.objectId,
    table.status,
  ),
]);

export const auditLog = sqliteTable(
  "audit_log",
  t => ({
    id: t.text().primaryKey(),
    entityType: t.text({ enum: ["range", "assignment", "user"] }).notNull(),
    entityId: t.text().notNull(),
    action: t.text({
      enum: [
        "create",
        "update",
        "delete",
        "assign",
        "release",
        "deprecate",
      ],
    }).notNull(),
    actor: t.text({ enum: ["system", "admin", "user"] }).notNull(),
    actorUserId: t.text().references(() => users.id, { onDelete: "set null" }),
    beforeState: t.text(),
    afterState: t.text(),
    description: t.text(),
    createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  }),
  table => [
    index("idx_audit_entity_id").on(table.entityId),
    index("idx_audit_created_at").on(table.createdAt),
    index("idx_audit_actor").on(table.actor),
  ],
);

export const syncMeta = sqliteTable("sync_meta", t => ({
  id: t.text().primaryKey(),
  deviceId: t.text().notNull(),
  lastSyncedAt: t.integer(),
  pendingOps: t.integer().notNull().default(0),
  lastError: t.text(),
  ...updatedAtColumn,
}));

export const syncQueue = sqliteTable(
  "sync_queue",
  t => ({
    id: t.text().primaryKey(),
    deviceId: t.text().notNull(),
    entityType: t.text({ enum: ["range", "assignment"] }).notNull(),
    entityId: t.text().notNull(),
    operation: t.text({
      enum: ["create", "update", "delete", "assign", "release", "deprecate"],
    }).notNull(),
    payload: t.text().notNull(),
    syncStatus: t.text({ enum: ["pending", "synced", "conflict", "failed"] }).notNull().default("pending"),
    retryCount: t.integer().notNull().default(0),
    createdAt: t.integer({ mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
    ...updatedAtColumn,
    syncedAt: t.integer({ mode: "timestamp" }),
  }),
  table => [
    index("idx_queue_sync_status").on(table.syncStatus),
    index("idx_queue_entity").on(table.entityType, table.entityId),
    index("idx_queue_device").on(table.deviceId),
  ],
);
