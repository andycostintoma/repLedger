CREATE TABLE `mesocycles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`weeks` integer NOT NULL,
	`days_per_week` integer NOT NULL,
	`started_at` text,
	`completed_at` text,
	`template_meso_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`template_meso_id`) REFERENCES `template_mesocycles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `template_mesocycles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`frequency` text NOT NULL,
	`gender` text NOT NULL,
	`weeks` integer NOT NULL,
	`days_per_week` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `exercises` ADD `primary_muscle` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `equipment` text DEFAULT 'unknown' NOT NULL;