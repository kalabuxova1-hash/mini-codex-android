CREATE TABLE `phone_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text,
	`last_seen` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phone_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`owner` text NOT NULL,
	`tool` text NOT NULL,
	`arguments` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `phone_jobs_request_key_unique` ON `phone_jobs` (`request_key`);--> statement-breakpoint
CREATE TABLE `phone_result_chunks` (
	`job_id` text NOT NULL,
	`part` integer NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`job_id`, `part`),
	FOREIGN KEY (`job_id`) REFERENCES `phone_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
