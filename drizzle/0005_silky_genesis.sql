PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`mesocycle_id` text,
	`template_id` text NOT NULL,
	`week_number` integer,
	`day_number` integer,
	`training_date` text,
	`status` text NOT NULL,
	`notes` text,
	`source` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`mesocycle_id`) REFERENCES `mesocycles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "mesocycle_id", "template_id", "week_number", "day_number", "training_date", "status", "notes", "source", "created_at", "updated_at") SELECT "id", "mesocycle_id", "template_id", "week_number", "day_number", "training_date", "status", "notes", "source", "created_at", "updated_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;