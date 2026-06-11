CREATE TABLE `exercise_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`template_exercise_id` text NOT NULL,
	`pain_after` integer,
	`notes` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_exercise_id`) REFERENCES `workout_template_exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_feedback_unique_idx` ON `exercise_feedback` (`session_id`,`template_exercise_id`);--> statement-breakpoint
CREATE TABLE `muscle_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`muscle` text NOT NULL,
	`soreness` integer,
	`pump` integer,
	`workload` text,
	`notes` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `muscle_feedback_unique_idx` ON `muscle_feedback` (`session_id`,`muscle`);--> statement-breakpoint
CREATE TABLE `next_session_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`muscle` text NOT NULL,
	`suggestion` text NOT NULL,
	`status` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `next_session_suggestions_unique_idx` ON `next_session_suggestions` (`session_id`,`muscle`);