CREATE TABLE `application_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` varchar(64) NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`endpointUrl` varchar(512) NOT NULL,
	`publicKeyPem` text NOT NULL,
	`scopes` text NOT NULL,
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `application_integrations_applicationId_unique` UNIQUE(`applicationId`),
	CONSTRAINT `application_integrations_nodeId_unique` UNIQUE(`nodeId`)
);
