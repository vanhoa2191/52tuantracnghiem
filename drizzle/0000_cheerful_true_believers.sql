CREATE TABLE `answers` (
	`attempt_id` text NOT NULL,
	`question` integer NOT NULL,
	`choice` text NOT NULL,
	`is_correct` integer NOT NULL,
	`answered_at` integer NOT NULL,
	PRIMARY KEY(`attempt_id`, `question`),
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assessment_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`period` text NOT NULL,
	`ratings` text NOT NULL,
	`evidence` text NOT NULL,
	`note` text NOT NULL,
	`next_step` text NOT NULL,
	`snapshot` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assessments_child_period_idx` ON `assessment_revisions` (`child_id`,`period`,`created_at`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`week` integer NOT NULL,
	`content_version` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attempts_child_week_idx` ON `attempts` (`child_id`,`week`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_draft_per_week_idx` ON `attempts` (`child_id`,`week`) WHERE "attempts"."completed_at" IS NULL;--> statement-breakpoint
CREATE TABLE `children` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `children_owner_idx` ON `children` (`owner_id`);--> statement-breakpoint
CREATE TABLE `journals` (
	`child_id` text NOT NULL,
	`week` integer NOT NULL,
	`note` text NOT NULL,
	`done` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `week`),
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `week_progress` (
	`child_id` text NOT NULL,
	`week` integer NOT NULL,
	`first_attempt_id` text NOT NULL,
	`first_completed_at` integer NOT NULL,
	PRIMARY KEY(`child_id`, `week`),
	FOREIGN KEY (`child_id`) REFERENCES `children`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`first_attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action
);
