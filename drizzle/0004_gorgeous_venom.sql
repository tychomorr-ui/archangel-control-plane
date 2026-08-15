CREATE TABLE `planning_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`objective` text NOT NULL,
	`assumptions` text NOT NULL,
	`affectedApplicationIds` text NOT NULL,
	`posture` enum('draft','review-ready','archived') NOT NULL DEFAULT 'draft',
	`risk` enum('low','moderate','high','critical') NOT NULL,
	`rollbackHypothesis` text NOT NULL,
	`createdBy` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_scenarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `planning_scenarios_publicId_unique` UNIQUE(`publicId`)
);
