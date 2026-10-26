CREATE TABLE `atmos_node_receipt_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`nonce` varchar(256) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atmos_node_receipt_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `atmos_node_receipt_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
