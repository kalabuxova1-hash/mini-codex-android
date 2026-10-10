CREATE TABLE `pc_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`request_key` text NOT NULL,
	`tool` text NOT NULL,
	`arguments` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`result` text,
	FOREIGN KEY (`link_id`) REFERENCES `pc_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pc_jobs_request_key_unique` ON `pc_jobs` (`request_key`);--> statement-breakpoint
CREATE TABLE `pc_links` (
	`id` text PRIMARY KEY NOT NULL,
	`inviter` text NOT NULL,
	`email` text NOT NULL,
	`code_hash` text,
	`expires_at` integer NOT NULL,
	`owner` text,
	`token_hash` text,
	`label` text DEFAULT '' NOT NULL,
	`capabilities` text DEFAULT '[]' NOT NULL,
	`phone_access` integer DEFAULT 0 NOT NULL,
	`state` text DEFAULT 'invited' NOT NULL,
	`last_seen` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pc_links_code_hash_unique` ON `pc_links` (`code_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `pc_links_token_hash_unique` ON `pc_links` (`token_hash`);