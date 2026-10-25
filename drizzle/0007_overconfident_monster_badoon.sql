CREATE TABLE `atmos_control_plane_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stateKey` varchar(64) NOT NULL,
	`mode` enum('ready','maintenance') NOT NULL DEFAULT 'ready',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atmos_control_plane_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `atmos_control_plane_state_stateKey_unique` UNIQUE(`stateKey`)
);
