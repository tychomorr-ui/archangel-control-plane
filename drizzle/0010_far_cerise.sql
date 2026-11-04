CREATE TABLE `operator_webauthn_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challenge` varchar(512) NOT NULL,
	`username` varchar(128) NOT NULL,
	`purpose` enum('registration','authentication') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `operator_webauthn_challenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `operator_webauthn_challenges_challenge_unique` UNIQUE(`challenge`)
);
