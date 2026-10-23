CREATE TABLE `atmos_authority_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`nonce` varchar(256) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atmos_authority_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `atmos_authority_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
--> statement-breakpoint
CREATE TABLE `atmos_authority_mutations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mutationId` varchar(64) NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atmos_authority_mutations_id` PRIMARY KEY(`id`),
	CONSTRAINT `atmos_authority_mutations_mutationId_unique` UNIQUE(`mutationId`)
);
