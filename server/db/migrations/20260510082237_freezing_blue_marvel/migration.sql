CREATE TABLE `accounts` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`username` text,
	`accessToken` text,
	`provider` text NOT NULL,
	`providerUserId` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	CONSTRAINT `fk_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`actorUserId` text,
	`beforeState` text,
	`afterState` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	CONSTRAINT `fk_audit_log_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `id_assignments` (
	`id` text PRIMARY KEY,
	`rangeId` text NOT NULL,
	`objectId` integer NOT NULL,
	`objectName` text NOT NULL,
	`objectType` text NOT NULL,
	`assignedTo` text NOT NULL,
	`assignedBy` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'in_use' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	CONSTRAINT `fk_id_assignments_rangeId_id_ranges_id_fk` FOREIGN KEY (`rangeId`) REFERENCES `id_ranges`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_id_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `id_ranges` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`startId` integer NOT NULL,
	`endId` integer NOT NULL,
	`owner` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdBy` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	CONSTRAINT `fk_id_ranges_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`id` text PRIMARY KEY,
	`deviceId` text NOT NULL,
	`lastSyncedAt` integer,
	`pendingOps` integer DEFAULT 0 NOT NULL,
	`lastError` text,
	`updatedAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` text PRIMARY KEY,
	`deviceId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`operation` text NOT NULL,
	`payload` text NOT NULL,
	`syncStatus` text DEFAULT 'pending' NOT NULL,
	`retryCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	`syncedAt` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`name` text,
	`email` text NOT NULL,
	`avatarUrl` text,
	`role` text DEFAULT 'developer' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user_provider` ON `accounts` (`userId`,`provider`);--> statement-breakpoint
CREATE INDEX `idx_accounts_provider_user` ON `accounts` (`provider`,`providerUserId`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity_id` ON `audit_log` (`entityId`);--> statement-breakpoint
CREATE INDEX `idx_audit_created_at` ON `audit_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_audit_actor` ON `audit_log` (`actor`);--> statement-breakpoint
CREATE INDEX `idx_assignments_range_id` ON `id_assignments` (`rangeId`);--> statement-breakpoint
CREATE INDEX `idx_assignments_object_id` ON `id_assignments` (`objectId`);--> statement-breakpoint
CREATE INDEX `idx_assignments_status` ON `id_assignments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assignments_assigned_to` ON `id_assignments` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `idx_assignments_range_object` ON `id_assignments` (`rangeId`,`objectId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_ranges_status` ON `id_ranges` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ranges_owner` ON `id_ranges` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_queue_sync_status` ON `sync_queue` (`syncStatus`);--> statement-breakpoint
CREATE INDEX `idx_queue_entity` ON `sync_queue` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_queue_device` ON `sync_queue` (`deviceId`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);