PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_id_assignments` (
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
	CONSTRAINT `fk_id_assignments_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_id_assignments_assignedBy_users_id_fk` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_id_assignments`(`id`, `rangeId`, `objectId`, `objectName`, `objectType`, `assignedTo`, `assignedBy`, `notes`, `status`, `createdAt`, `updatedAt`) SELECT `id`, `rangeId`, `objectId`, `objectName`, `objectType`, `assignedTo`, `assignedBy`, `notes`, `status`, `createdAt`, `updatedAt` FROM `id_assignments`;--> statement-breakpoint
DROP TABLE `id_assignments`;--> statement-breakpoint
ALTER TABLE `__new_id_assignments` RENAME TO `id_assignments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_id_ranges` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`startId` integer NOT NULL,
	`endId` integer NOT NULL,
	`owner` text NOT NULL,
	`publisher` text,
	`environment` text DEFAULT 'dev' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`createdBy` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')),
	`updatedAt` integer DEFAULT (strftime('%s', 'now')),
	CONSTRAINT `fk_id_ranges_owner_users_id_fk` FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_id_ranges_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_id_ranges`(`id`, `name`, `description`, `startId`, `endId`, `owner`, `publisher`, `environment`, `status`, `createdBy`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `description`, `startId`, `endId`, `owner`, `publisher`, `environment`, `status`, `createdBy`, `createdAt`, `updatedAt` FROM `id_ranges`;--> statement-breakpoint
DROP TABLE `id_ranges`;--> statement-breakpoint
ALTER TABLE `__new_id_ranges` RENAME TO `id_ranges`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_assignments_range_id` ON `id_assignments` (`rangeId`);--> statement-breakpoint
CREATE INDEX `idx_assignments_object_id` ON `id_assignments` (`objectId`);--> statement-breakpoint
CREATE INDEX `idx_assignments_status` ON `id_assignments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assignments_assigned_to` ON `id_assignments` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `idx_assignments_range_object` ON `id_assignments` (`rangeId`,`objectId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_ranges_status` ON `id_ranges` (`status`);--> statement-breakpoint
CREATE INDEX `idx_ranges_owner` ON `id_ranges` (`owner`);--> statement-breakpoint
CREATE INDEX `idx_ranges_publisher` ON `id_ranges` (`publisher`);--> statement-breakpoint
CREATE INDEX `idx_ranges_environment` ON `id_ranges` (`environment`);