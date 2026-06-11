ALTER TABLE `workout_template_exercises` ADD `target_rep_range` text DEFAULT '12-20' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` DROP COLUMN `default_method`;--> statement-breakpoint
ALTER TABLE `exercises` DROP COLUMN `target_rep_range`;