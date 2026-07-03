ALTER TABLE `id_ranges` ADD `publisher` text;--> statement-breakpoint
ALTER TABLE `id_ranges` ADD `environment` text DEFAULT 'dev' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_ranges_publisher` ON `id_ranges` (`publisher`);--> statement-breakpoint
CREATE INDEX `idx_ranges_environment` ON `id_ranges` (`environment`);