CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`intentPublicId` varchar(64),
	`nodeId` varchar(64),
	`eventType` varchar(128) NOT NULL,
	`outcome` enum('accepted','rejected','pending','verified','failed') NOT NULL,
	`actorPseudonym` varchar(128) NOT NULL,
	`summary` text NOT NULL,
	`occurredAt` timestamp NOT NULL,
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_events_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`operationType` enum('deploy','restart','configuration promote','backup verify') NOT NULL,
	`scope` text NOT NULL,
	`risk` enum('low','moderate','high','critical') NOT NULL,
	`rollbackMethod` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`state` enum('draft','proposed','approved','rejected','expired','executed','verified') NOT NULL DEFAULT 'proposed',
	`createdBy` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intents_id` PRIMARY KEY(`id`),
	CONSTRAINT `intents_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `mesh_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`region` varchar(128) NOT NULL,
	`role` varchar(256) NOT NULL,
	`cluster` enum('Alpha','Beta') NOT NULL,
	`publicKeyFingerprint` varchar(256) NOT NULL,
	`enrollmentStatus` enum('pending','enrolled','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mesh_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `mesh_nodes_nodeId_unique` UNIQUE(`nodeId`)
);
--> statement-breakpoint
CREATE TABLE `node_status_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`observedAt` timestamp NOT NULL,
	`version` varchar(128) NOT NULL,
	`uptimeClass` varchar(128) NOT NULL,
	`applicationReadiness` enum('ready','degraded','not_ready','unknown') NOT NULL,
	`reachability` enum('reachable','unreachable','unknown') NOT NULL,
	`verificationState` enum('verified','failed','pending') NOT NULL,
	`narrative` text NOT NULL,
	`signedReceiptHash` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `node_status_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(64) NOT NULL,
	`nodeId` varchar(64),
	`kind` enum('node_unreachable','verification_failed','intent_expired','health_beat_missed') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`message` text NOT NULL,
	`detectedAt` timestamp NOT NULL,
	`acknowledgedAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_publicId_unique` UNIQUE(`publicId`)
);
