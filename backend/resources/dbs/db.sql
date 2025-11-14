

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS dynabench;

-- Switch to the dynabench database
USE dynabench;

DROP TABLE IF EXISTS `validations`;
DROP TABLE IF EXISTS `examples`;
DROP TABLE IF EXISTS `_yoyo_log`;
DROP TABLE IF EXISTS `_yoyo_migration`;
DROP TABLE IF EXISTS `_yoyo_version`;
DROP TABLE IF EXISTS `round_user_example_info`;
DROP TABLE IF EXISTS `badges`;
DROP TABLE IF EXISTS `contexts`;
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `datasets`;
DROP TABLE IF EXISTS `leaderboard_configurations`;
DROP TABLE IF EXISTS `leaderboard_snapshots`;
DROP TABLE IF EXISTS `models`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `task_proposals`;
DROP TABLE IF EXISTS `task_user_permissions`;
DROP TABLE IF EXISTS `yoyo_lock`;
DROP TABLE IF EXISTS `historical_data`;
DROP TABLE IF EXISTS `task_categories`;
DROP TABLE IF EXISTS `challenges_types`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `rounds`;
DROP TABLE IF EXISTS `tasks`;


--
-- Table structure for table `_yoyo_log`
--

CREATE TABLE `_yoyo_log` (
  `id` varchar(36) NOT NULL,
  `migration_hash` varchar(64) DEFAULT NULL,
  `migration_id` varchar(255) DEFAULT NULL,
  `operation` varchar(10) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `hostname` varchar(255) DEFAULT NULL,
  `comment` varchar(255) DEFAULT NULL,
  `created_at_utc` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `_yoyo_migration`
--

CREATE TABLE `_yoyo_migration` (
  `migration_hash` varchar(64) NOT NULL,
  `migration_id` varchar(255) DEFAULT NULL,
  `applied_at_utc` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`migration_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `_yoyo_version`
--

CREATE TABLE `_yoyo_version` (
  `version` int NOT NULL,
  `installed_at_utc` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `realname` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `affiliation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `examples_verified_correct` int DEFAULT NULL,
  `examples_submitted` int DEFAULT NULL,
  `examples_verified` int DEFAULT NULL,
  `forgot_password_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `forgot_password_token_expiry_date` datetime DEFAULT NULL,
  `avatar_url` text COLLATE utf8mb4_general_ci,
  `models_submitted` int DEFAULT '0',
  `unseen_notifications` int DEFAULT '0',
  `streak_days` int DEFAULT '0',
  `streak_days_last_model_wrong` datetime DEFAULT NULL,
  `streak_examples` int DEFAULT '0',
  `admin` tinyint(1) DEFAULT '0',
  `settings_json` text COLLATE utf8mb4_general_ci,
  `total_fooled` int DEFAULT '0',
  `total_verified_fooled` int DEFAULT '0',
  `total_retracted` int DEFAULT '0',
  `api_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metadata_json` text COLLATE utf8mb4_general_ci,
  `total_verified_not_correct_fooled` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4932 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `desc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_updated` datetime DEFAULT NULL,
  `cur_round` int NOT NULL,
  `hidden` tinyint(1) DEFAULT '1',
  `owner_uid` int DEFAULT NULL,
  `task_code` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `submitable` tinyint(1) DEFAULT '0',
  `create_endpoint` tinyint(1) DEFAULT NULL,
  `gpu` tinyint(1) DEFAULT NULL,
  `extra_torchserve_config` text COLLATE utf8mb4_general_ci,
  `config_yaml` text COLLATE utf8mb4_general_ci,
  `general_instructions` text COLLATE utf8mb4_general_ci,
  `instructions_md` mediumtext COLLATE utf8mb4_general_ci,
  `instance_type` text COLLATE utf8mb4_general_ci,
  `instance_count` int DEFAULT '1',
  `aws_region` text COLLATE utf8mb4_general_ci,
  `s3_bucket` text COLLATE utf8mb4_general_ci,
  `eval_server_id` text COLLATE utf8mb4_general_ci,
  `active` tinyint(1) DEFAULT '0',
  `validate_non_fooling` tinyint(1) NOT NULL DEFAULT '0',
  `unpublished_models_in_leaderboard` tinyint(1) NOT NULL DEFAULT '0',
  `num_matching_validations` int NOT NULL DEFAULT '3',
  `dynalab_threshold` int NOT NULL DEFAULT '3',
  `dynalab_hr_diff` int NOT NULL DEFAULT '24',
  `has_predictions_upload` tinyint(1) DEFAULT '0',
  `predictions_upload_instructions_md` text COLLATE utf8mb4_general_ci,
  `is_building` tinyint(1) DEFAULT '0',
  `unique_validators_for_example_tags` tinyint(1) DEFAULT '0',
  `train_file_upload_instructions_md` text COLLATE utf8mb4_general_ci,
  `build_sqs_queue` text COLLATE utf8mb4_general_ci,
  `eval_sqs_queue` text COLLATE utf8mb4_general_ci,
  `is_decen_task` tinyint(1) DEFAULT '0',
  `task_aws_account_id` text COLLATE utf8mb4_general_ci,
  `task_gateway_predict_prefix` text COLLATE utf8mb4_general_ci,
  `context` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'min',
  `dataperf` tinyint(1) DEFAULT NULL,
  `lambda_model` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mlcube_tutorial_markdown` text COLLATE utf8mb4_general_ci,
  `mlsphere_json` json DEFAULT NULL,
  `dynamic_adversarial_data_collection` int DEFAULT NULL,
  `dynamic_adversarial_data_validation` int NOT NULL DEFAULT '1',
  `challenge_type` int DEFAULT NULL,
  `decen_queue` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `decen_bucket` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `decen_aws_region` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_url` varchar(550) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `documentation_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `accept_sandbox_creation` int DEFAULT '1',
  `creation_example_md` text COLLATE utf8mb4_general_ci,
  `max_amount_examples_on_a_day` int DEFAULT '1000',
  `bucket_for_aditional_example_data` text COLLATE utf8mb4_general_ci,
  `submitable_predictions` int DEFAULT '0',
  `is_finished` int DEFAULT '0',
  `show_trends` int DEFAULT '1',
  `show_leaderboard` int DEFAULT '1',
  `show_user_leaderboard` int DEFAULT '1',
  `show_username_leaderboard` int DEFAULT '1',
  `show_user_leaderboard_csv` int DEFAULT '0',
  `leaderboard_description` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `task_code` (`task_code`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


--
-- Table structure for table `rounds`
--

CREATE TABLE `rounds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tid` int NOT NULL,
  `rid` int NOT NULL,
  `secret` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `url` text COLLATE utf8mb4_general_ci,
  `desc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `longdesc` text COLLATE utf8mb4_general_ci,
  `total_fooled` int DEFAULT '0',
  `total_collected` int DEFAULT '0',
  `total_time_spent` time DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `total_verified_fooled` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `tid` (`tid`),
  KEY `ix_rounds_rid` (`rid`),
  CONSTRAINT `rounds_ibfk_1` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `round_user_example_info`
--

CREATE TABLE `round_user_example_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `r_realid` int NOT NULL,
  `total_fooled` int DEFAULT '0',
  `total_verified_not_correct_fooled` int DEFAULT '0',
  `examples_submitted` int DEFAULT '0',
  `amount_examples_on_a_day` int DEFAULT NULL,
  `last_used` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  KEY `r_realid` (`r_realid`),
  CONSTRAINT `round_user_example_info_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `round_user_example_info_ibfk_2` FOREIGN KEY (`r_realid`) REFERENCES `rounds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2621 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



CREATE TABLE `contexts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `r_realid` int NOT NULL,
  `context_json` text COLLATE utf8mb4_general_ci,
  `total_used` int DEFAULT NULL,
  `last_used` datetime DEFAULT NULL,
  `metadata_json` text COLLATE utf8mb4_general_ci,
  `tag` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `r_realid` (`r_realid`),
  CONSTRAINT `contexts_ibfk_1` FOREIGN KEY (`r_realid`) REFERENCES `rounds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=489563 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




--
-- Table structure for table `badges`
--

CREATE TABLE `badges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `metadata_json` text COLLATE utf8mb4_general_ci,
  `awarded` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  CONSTRAINT `badges_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=29917 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Table structure for table `challenges_types`
--

CREATE TABLE `challenges_types` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


--
-- Table structure for table `datasets`
--

CREATE TABLE `datasets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `tid` int NOT NULL,
  `rid` int DEFAULT '0',
  `desc` varchar(255) DEFAULT NULL,
  `access_type` enum('scoring','standard','hidden') DEFAULT 'scoring',
  `longdesc` text,
  `source_url` text,
  `log_access_type` enum('owner','user') DEFAULT 'owner',
  `tags` tinyint(1) DEFAULT '1',
  `has_downstream` int DEFAULT '0',
  `weight` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `tid` (`tid`),
  CONSTRAINT `datasets_tid` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=314 DEFAULT CHARSET=latin1;

--
-- Table structure for table `examples`
--

CREATE TABLE `examples` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cid` int NOT NULL,
  `uid` int DEFAULT NULL,
  `text` text COLLATE utf8mb4_general_ci,
  `verifier_preds` text COLLATE utf8mb4_general_ci,
  `model_wrong` tinyint(1) DEFAULT NULL,
  `retracted` tinyint(1) DEFAULT NULL,
  `verified_correct` tinyint(1) DEFAULT NULL,
  `generated_datetime` datetime DEFAULT NULL,
  `time_elapsed` time DEFAULT NULL,
  `annotator_id` text COLLATE utf8mb4_general_ci,
  `model_endpoint_name` text COLLATE utf8mb4_general_ci,
  `metadata_json` mediumtext COLLATE utf8mb4_general_ci,
  `split` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'undecided',
  `flagged` tinyint(1) DEFAULT '0',
  `total_verified` int DEFAULT '0',
  `verified` tinyint(1) DEFAULT '0',
  `verified_incorrect` tinyint(1) DEFAULT '0',
  `verified_flagged` tinyint(1) DEFAULT '0',
  `tag` text COLLATE utf8mb4_general_ci,
  `input_json` text COLLATE utf8mb4_general_ci,
  `output_json` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `cid` (`cid`),
  KEY `uid` (`uid`),
  CONSTRAINT `examples_ibfk_1` FOREIGN KEY (`cid`) REFERENCES `contexts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `examples_ibfk_2` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=459168 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `historical_data`
--

CREATE TABLE `historical_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `history` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_task_history` (`user_id`,`task_id`,`history`(2000)),
  KEY `task_id` (`task_id`),
  CONSTRAINT `historical_data_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`),
  CONSTRAINT `historical_data_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18306 DEFAULT CHARSET=latin1;

--
-- Table structure for table `leaderboard_configurations`
--

CREATE TABLE `leaderboard_configurations` (
  `tid` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `uid` int NOT NULL,
  `create_datetime` datetime DEFAULT NULL,
  `configuration_json` text NOT NULL,
  `desc` text,
  PRIMARY KEY (`name`,`tid`),
  KEY `leaderboard_configurations_tid` (`tid`),
  KEY `leaderboard_configurations_uid` (`uid`),
  CONSTRAINT `leaderboard_configurations_tid` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `leaderboard_configurations_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `leaderboard_snapshots`
--

CREATE TABLE `leaderboard_snapshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tid` int NOT NULL,
  `uid` int NOT NULL,
  `desc` text,
  `create_datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_json` longtext NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tid_name_pair` (`tid`,`name`),
  KEY `leaderboard_snapshots_uid` (`uid`),
  CONSTRAINT `leaderboard_snapshots_tid` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `leaderboard_snapshots_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=latin1;

--
-- Table structure for table `models`
--

CREATE TABLE `models` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tid` int NOT NULL,
  `uid` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `shortname` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `desc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `longdesc` text COLLATE utf8mb4_general_ci,
  `papers` text COLLATE utf8mb4_general_ci,
  `is_published` tinyint(1) DEFAULT '0',
  `params` bigint DEFAULT NULL,
  `languages` text COLLATE utf8mb4_general_ci,
  `license` text COLLATE utf8mb4_general_ci,
  `upload_datetime` datetime DEFAULT NULL,
  `model_card` text COLLATE utf8mb4_general_ci,
  `deployment_status` enum('uploaded','processing','deployed','created','failed','unknown','takendown','predictions_upload','takendownnonactive') COLLATE utf8mb4_general_ci DEFAULT 'unknown',
  `secret` text COLLATE utf8mb4_general_ci,
  `endpoint_name` text COLLATE utf8mb4_general_ci,
  `light_model` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_in_the_loop` tinyint(1) DEFAULT NULL,
  `source_url` text COLLATE utf8mb4_general_ci,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `evaluation_status_json` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `tid` (`tid`),
  KEY `uid` (`uid`),
  CONSTRAINT `models_ibfk_1` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `models_ibfk_2` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=1646 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_general_ci,
  `metadata_json` text COLLATE utf8mb4_general_ci,
  `seen` tinyint(1) DEFAULT '0',
  `created` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=65420 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `generated_datetime` datetime DEFAULT NULL,
  `uid` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `tid` (`uid`),
  CONSTRAINT `refresh_tokens_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=19760 DEFAULT CHARSET=latin1;


--
-- Table structure for table `scores`
--

CREATE TABLE `scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mid` int NOT NULL,
  `r_realid` int DEFAULT NULL,
  `desc` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `longdesc` text COLLATE utf8mb4_general_ci,
  `pretty_perf` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `perf` float DEFAULT NULL,
  `raw_upload_data` longtext COLLATE utf8mb4_general_ci,
  `eval_id_start` int DEFAULT '-1',
  `eval_id_end` int DEFAULT '-1',
  `metadata_json` longtext COLLATE utf8mb4_general_ci,
  `did` int DEFAULT NULL,
  `memory_utilization` float DEFAULT NULL COMMENT 'Unit: GiB',
  `examples_per_second` float DEFAULT NULL,
  `raw_output_s3_uri` text COLLATE utf8mb4_general_ci,
  `fairness` float DEFAULT NULL COMMENT 'raw perf metric on fairness perturbed dataset',
  `robustness` float DEFAULT NULL COMMENT 'raw perf metric on robustness perturbed datast',
  `perf_std` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mid` (`mid`),
  KEY `rid` (`r_realid`),
  KEY `dataset_id` (`did`),
  CONSTRAINT `dataset_id` FOREIGN KEY (`did`) REFERENCES `datasets` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`mid`) REFERENCES `models` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=33058 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `task_categories`
--

CREATE TABLE `task_categories` (
  `id_task` int DEFAULT NULL,
  `id_category` int DEFAULT NULL,
  KEY `id_task` (`id_task`),
  KEY `id_category` (`id_category`),
  CONSTRAINT `task_categories_ibfk_1` FOREIGN KEY (`id_task`) REFERENCES `tasks` (`id`),
  CONSTRAINT `task_categories_ibfk_2` FOREIGN KEY (`id_category`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Table structure for table `task_proposals`
--

CREATE TABLE `task_proposals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `task_code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `desc` varchar(255) DEFAULT NULL,
  `longdesc` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_code` (`task_code`),
  UNIQUE KEY `name` (`name`),
  KEY `task_proposals_uid` (`uid`),
  CONSTRAINT `task_proposals_uid` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=557 DEFAULT CHARSET=latin1;

--
-- Table structure for table `task_user_permissions`
--

CREATE TABLE `task_user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tid` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_user_permissions_ibfk_1` (`uid`),
  KEY `task_user_permissions_ibfk_2` (`tid`),
  CONSTRAINT `task_user_permissions_ibfk_1` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `task_user_permissions_ibfk_2` FOREIGN KEY (`tid`) REFERENCES `tasks` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `tasks`
--

--
-- Table structure for table `validations`
--

CREATE TABLE `validations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `label` enum('flagged','correct','incorrect','placeholder') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mode` enum('owner','user') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `eid` int DEFAULT NULL,
  `metadata_json` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `validations_ibfk_1` (`eid`),
  KEY `validations_ibfk_2` (`uid`),
  CONSTRAINT `validations_ibfk_1` FOREIGN KEY (`eid`) REFERENCES `examples` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `validations_ibfk_2` FOREIGN KEY (`uid`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=495130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `yoyo_lock`
--

CREATE TABLE `yoyo_lock` (
  `locked` int NOT NULL DEFAULT '1',
  `ctime` timestamp NULL DEFAULT NULL,
  `pid` int NOT NULL,
  PRIMARY KEY (`locked`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



--
-- Insert data
--

-- Users

INSERT INTO `users` (`id`, `username`, `email`, `password`, `realname`, `affiliation`, `examples_verified_correct`, `examples_submitted`, `examples_verified`, `avatar_url`, `models_submitted`, `unseen_notifications`, `streak_days`, `streak_examples`, `admin`, `total_fooled`, `total_verified_fooled`, `total_retracted`, `api_token`, `metadata_json`, `total_verified_not_correct_fooled`)
VALUES
(1, 'user1', 'user1@example.com', 'password1', 'John Doe', 'Company A', 10, 20, 15, 'https://example.com/avatar1.jpg', 5, 2, 30, 50, 0, 8, 6, 2, 'token1', '{"key1": "value1"}', 3);

-- Challenges_type

INSERT INTO `challenges_types` (`id`, `name`, `url`) VALUES
(1, 'challenge', 'https://example.com/mock-challenge');


-- Task
INSERT INTO `tasks` (
	  `id`,
    `name`,
    `cur_round`,
    `task_code`,
    `validate_non_fooling`,
    `unpublished_models_in_leaderboard`,
    `num_matching_validations`,
    `dynalab_threshold`,
    `challenge_type`,
    `show_user_leaderboard_csv`,
    `show_leaderboard`,
    `dynalab_hr_diff`,
    `hidden`,
    `submitable`,
    `active`,
    `dynamic_adversarial_data_collection`,
    `dynamic_adversarial_data_validation`,
    `image_url`,
    `bucket_for_aditional_example_data`
) VALUES (
	  1,
    'Adversarial Nibbler',
    1,
    'adversarial-nibbler',
    0,
    0,
    3,
    3,
    1,
    1,
    1,
    24,
    0,
    0,
    1,
    1,
    0,
    'https://d2p5o30oix33cf.cloudfront.net/assets/cats4mlv2.jpg',
    'dataperf/adversarial-nibbler/'
);


-- Rounds

INSERT INTO `rounds` (
	`id`,
    `tid`,
    `rid`,
    `secret`,
    `url`,
    `desc`,
    `longdesc`,
    `total_fooled`,
    `total_collected`,
    `total_time_spent`,
    `start_datetime`,
    `end_datetime`,
    `total_verified_fooled`
) VALUES (
	1,
    1,
    1,
    'RoundSecret123',
    'https://round-url.com',
    'Round Description',
    'Long Description for the round',
    0,
    0,
    NULL,
    '2024-01-10 12:00:00',
    '2024-01-10 15:30:00',
    0
);

-- contexts

INSERT INTO `contexts` (
	`id`,
    `r_realid`,
    `context_json`,
    `total_used`,
    `last_used`,
    `metadata_json`,
    `tag`
) VALUES (
	1,
    1,
    '{}',
    0,
    '2024-01-10 14:30:00',
    '{}',
    ''
);
