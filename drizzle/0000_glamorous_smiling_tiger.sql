CREATE TABLE `exercise_muscle_coefficients` (
	`exercise_id` text NOT NULL,
	`muscle` text NOT NULL,
	`coefficient` real NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_muscle_coefficients_unique_idx` ON `exercise_muscle_coefficients` (`exercise_id`,`muscle`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`default_method` text NOT NULL,
	`target_rep_range` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `logged_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`template_exercise_id` text NOT NULL,
	`set_index` integer NOT NULL,
	`load_text` text NOT NULL,
	`reps` integer NOT NULL,
	`notes` text,
	`pain` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_exercise_id`) REFERENCES `workout_template_exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `logged_sets_unique_set_idx` ON `logged_sets` (`session_id`,`template_exercise_id`,`set_index`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`training_date` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `workout_template_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`programmed_sets` integer NOT NULL,
	`method` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_template_exercises_position_idx` ON `workout_template_exercises` (`template_id`,`position`);--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rotation_order` integer NOT NULL
);
