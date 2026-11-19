CREATE TABLE `tesseract_a_witness_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`nonce` varchar(256) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tesseract_a_witness_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `tesseract_a_witness_challenges_challengeId_unique` UNIQUE(`challengeId`)
);
--> statement-breakpoint
CREATE TABLE `tesseract_a_witness_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receiptHash` varchar(256) NOT NULL,
	`challengeId` varchar(64) NOT NULL,
	`witnessNodeId` varchar(64) NOT NULL,
	`observationSetHash` varchar(256) NOT NULL,
	`observationCount` int NOT NULL,
	`receiptJson` text NOT NULL,
	`verifiedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tesseract_a_witness_receipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `tesseract_a_witness_receipts_receiptHash_unique` UNIQUE(`receiptHash`)
);
