CREATE TABLE `operator_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`passwordHash` text NOT NULL,
	`sessionVersion` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operator_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `operator_credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `operator_passkeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`credentialId` varchar(512) NOT NULL,
	`publicKey` text NOT NULL,
	`counter` int NOT NULL DEFAULT 0,
	`transports` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `operator_passkeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `operator_passkeys_credentialId_unique` UNIQUE(`credentialId`)
);
