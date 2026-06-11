ALTER TABLE `sessions` ADD `mesocycle_id` text REFERENCES mesocycles(id);--> statement-breakpoint
ALTER TABLE `sessions` ADD `week_number` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `day_number` integer;--> statement-breakpoint
ALTER TABLE `sessions` ADD `source` text;