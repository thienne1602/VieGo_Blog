-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Phiên bản:           12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for viego_blog
CREATE DATABASE IF NOT EXISTS `viego_blog` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `viego_blog`;

-- Dumping structure for table viego_blog.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` enum('user_register','user_login','user_logout','user_update','user_delete','user_ban','user_unban','post_create','post_update','post_delete','post_publish','comment_create','comment_update','comment_delete','report_create','report_resolve','admin_action','system_event','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `meta_data` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` enum('info','warning','error','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_activity_logs_user_id` (`user_id`),
  KEY `ix_activity_logs_created_at` (`created_at`),
  KEY `ix_activity_logs_target_id` (`target_id`),
  KEY `ix_activity_logs_action_type` (`action_type`),
  KEY `ix_activity_logs_severity` (`severity`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.activity_logs: ~0 rows (approximately)

-- Dumping structure for table viego_blog.banned_keywords
CREATE TABLE IF NOT EXISTS `banned_keywords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `keyword` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_banned_keywords_keyword` (`keyword`),
  KEY `created_by` (`created_by`),
  KEY `ix_banned_keywords_is_active` (`is_active`),
  KEY `ix_banned_keywords_created_at` (`created_at`),
  CONSTRAINT `banned_keywords_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.banned_keywords: ~3 rows (approximately)
INSERT INTO `banned_keywords` (`id`, `keyword`, `severity`, `description`, `created_by`, `created_at`, `updated_at`, `is_active`) VALUES
	(1, 'spam', 'medium', 'Từ khóa spam', 1, NULL, NULL, 1),
	(2, 'scam', 'high', 'Từ khóa lừa đảo', 1, NULL, NULL, 1),
	(3, 'hack', 'high', 'Từ khóa hack', 1, NULL, NULL, 1),
	(4, 'đụ má', 'medium', 'xúc phạm', 12, '2025-11-06 07:29:08', '2025-11-06 07:29:08', 1);

-- Dumping structure for table viego_blog.bookings
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tour_id` int NOT NULL,
  `user_id` int NOT NULL,
  `date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `participants` int NOT NULL,
  `adults` int DEFAULT '0',
  `children` int DEFAULT '0',
  `infants` int DEFAULT '0',
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `base_price` float DEFAULT '0',
  `adult_price` float DEFAULT '0',
  `child_price` float DEFAULT '0',
  `infant_price` float DEFAULT '0',
  `discount_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_amount` float DEFAULT '0',
  `total_price` float NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('office','bank_transfer','online') COLLATE utf8mb4_unicode_ci DEFAULT 'office',
  `payment_status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'unpaid',
  `status` enum('pending','confirmed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_bookings_tour_id` (`tour_id`),
  KEY `ix_bookings_user_id` (`user_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`),
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.bookings: ~16 rows (approximately)
INSERT INTO `bookings` (`id`, `tour_id`, `user_id`, `date`, `participants`, `adults`, `children`, `infants`, `full_name`, `email`, `phone`, `address`, `base_price`, `adult_price`, `child_price`, `infant_price`, `discount_code`, `discount_amount`, `total_price`, `currency`, `payment_method`, `payment_status`, `status`, `notes`, `created_at`, `updated_at`) VALUES
	(1, 1, 10, '2025-11-13', 2, 2, 0, 0, NULL, NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 4500000, 'VND', 'office', 'unpaid', 'cancelled', NULL, '2025-11-01 03:54:56', '2025-11-01 12:58:49'),
	(2, 1, 10, '2025-11-01', 2, 1, 0, 1, 'thien', 'ngocthien160224@gmail.com', '0948283916', 'abc 1234', 3375000, 2500000, 2000000, 1250000, NULL, 0, 3375000, 'VND', 'bank_transfer', 'unpaid', 'cancelled', NULL, '2025-11-01 07:00:08', '2025-11-01 12:58:47'),
	(3, 4, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'ngocthien160224@gmail.com', '0948283916', 'zâ', 7200000, 4500000, 3600000, 2250000, NULL, 0, 7200000, 'VND', 'office', 'unpaid', 'cancelled', NULL, '2025-11-01 07:11:51', '2025-11-01 07:30:42'),
	(4, 1, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'ngocthien160224@gmail.com', '0948283916', '1112111', 4500000, 2500000, 2000000, 1250000, NULL, 0, 4500000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 07:18:55', '2025-11-01 07:30:19'),
	(5, 5, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'ergsgr', 3600000, 1800000, 1440000, 900000, NULL, 0, 3600000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 07:39:13', '2025-11-01 07:39:46'),
	(6, 3, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'qqqq', 6080000, 3200000, 2560000, 1600000, NULL, 0, 6080000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 08:20:04', '2025-11-01 08:20:23'),
	(7, 5, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'âcsdc', 3600000, 1800000, 1440000, 900000, NULL, 0, 3600000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 12:46:17', '2025-11-01 12:47:02'),
	(8, 2, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'zbgg', 9860000, 5800000, 4640000, 2900000, NULL, 0, 9860000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 12:52:04', '2025-11-01 12:58:35'),
	(9, 5, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'sad', 3600000, 1800000, 1440000, 900000, NULL, 0, 3600000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 12:59:55', '2025-11-01 13:15:27'),
	(10, 2, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'dâd', 9860000, 5800000, 4640000, 2900000, NULL, 0, 9860000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 13:17:57', '2025-11-01 13:20:18'),
	(11, 5, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'ssss', 3600000, 1800000, 1440000, 900000, NULL, 0, 3600000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 13:21:27', '2025-11-01 13:23:43'),
	(12, 5, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'gfcgfcfg', 3600000, 1800000, 1440000, 900000, NULL, 0, 3600000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 13:39:55', '2025-11-01 13:47:33'),
	(13, 2, 10, '2025-11-01', 2, 2, 0, 0, 'thien', 'thien160224@gmail.com', '0948283916', 'đwwdwd', 9860000, 5800000, 4640000, 2900000, NULL, 0, 9860000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 13:51:08', '2025-11-01 13:52:20'),
	(14, 5, 10, '2025-11-12', 4, 4, 0, 0, 'Hồng Anh', 'quachtranhonganh01062005@gmail.com', '0812260438', 'abc', 7200000, 1800000, 1440000, 900000, NULL, 0, 7200000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 15:10:10', '2025-11-01 15:10:53'),
	(15, 6, 10, '2025-11-13', 10, 1, 8, 1, 'Hồng Anh', 'quachtranhonganh01062005@gmail.com', '0812260438', 'gfchgchfghf', 8690000, 1100000, 880000, 550000, NULL, 0, 8690000, 'VND', 'office', 'unpaid', 'confirmed', NULL, '2025-11-01 15:52:19', '2025-11-01 15:52:46'),
	(16, 1, 10, '2025-11-07', 6, 2, 2, 2, 'lê huỳnh nhiên', 'lehuynhnhien.424@gmail.com', '0923456978', 'fsdfsfdsfds', 10350000, 2500000, 2000000, 1250000, NULL, 0, 10350000, 'VND', 'office', 'unpaid', 'pending', NULL, '2025-11-01 15:58:32', '2025-11-01 15:58:32'),
	(17, 1, 10, '2025-11-08', 9, 9, 0, 0, 'Xuân Dương', 'doduong0949447395@gmail.com', '0945634568', 'ấdfsdf', 20250000, 2500000, 2000000, 1250000, NULL, 0, 20250000, 'VND', 'office', 'unpaid', 'pending', NULL, '2025-11-01 15:59:25', '2025-11-01 15:59:25');

-- Dumping structure for table viego_blog.bookmarks
CREATE TABLE IF NOT EXISTS `bookmarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `post_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bookmark` (`user_id`,`post_id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookmarks_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.bookmarks: ~13 rows (approximately)
INSERT INTO `bookmarks` (`id`, `user_id`, `post_id`, `created_at`) VALUES
	(1, 1, 1, '2025-10-12 07:40:56'),
	(2, 1, 3, '2025-10-12 07:40:56'),
	(3, 1, 4, '2025-10-12 07:40:56'),
	(4, 2, 1, '2025-10-12 07:40:56'),
	(5, 2, 2, '2025-10-12 07:40:56'),
	(6, 2, 5, '2025-10-12 07:40:56'),
	(7, 3, 2, '2025-10-12 07:40:56'),
	(8, 3, 4, '2025-10-12 07:40:56'),
	(9, 3, 6, '2025-10-12 07:40:56'),
	(10, 4, 3, '2025-10-12 07:40:56'),
	(11, 4, 5, '2025-10-12 07:40:56'),
	(12, 5, 1, '2025-10-12 07:40:56'),
	(13, 5, 6, '2025-10-12 07:40:56');

-- Dumping structure for table viego_blog.chats
CREATE TABLE IF NOT EXISTS `chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image','audio','file','location','system') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `room_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conversation_type` enum('direct','group','public') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('sent','delivered','read','deleted') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `translated_message` text COLLATE utf8mb4_unicode_ci,
  `auto_translated` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_chats_receiver_id` (`receiver_id`),
  KEY `ix_chats_room_id` (`room_id`),
  KEY `ix_chats_sender_id` (`sender_id`),
  KEY `ix_chats_created_at` (`created_at`),
  CONSTRAINT `chats_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chats_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.chats: ~55 rows (approximately)
INSERT INTO `chats` (`id`, `message`, `message_type`, `file_url`, `file_type`, `room_id`, `conversation_type`, `status`, `language`, `translated_message`, `auto_translated`, `created_at`, `updated_at`, `read_at`, `sender_id`, `receiver_id`) VALUES
	(1, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:34:58', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(2, 'hi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:40:32', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(3, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:41:14', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(4, 'hi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:41:19', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(5, 'hi ông', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:56:36', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(6, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 00:58:12', '2025-11-05 02:05:29', '2025-11-05 02:05:29', 7, 10),
	(7, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:06:17', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(8, 'hi]\\', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:06:40', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(9, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:07:22', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(10, 'hi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:25:33', '2025-11-06 06:44:52', '2025-11-06 06:44:52', 10, 7),
	(11, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:26:38', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(12, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:27:03', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(13, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:34:11', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(14, 'hi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:34:16', '2025-11-05 01:39:20', '2025-11-05 01:39:20', 8, 10),
	(15, 'hé lô bnaj\'', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:39:32', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(16, '[Ảnh]', 'image', '/uploads/images/10_20251105013941_networking-basics.png', 'image/png', NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:39:42', '2025-11-05 01:40:29', '2025-11-05 01:40:29', 10, 8),
	(17, 'he lô', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:40:44', '2025-11-05 02:04:24', '2025-11-05 02:04:24', 8, 10),
	(18, 'hi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:55:23', '2025-11-05 02:04:24', '2025-11-05 02:04:24', 8, 10),
	(19, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:56:20', '2025-11-05 02:04:24', '2025-11-05 02:04:24', 8, 10),
	(20, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 01:56:29', '2025-11-05 02:04:24', '2025-11-05 02:04:24', 8, 10),
	(21, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 02:04:23', '2025-11-05 02:16:39', '2025-11-05 02:16:39', 10, 8),
	(22, 'alo bạn ơi', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 02:15:44', '2025-11-05 02:16:39', '2025-11-05 02:16:39', 10, 8),
	(23, '{"lat": 10.825560729067083, "lng": 106.70164705122167, "address": "10.825560729067083, 106.70164705122167"}', 'location', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:07:23', '2025-11-05 11:08:27', '2025-11-05 11:08:27', 8, 10),
	(24, '[Ghi âm]', 'audio', '/uploads/audio/8_20251105062826_audio_1762324106316.webm', 'audio/webm', NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:28:27', '2025-11-05 11:08:27', '2025-11-05 11:08:27', 8, 10),
	(25, '[Ghi âm]', 'audio', '/uploads/audio/8_20251105062845_audio_1762324125197.webm', 'audio/webm', NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:28:46', '2025-11-05 11:08:27', '2025-11-05 11:08:27', 8, 10),
	(26, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:49:56', '2025-11-05 06:51:34', '2025-11-05 06:51:34', 8, 11),
	(27, 'hi bro', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:50:20', '2025-11-05 06:51:34', '2025-11-05 06:51:34', 8, 11),
	(28, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:51:07', '2025-11-05 06:51:34', '2025-11-05 06:51:34', 8, 11),
	(29, 'heloo', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-05 06:51:39', '2025-11-05 06:52:12', '2025-11-05 06:52:12', 11, 8),
	(30, 'thien đã tạo nhóm', 'system', NULL, NULL, 'group_ed8e8d2d30084957', 'group', 'read', 'vi', NULL, 0, '2025-11-05 07:45:00', '2025-11-05 10:58:37', '2025-11-05 10:58:37', 8, NULL),
	(31, 'aloo', 'text', NULL, NULL, 'group_ed8e8d2d30084957', 'group', 'read', 'vi', NULL, 0, '2025-11-05 07:45:13', '2025-11-05 10:58:37', '2025-11-05 10:58:37', 8, NULL),
	(32, 'alo\\', 'text', NULL, NULL, 'group_ed8e8d2d30084957', 'group', 'read', 'vi', NULL, 0, '2025-11-05 10:58:42', '2025-11-05 10:59:33', '2025-11-05 10:59:33', 11, NULL),
	(33, 'Chào bạn,\n\nChúng tôi đã nhận được yêu cầu hỗ trợ của bạn về: abc\n\nPhản hồi:\nhi\n\n\nTrân trọng,\nĐội ngũ hỗ trợ', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-06 07:30:37', '2025-11-06 07:30:37', NULL, 12, 12),
	(34, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-06 12:59:42', '2025-11-06 13:32:12', '2025-11-06 13:32:12', 10, 8),
	(35, 'alo', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-06 12:59:49', '2025-11-06 13:32:12', '2025-11-06 13:32:12', 10, 8),
	(36, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-06 13:02:48', '2025-11-06 13:25:19', '2025-11-06 13:25:19', 11, 10),
	(37, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-06 13:13:43', '2025-11-06 13:25:19', '2025-11-06 13:25:19', 11, 10),
	(38, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'read', 'vi', NULL, 0, '2025-11-07 09:55:39', '2025-11-07 09:56:04', '2025-11-07 09:56:03', 11, 12),
	(39, 'alo bạn', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:56:59', '2025-11-07 09:56:59', NULL, 12, 11),
	(40, 'hi', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:57:20', '2025-11-07 09:57:20', NULL, 12, 11),
	(41, 'alo bạn', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:57:58', '2025-11-07 09:57:58', NULL, 12, 11),
	(42, 'ba', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:58:02', '2025-11-07 09:58:02', NULL, 12, 11),
	(43, 'ho', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:58:08', '2025-11-07 09:58:08', NULL, 12, 11),
	(44, 'alooo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 09:58:40', '2025-11-07 09:58:40', NULL, 12, 11),
	(45, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:20:02', '2025-11-07 10:20:02', NULL, 12, 11),
	(46, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:20:29', '2025-11-07 10:20:29', NULL, 12, 11),
	(47, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:20:34', '2025-11-07 10:20:34', NULL, 12, 11),
	(48, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:20:50', '2025-11-07 10:20:50', NULL, 12, 11),
	(49, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:21:08', '2025-11-07 10:21:08', NULL, 11, 8),
	(50, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:21:32', '2025-11-07 10:21:32', NULL, 11, 8),
	(51, 'a', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:22:02', '2025-11-07 10:22:02', NULL, 12, 11),
	(52, 'ho', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:22:35', '2025-11-07 10:22:35', NULL, 12, 11),
	(53, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:22:56', '2025-11-07 10:22:56', NULL, 12, 11),
	(54, 'alo bạn', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 10:41:06', '2025-11-07 10:41:06', NULL, 12, 11),
	(55, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 11:00:10', '2025-11-07 11:00:10', NULL, 11, 8),
	(56, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 11:00:30', '2025-11-07 11:00:30', NULL, 12, 8),
	(57, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 11:00:44', '2025-11-07 11:00:44', NULL, 12, 11),
	(58, '👋 Chào bạn!', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 11:13:55', '2025-11-07 11:13:55', NULL, 11, 8),
	(59, 'alo', 'text', NULL, NULL, NULL, 'direct', 'sent', 'vi', NULL, 0, '2025-11-07 11:14:06', '2025-11-07 11:14:06', NULL, 12, 8);

-- Dumping structure for table viego_blog.comments
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `like_count` int DEFAULT '0',
  `is_edited` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `level` int DEFAULT '0',
  `likes_count` int DEFAULT '0',
  `replies_count` int DEFAULT '0',
  `flagged` tinyint(1) DEFAULT '0',
  `flag_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `translated_content` text COLLATE utf8mb4_unicode_ci,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'vi',
  `status` enum('pending','approved','rejected','spam') COLLATE utf8mb4_unicode_ci DEFAULT 'approved',
  `author_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_parent` (`parent_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.comments: ~22 rows (approximately)
INSERT INTO `comments` (`id`, `post_id`, `user_id`, `parent_id`, `content`, `like_count`, `is_edited`, `created_at`, `updated_at`, `level`, `likes_count`, `replies_count`, `flagged`, `flag_reason`, `translated_content`, `language`, `status`, `author_id`) VALUES
	(1, 1, 4, NULL, 'Rất hữu ích! Đang plan đi trong tháng này.', 35, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 35, 0, 0, NULL, NULL, 'vi', 'approved', 4),
	(2, 1, 6, NULL, 'Bạn book homestay qua app nào vậy?', 1, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 1, 0, 0, NULL, NULL, 'vi', 'approved', 6),
	(3, 2, 5, NULL, 'Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.', 16, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 16, 0, 0, NULL, NULL, 'vi', 'approved', 5),
	(4, 2, 1, NULL, 'Mình cũng muốn đi lắm nhưng chưa có cơ hội.', 31, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 31, 0, 0, NULL, NULL, 'vi', 'approved', 1),
	(5, 2, 4, NULL, 'Cảm ơn bạn đã review chi tiết!', 4, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 4, 0, 0, NULL, NULL, 'vi', 'approved', 4),
	(6, 3, 4, NULL, 'Mình đã đi rồi, thực sự rất đẹp như bạn mô tả!', 2, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 2, 0, 0, NULL, NULL, 'vi', 'approved', 4),
	(7, 3, 6, NULL, 'Bạn book homestay qua app nào vậy?', 46, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 46, 0, 0, NULL, NULL, 'vi', 'approved', 6),
	(8, 4, 2, NULL, 'Có đông người không bạn? Mình sợ mùa peak.', 45, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 45, 0, 0, NULL, NULL, 'vi', 'approved', 2),
	(9, 4, 1, NULL, 'Mình cũng muốn đi lắm nhưng chưa có cơ hội.', 18, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 18, 0, 0, NULL, NULL, 'vi', 'approved', 1),
	(10, 4, 4, NULL, 'Bạn có thể chia sẻ thêm về chi phí được không?', 46, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 46, 0, 0, NULL, NULL, 'vi', 'approved', 4),
	(11, 4, 6, NULL, 'View đẹp quá! Mình phải đi thử mới được.', 4, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 4, 0, 0, NULL, NULL, 'vi', 'approved', 6),
	(12, 5, 2, NULL, 'Lưu lại để đi sau này. Thanks bạn!', 1, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 1, 0, 0, NULL, NULL, 'vi', 'approved', 2),
	(13, 5, 2, NULL, 'View đẹp quá! Mình phải đi thử mới được.', 5, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 5, 0, 0, NULL, NULL, 'vi', 'approved', 2),
	(14, 6, 1, NULL, 'Ảnh đẹp quá! Bạn chụp bằng máy gì vậy?', 19, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 19, 0, 0, NULL, NULL, 'vi', 'approved', 1),
	(15, 6, 6, NULL, 'Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.', 9, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 9, 0, 0, NULL, NULL, 'vi', 'approved', 6),
	(16, 6, 3, NULL, 'View đẹp quá! Mình phải đi thử mới được.', 45, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 45, 0, 0, NULL, NULL, 'vi', 'approved', 3),
	(17, 6, 3, NULL, 'Có đông người không bạn? Mình sợ mùa peak.', 20, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 20, 0, 0, NULL, NULL, 'vi', 'approved', 3),
	(18, 6, 1, NULL, 'Có nên đi vào mùa này không bạn?', 3, 0, '2025-10-12 02:37:36', '2025-10-20 05:56:16', 0, 3, 0, 0, NULL, NULL, 'vi', 'approved', 1),
	(19, 9, 7, NULL, 'đw', 0, 0, '2025-10-21 19:14:13', '2025-10-21 19:14:20', 0, 0, 1, 0, NULL, NULL, 'vi', 'pending', 7),
	(20, 9, 7, 19, 'dwd', 0, 0, '2025-10-21 19:14:20', '2025-10-21 19:14:20', 1, 0, 0, 0, NULL, NULL, 'vi', 'pending', 7),
	(21, 9, 9, NULL, 'Test comment from script', 0, 0, '2025-10-21 19:14:54', '2025-10-21 19:14:54', 0, 0, 0, 0, NULL, NULL, 'vi', 'pending', 9),
	(22, 9, 7, NULL, 'ădwad', 0, 0, '2025-10-21 19:15:41', '2025-10-21 19:15:44', 0, 1, 0, 0, NULL, NULL, 'vi', 'pending', 7),
	(23, 9, 7, NULL, 'đw', 0, 0, '2025-10-21 19:18:37', '2025-10-21 19:18:45', 0, 0, 1, 0, NULL, NULL, 'vi', 'approved', 7),
	(24, 9, 7, 23, 'dwd', 0, 0, '2025-10-21 19:18:45', '2025-10-21 19:18:45', 1, 0, 0, 0, NULL, NULL, 'vi', 'approved', 7),
	(25, 7, 8, NULL, 'anh đẹp trai quá', 0, 0, '2025-10-23 00:13:52', '2025-10-23 00:13:52', 0, 0, 0, 0, NULL, NULL, 'vi', 'approved', 8),
	(26, 18, 10, NULL, 'hi', 0, 0, '2025-10-31 20:02:05', '2025-10-31 20:02:05', 0, 0, 0, 0, NULL, NULL, 'vi', 'approved', 10),
	(27, 25, 10, NULL, 'hi', 0, 0, '2025-11-06 06:19:06', '2025-11-06 06:19:06', 0, 0, 0, 0, NULL, NULL, 'vi', 'approved', 10);

-- Dumping structure for table viego_blog.contacts
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('technical','account','content','payment','general','report','suggestion','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `response` text COLLATE utf8mb4_unicode_ci,
  `responded_at` datetime DEFAULT NULL,
  `responded_by` int DEFAULT NULL,
  `attachments` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `responded_by` (`responded_by`),
  KEY `ix_contacts_category` (`category`),
  KEY `ix_contacts_created_at` (`created_at`),
  KEY `ix_contacts_status` (`status`),
  KEY `ix_contacts_user_id` (`user_id`),
  KEY `ix_contacts_email` (`email`),
  KEY `ix_contacts_priority` (`priority`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `contacts_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `contacts_ibfk_3` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.contacts: ~1 rows (approximately)
INSERT INTO `contacts` (`id`, `user_id`, `name`, `email`, `phone`, `subject`, `message`, `category`, `status`, `priority`, `assigned_to`, `response`, `responded_at`, `responded_by`, `attachments`, `created_at`, `updated_at`, `resolved_at`) VALUES
	(1, 12, 'thien', 'thien160224@gmail.com', '0912546582', 'abc', '112333', 'report', 'resolved', 'medium', 12, 'hi\n', '2025-11-06 07:30:37', 12, NULL, '2025-11-06 07:26:27', '2025-11-06 07:30:37', '2025-11-06 07:30:37');

-- Dumping structure for table viego_blog.followers
CREATE TABLE IF NOT EXISTS `followers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL,
  `following_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `idx_follower` (`follower_id`),
  KEY `idx_following` (`following_id`),
  CONSTRAINT `followers_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `followers_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.followers: ~13 rows (approximately)
INSERT INTO `followers` (`id`, `follower_id`, `following_id`, `created_at`) VALUES
	(1, 6, 5, '2025-10-12 02:37:36'),
	(2, 6, 2, '2025-10-12 02:37:36'),
	(3, 2, 5, '2025-10-12 02:37:36'),
	(4, 2, 3, '2025-10-12 02:37:36'),
	(5, 2, 4, '2025-10-12 02:37:36'),
	(6, 3, 2, '2025-10-12 02:37:36'),
	(7, 3, 6, '2025-10-12 02:37:36'),
	(8, 3, 4, '2025-10-12 02:37:36'),
	(9, 4, 3, '2025-10-12 02:37:36'),
	(10, 4, 2, '2025-10-12 02:37:36'),
	(11, 5, 6, '2025-10-12 02:37:36'),
	(12, 5, 2, '2025-10-12 02:37:36'),
	(13, 5, 3, '2025-10-12 02:37:36');

-- Dumping structure for table viego_blog.follows
CREATE TABLE IF NOT EXISTS `follows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL COMMENT 'Người theo dõi',
  `following_id` int NOT NULL COMMENT 'Người được theo dõi',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `following_id` (`following_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_chk_1` CHECK ((`follower_id` <> `following_id`))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.follows: ~15 rows (approximately)
INSERT INTO `follows` (`id`, `follower_id`, `following_id`, `created_at`) VALUES
	(1, 1, 2, '2025-10-12 07:40:56'),
	(2, 1, 3, '2025-10-12 07:40:56'),
	(3, 1, 4, '2025-10-12 07:40:56'),
	(4, 2, 1, '2025-10-12 07:40:56'),
	(5, 2, 6, '2025-10-12 07:40:56'),
	(6, 3, 1, '2025-10-12 07:40:56'),
	(7, 3, 4, '2025-10-12 07:40:56'),
	(8, 3, 6, '2025-10-12 07:40:56'),
	(9, 4, 1, '2025-10-12 07:40:56'),
	(10, 4, 2, '2025-10-12 07:40:56'),
	(11, 4, 3, '2025-10-12 07:40:56'),
	(12, 5, 1, '2025-10-12 07:40:56'),
	(13, 5, 6, '2025-10-12 07:40:56'),
	(14, 6, 1, '2025-10-12 07:40:56'),
	(15, 6, 2, '2025-10-12 07:40:56');

-- Dumping structure for table viego_blog.friend_requests
CREATE TABLE IF NOT EXISTS `friend_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requester_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `status` enum('pending','accepted','rejected','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_friend_request` (`requester_id`,`receiver_id`),
  KEY `ix_friend_requests_status` (`status`),
  KEY `ix_friend_requests_requester_id` (`requester_id`),
  KEY `ix_friend_requests_created_at` (`created_at`),
  KEY `ix_friend_requests_receiver_id` (`receiver_id`),
  CONSTRAINT `friend_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `friend_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.friend_requests: ~6 rows (approximately)
INSERT INTO `friend_requests` (`id`, `requester_id`, `receiver_id`, `status`, `created_at`, `updated_at`, `responded_at`) VALUES
	(4, 10, 8, 'accepted', '2025-11-03 15:41:16', '2025-11-05 00:34:53', '2025-11-05 00:34:53'),
	(6, 10, 7, 'accepted', '2025-11-05 00:19:26', '2025-11-05 00:58:11', '2025-11-05 00:58:10'),
	(15, 11, 8, 'accepted', '2025-11-05 06:49:03', '2025-11-05 06:49:30', '2025-11-05 06:49:30'),
	(16, 10, 11, 'accepted', '2025-11-06 12:59:56', '2025-11-06 13:02:46', '2025-11-06 13:02:46'),
	(17, 12, 11, 'accepted', '2025-11-07 09:52:52', '2025-11-07 09:53:32', '2025-11-07 09:53:32'),
	(18, 12, 8, 'accepted', '2025-11-07 10:35:38', '2025-11-07 10:35:44', '2025-11-07 10:35:44');

-- Dumping structure for table viego_blog.group_chats
CREATE TABLE IF NOT EXISTS `group_chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_group_chats_room_id` (`room_id`),
  KEY `ix_group_chats_created_at` (`created_at`),
  KEY `ix_group_chats_created_by` (`created_by`),
  CONSTRAINT `group_chats_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.group_chats: ~0 rows (approximately)
INSERT INTO `group_chats` (`id`, `room_id`, `name`, `description`, `avatar_url`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'group_ed8e8d2d30084957', 'abc', '', NULL, 8, '2025-11-05 07:45:00', '2025-11-05 10:58:42');

-- Dumping structure for table viego_blog.group_members
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('admin','member') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `joined_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_member` (`group_id`,`user_id`),
  KEY `ix_group_members_group_id` (`group_id`),
  KEY `ix_group_members_user_id` (`user_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `group_chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.group_members: ~3 rows (approximately)
INSERT INTO `group_members` (`id`, `group_id`, `user_id`, `role`, `joined_at`) VALUES
	(1, 1, 8, 'admin', '2025-11-05 07:45:00'),
	(2, 1, 10, 'member', '2025-11-05 07:45:00'),
	(3, 1, 11, 'member', '2025-11-05 07:45:00');

-- Dumping structure for table viego_blog.likes
CREATE TABLE IF NOT EXISTS `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `post_id` int DEFAULT NULL,
  `comment_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_post_like` (`user_id`,`post_id`),
  UNIQUE KEY `unique_comment_like` (`user_id`,`comment_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_comment` (`comment_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_3` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.likes: ~32 rows (approximately)
INSERT INTO `likes` (`id`, `user_id`, `post_id`, `comment_id`, `created_at`) VALUES
	(1, 2, 6, NULL, '2025-10-12 02:37:36'),
	(2, 3, 6, NULL, '2025-10-12 02:37:36'),
	(3, 1, 6, NULL, '2025-10-12 02:37:36'),
	(4, 4, 6, NULL, '2025-10-12 02:37:36'),
	(5, 5, 6, NULL, '2025-10-12 02:37:36'),
	(6, 6, 4, NULL, '2025-10-12 02:37:36'),
	(7, 4, 4, NULL, '2025-10-12 02:37:36'),
	(8, 3, 4, NULL, '2025-10-12 02:37:36'),
	(9, 5, 4, NULL, '2025-10-12 02:37:36'),
	(10, 1, 4, NULL, '2025-10-12 02:37:36'),
	(11, 2, 4, NULL, '2025-10-12 02:37:36'),
	(12, 5, 5, NULL, '2025-10-12 02:37:36'),
	(13, 3, 5, NULL, '2025-10-12 02:37:36'),
	(14, 1, 5, NULL, '2025-10-12 02:37:36'),
	(15, 6, 5, NULL, '2025-10-12 02:37:36'),
	(16, 2, 5, NULL, '2025-10-12 02:37:36'),
	(17, 4, 1, NULL, '2025-10-12 02:37:36'),
	(18, 1, 1, NULL, '2025-10-12 02:37:36'),
	(19, 3, 1, NULL, '2025-10-12 02:37:36'),
	(20, 2, 1, NULL, '2025-10-12 02:37:36'),
	(21, 5, 1, NULL, '2025-10-12 02:37:36'),
	(22, 6, 2, NULL, '2025-10-12 02:37:36'),
	(23, 4, 2, NULL, '2025-10-12 02:37:36'),
	(24, 5, 2, NULL, '2025-10-12 02:37:36'),
	(25, 3, 2, NULL, '2025-10-12 02:37:36'),
	(26, 1, 2, NULL, '2025-10-12 02:37:36'),
	(27, 4, 3, NULL, '2025-10-12 02:37:36'),
	(28, 5, 3, NULL, '2025-10-12 02:37:36'),
	(29, 2, 3, NULL, '2025-10-12 02:37:36'),
	(30, 6, 3, NULL, '2025-10-12 02:37:36'),
	(31, 1, 3, NULL, '2025-10-12 02:37:36'),
	(32, 3, 3, NULL, '2025-10-12 02:37:36');

-- Dumping structure for table viego_blog.locations
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` enum('restaurant','attraction','hotel','transport','shopping','entertainment') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'attraction',
  `subcategory` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` float DEFAULT '0',
  `reviews_count` int DEFAULT '0',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_hours` text COLLATE utf8mb4_unicode_ci,
  `price_range` enum('budget','mid-range','luxury') COLLATE utf8mb4_unicode_ci DEFAULT 'budget',
  `images` text COLLATE utf8mb4_unicode_ci,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `featured_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `amenities` text COLLATE utf8mb4_unicode_ci,
  `languages_spoken` text COLLATE utf8mb4_unicode_ci,
  `verified` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_city` (`city`),
  KEY `idx_country` (`country`),
  KEY `idx_coordinates` (`latitude`,`longitude`),
  KEY `fk_locations_created_by` (`created_by`),
  CONSTRAINT `fk_locations_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.locations: ~16 rows (approximately)
INSERT INTO `locations` (`id`, `name`, `slug`, `address`, `city`, `province`, `country`, `category`, `subcategory`, `rating`, `reviews_count`, `phone`, `website`, `email`, `opening_hours`, `price_range`, `images`, `latitude`, `longitude`, `description`, `image_url`, `featured_image`, `tags`, `amenities`, `languages_spoken`, `verified`, `status`, `created_at`, `updated_at`, `created_by`) VALUES
	(1, 'Vịnh Hạ Long', 'vịnh-hạ-long', 'Thành phố Hạ Long', 'Quảng Ninh', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 20.91010000, 107.18390000, 'Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi tuyệt đẹp', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(2, 'Phố Cổ Hội An', 'phố-cổ-hội-an', 'Phố cổ Hội An', 'Quảng Nam', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 15.88010000, 108.33800000, 'Thành phố cổ với kiến trúc độc đáo, đèn lồng lung linh', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(3, 'Phố Cổ Hà Nội', 'phố-cổ-hà-nội', 'Hoàn Kiếm', 'Hà Nội', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 21.02850000, 105.85420000, '36 phố phường với lịch sử hàng nghìn năm tuổi', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(4, 'Hồ Hoàn Kiếm', 'hồ-hoàn-kiếm', 'Trung tâm Hà Nội', 'Hà Nội', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 21.02850000, 105.85220000, 'Biểu tượng của Thủ đô Hà Nội, hồ nước ngọt trong lòng thành phố', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(5, 'Đà Lạt', 'đà-lạt', 'Thành phố Đà Lạt', 'Lâm Đồng', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 11.94040000, 108.45830000, 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(6, 'Sapa', 'sapa', 'Thị trấn Sa Pa', 'Lào Cai', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 22.33630000, 103.84380000, 'Ruộng bậc thang tuyệt đẹp, văn hóa dân tộc độc đáo', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(7, 'Nha Trang', 'nha-trang', 'Thành phố Nha Trang', 'Khánh Hòa', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 12.23880000, 109.19670000, 'Bãi biển đẹp nhất Việt Nam với nước biển trong xanh', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(8, 'Phú Quốc', 'phú-quốc', 'Đảo Phú Quốc', 'Kiên Giang', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 10.28990000, 103.98400000, 'Đảo ngọc với bãi biển hoang sơ và hải sản tươi ngon', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(9, 'Huế', 'huế', 'Thành phố Huế', 'Thừa Thiên Huế', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 16.46370000, 107.59090000, 'Cố đô với kiến trúc cung điện và lăng tẩm tráng lệ', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(10, 'Hồ Chí Minh', 'hồ-chí-minh', 'Trung tâm Quận 1', 'Hồ Chí Minh', NULL, 'Việt Nam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 10.77690000, 106.70090000, 'Thành phố năng động nhất Việt Nam với cuộc sống nhộn nhịp', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-12 02:37:36', '2025-10-12 07:43:18', NULL),
	(11, 'Ruộng bậc thang Sapa', 'ruộng-bậc-thang-sapa', 'Sapa, Lào Cai, Việt Nam', 'Sapa', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 22.33800000, 103.84420000, 'Ruộng bậc thang tuyệt đẹp của đồng bào dân tộc thiểu số. Phong cảnh núi non hùng vĩ và văn hóa độc đáo.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL),
	(12, 'Chợ Bến Thành', 'chợ-bến-thành', 'Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 'TP.HCM', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 10.77200000, 106.69800000, 'Chợ truyền thống nổi tiếng với đa dạng món ăn đường phố Sài Gòn. Trải nghiệm văn hóa ẩm thực miền Nam.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL),
	(13, 'Đảo Phú Quốc', 'dảo-phú-quốc', 'Phú Quốc, Kiên Giang, Việt Nam', 'Phú Quốc', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 10.28990000, 103.98400000, 'Đảo ngọc với bãi biển tuyệt đẹp và hải sản tươi ngon. Thiên đường nghỉ dưỡng lý tưởng.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL),
	(14, 'Cố Đô Huế', 'cố-do-huế', 'Huế, Thừa Thiên Huế, Việt Nam', 'Huế', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 16.46370000, 107.59090000, 'Di sản văn hóa thế giới với những công trình kiến trúc cổ kính và lăng tẩm vua chúa.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL),
	(15, 'Thành phố Đà Lạt', 'thành-phố-dà-lạt', 'Đà Lạt, Lâm Đồng, Việt Nam', 'Đà Lạt', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 11.94040000, 108.45830000, 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Thiên đường của du lịch nghỉ dưỡng và tham quan.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL),
	(16, 'Vườn Quốc Gia Phong Nha - Kẻ Bàng', 'vườn-quốc-gia-phong-nha---kẻ-bàng', 'Quảng Bình, Việt Nam', 'Quảng Bình', NULL, 'Vietnam', 'attraction', NULL, 0, 0, NULL, NULL, NULL, NULL, 'budget', NULL, 17.54530000, 106.14470000, 'Di sản thiên nhiên thế giới với hệ thống hang động đá vôi lớn nhất thế giới.', NULL, NULL, NULL, NULL, NULL, 0, 'active', '2025-10-31 04:50:12', '2025-10-31 04:50:11', NULL);

-- Dumping structure for table viego_blog.nfts
CREATE TABLE IF NOT EXISTS `nfts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_address` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `badge_type` enum('explorer','foodie','photographer','writer','adventurer','cultural','special') COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_level` enum('bronze','silver','gold','platinum','legendary') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rarity` enum('common','uncommon','rare','epic','legendary') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `animation_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `achievement_criteria` text COLLATE utf8mb4_unicode_ci,
  `points_required` int DEFAULT NULL,
  `locations_required` text COLLATE utf8mb4_unicode_ci,
  `posts_required` int DEFAULT NULL,
  `transaction_hash` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `block_number` int DEFAULT NULL,
  `gas_used` int DEFAULT NULL,
  `status` enum('minted','pending','failed','burned') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transferable` tinyint(1) DEFAULT NULL,
  `tradeable` tinyint(1) DEFAULT NULL,
  `unlocked` tinyint(1) DEFAULT NULL,
  `unlock_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `minted_at` datetime DEFAULT NULL,
  `owner_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_nfts_token_id` (`token_id`),
  KEY `ix_nfts_owner_id` (`owner_id`),
  KEY `ix_nfts_created_at` (`created_at`),
  CONSTRAINT `nfts_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.nfts: ~0 rows (approximately)

-- Dumping structure for table viego_blog.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_id` int DEFAULT NULL,
  `actor_id` int DEFAULT NULL,
  `action_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extra_data` text COLLATE utf8mb4_unicode_ci,
  `read_at` datetime DEFAULT NULL,
  `seen_at` datetime DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `is_seen` tinyint(1) DEFAULT '0',
  `metadata` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  KEY `idx_created` (`created_at`),
  KEY `notifications_ibfk_actor` (`actor_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notifications_ibfk_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores user notifications for likes, comments, messages, etc.';

-- Dumping data for table viego_blog.notifications: ~89 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_type`, `related_id`, `actor_id`, `action_url`, `extra_data`, `read_at`, `seen_at`, `is_read`, `is_seen`, `metadata`, `created_at`) VALUES
	(1, 7, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 10, 10, '/messages/10', NULL, '2025-11-06 06:44:43', NULL, 1, 0, NULL, '2025-11-04 18:25:34'),
	(2, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 11, 8, '/messages/8', NULL, '2025-11-05 01:39:50', NULL, 1, 0, NULL, '2025-11-04 18:26:38'),
	(3, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 12, 8, '/messages/8', NULL, '2025-11-05 01:39:50', NULL, 1, 0, NULL, '2025-11-04 18:27:03'),
	(4, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 13, 8, '/messages/8', NULL, '2025-11-05 01:39:50', NULL, 1, 0, NULL, '2025-11-04 18:34:11'),
	(5, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 14, 8, '/messages/8', NULL, '2025-11-05 01:35:34', NULL, 1, 0, NULL, '2025-11-04 18:34:16'),
	(6, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 15, 10, '/messages/10', NULL, '2025-11-05 01:41:01', NULL, 1, 0, NULL, '2025-11-04 18:39:32'),
	(7, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 16, 10, '/messages/10', NULL, '2025-11-05 01:40:27', NULL, 1, 0, NULL, '2025-11-04 18:39:42'),
	(8, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 17, 8, '/messages/8', NULL, '2025-11-05 02:08:15', NULL, 1, 0, NULL, '2025-11-04 18:40:44'),
	(9, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 18, 8, '/messages/8', NULL, '2025-11-05 02:08:15', NULL, 1, 0, NULL, '2025-11-04 18:55:23'),
	(10, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 19, 8, '/messages/8', NULL, '2025-11-05 02:08:15', NULL, 1, 0, NULL, '2025-11-04 18:56:20'),
	(11, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 20, 8, '/messages/8', NULL, '2025-11-05 02:08:10', NULL, 1, 0, NULL, '2025-11-04 18:56:29'),
	(12, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 21, 10, '/messages/10', NULL, '2025-11-05 02:17:10', NULL, 1, 0, NULL, '2025-11-04 19:04:23'),
	(13, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 22, 10, '/messages/10', NULL, '2025-11-05 02:16:36', NULL, 1, 0, NULL, '2025-11-04 19:15:44'),
	(14, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 23, 8, '/messages/8', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-04 23:07:23'),
	(15, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 24, 8, '/messages/8', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-04 23:28:27'),
	(16, 10, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 25, 8, '/messages/8', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-04 23:28:46'),
	(17, 8, 'friend_request', 'Lời mời kết bạn mới', 'ngocthien đã gửi cho bạn lời mời kết bạn', 'friend_request', 15, 11, '/profile/user?id=11', '{"request_id": 15}', '2025-11-05 06:49:31', NULL, 1, 0, NULL, '2025-11-04 23:49:03'),
	(18, 11, 'friend_request_accepted', 'Lời mời kết bạn được chấp nhận', 'thien đã chấp nhận lời mời kết bạn của bạn', 'user', 8, 8, '/profile/user?id=8', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-04 23:49:30'),
	(19, 11, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 26, 8, '/messages/8', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-04 23:49:56'),
	(20, 11, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 27, 8, '/messages/8', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-04 23:50:20'),
	(21, 11, 'message', 'Tin nhắn mới', 'thien đã gửi cho bạn một tin nhắn', 'chat', 28, 8, '/messages/8', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-04 23:51:07'),
	(22, 8, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 29, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-04 23:51:39'),
	(23, 10, 'message', 'Đã thêm vào nhóm chat', 'thien đã thêm bạn vào nhóm "abc"', 'group_chat', 1, 8, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-05 00:45:00'),
	(24, 11, 'message', 'Đã thêm vào nhóm chat', 'thien đã thêm bạn vào nhóm "abc"', 'group_chat', 1, 8, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-05 00:45:00'),
	(25, 8, 'message', 'Tin nhắn từ abc', 'thien: aloo', 'group_chat', 1, 8, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 10:52:51', NULL, 1, 0, NULL, '2025-11-05 00:45:13'),
	(26, 10, 'message', 'Tin nhắn từ abc', 'thien: aloo', 'group_chat', 1, 8, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-05 00:45:13'),
	(27, 11, 'message', 'Tin nhắn từ abc', 'thien: aloo', 'group_chat', 1, 8, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 10:58:00', NULL, 1, 0, NULL, '2025-11-05 00:45:13'),
	(28, 8, 'message', 'Tin nhắn từ abc', 'ngocthien: alo\\', 'group_chat', 1, 11, '/messages/group/group_ed8e8d2d30084957', NULL, NULL, NULL, 0, 0, NULL, '2025-11-05 03:58:42'),
	(29, 10, 'message', 'Tin nhắn từ abc', 'ngocthien: alo\\', 'group_chat', 1, 11, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 11:08:57', NULL, 1, 0, NULL, '2025-11-05 03:58:42'),
	(30, 11, 'message', 'Tin nhắn từ abc', 'ngocthien: alo\\', 'group_chat', 1, 11, '/messages/group/group_ed8e8d2d30084957', NULL, '2025-11-05 10:58:50', NULL, 1, 0, NULL, '2025-11-05 03:58:42'),
	(31, 12, 'contact_response', 'Phản hồi yêu cầu hỗ trợ', 'Yêu cầu hỗ trợ của bạn đã được phản hồi: abc', 'contact', 1, 12, '/contact/1', NULL, '2025-11-06 07:27:04', NULL, 1, 0, NULL, '2025-11-06 00:26:55'),
	(32, 12, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má', 'post', NULL, NULL, NULL, NULL, '2025-11-06 07:30:07', NULL, 1, 0, NULL, '2025-11-06 00:29:46'),
	(33, 12, 'contact_response', 'Phản hồi yêu cầu hỗ trợ', 'Yêu cầu hỗ trợ của bạn đã được phản hồi: abc', 'contact', 1, 12, '/contact/1', NULL, '2025-11-06 08:25:13', NULL, 1, 0, NULL, '2025-11-06 00:30:37'),
	(34, 12, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn về yêu cầu hỗ trợ', 'chat', 33, 12, '/messages/12', NULL, '2025-11-06 08:25:18', NULL, 1, 0, NULL, '2025-11-06 00:30:37'),
	(35, 11, 'info', 'Thông báo từ Moderator', 'hé lô', NULL, NULL, 12, NULL, NULL, '2025-11-06 07:42:26', NULL, 1, 0, NULL, '2025-11-06 00:41:42'),
	(36, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má', 'post', NULL, NULL, NULL, NULL, '2025-11-06 08:10:56', NULL, 1, 0, NULL, '2025-11-06 01:06:43'),
	(37, 11, 'post_banned', '📝 Cấm đăng bài', 'Bạn đã bị cấm đăng bài trong 30 phút. Lý do: Vi phạm quy định đăng bài\n\nBạn có thể đăng bài lại vào: 06/11/2025 08:38', 'user', NULL, 12, NULL, NULL, '2025-11-06 08:10:46', NULL, 1, 0, NULL, '2025-11-06 01:08:17'),
	(38, 11, 'post_banned', '📝 Cấm đăng bài', 'Bạn đã bị cấm đăng bài trong 30 phút. Lý do: Vi phạm quy định đăng bài\n\nBạn có thể đăng bài lại vào: 06/11/2025 08:38', 'user', NULL, 12, NULL, NULL, '2025-11-06 08:10:56', NULL, 1, 0, NULL, '2025-11-06 01:08:26'),
	(39, 11, 'post_banned', '📝 Cấm đăng bài', 'Bạn đã bị cấm đăng bài trong 30 phút. Lý do: Vi phạm quy định đăng bài\n\nBạn có thể đăng bài lại vào: 06/11/2025 08:38', 'user', NULL, 12, NULL, NULL, '2025-11-06 08:10:56', NULL, 1, 0, NULL, '2025-11-06 01:08:58'),
	(40, 11, 'info', 'Thông báo từ Moderator', 'm bị ban', NULL, NULL, 12, NULL, NULL, '2025-11-06 08:10:19', NULL, 1, 0, NULL, '2025-11-06 01:09:31'),
	(41, 10, 'account_banned', '🔒 Tài khoản bị khóa', 'Tài khoản của bạn đã bị khóa 30 phút. Lý do: Vi phạm quy định cộng đồng\n\nTài khoản sẽ được mở khóa vào: 06/11/2025 08:57', 'user', NULL, 12, NULL, NULL, '2025-11-06 08:45:15', NULL, 1, 0, NULL, '2025-11-06 01:27:16'),
	(42, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2}', '2025-11-06 08:46:22', NULL, 1, 0, NULL, '2025-11-06 01:46:08'),
	(43, 12, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 1', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 1}', '2025-11-06 12:05:07', NULL, 1, 0, NULL, '2025-11-06 05:04:07'),
	(44, 12, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 2', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 2}', '2025-11-06 12:06:08', NULL, 1, 0, NULL, '2025-11-06 05:05:13'),
	(45, 12, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 3\n⚠️ Bạn đã vi phạm quá nhiều lần. Tài khoản có thể bị khóa.', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 3}', '2025-11-06 12:06:03', NULL, 1, 0, NULL, '2025-11-06 05:05:37'),
	(46, 12, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 4\n⚠️ Bạn đã vi phạm quá nhiều lần. Tài khoản có thể bị khóa.', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 4}', '2025-11-06 12:09:33', NULL, 1, 0, NULL, '2025-11-06 05:06:30'),
	(47, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 1', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 1}', '2025-11-06 12:08:53', NULL, 1, 0, NULL, '2025-11-06 05:08:09'),
	(48, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 2', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 2}', '2025-11-06 12:09:00', NULL, 1, 0, NULL, '2025-11-06 05:08:18'),
	(49, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 3\n⚠️ Bạn đã vi phạm quá nhiều lần. Tài khoản có thể bị khóa.', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 3}', '2025-11-06 12:08:45', NULL, 1, 0, NULL, '2025-11-06 05:08:21'),
	(50, 11, 'violation_warning', '⚠️ Cảnh báo: Bài viết chứa từ khóa cấm', 'Bài viết của bạn chứa từ khóa cấm và không thể đăng. Từ khóa vi phạm: đụ má\n\nSố lần vi phạm: 4\n⚠️ Bạn đã vi phạm quá nhiều lần. Tài khoản có thể bị khóa.', 'post', NULL, NULL, NULL, '{"banned_keywords": [{"keyword": "\\u0111\\u1ee5 m\\u00e1", "severity": "medium", "description": "x\\u00fac ph\\u1ea1m"}], "content_type": "post", "severity": 2, "violation_count": 4}', '2025-11-06 12:08:57', NULL, 1, 0, NULL, '2025-11-06 05:08:50'),
	(51, 11, 'account_banned', '🔒 Tài khoản bị khóa', 'Tài khoản của bạn đã bị khóa 30 phút. Lý do: Vi phạm quy định cộng đồng - Đã vi phạm từ khóa cấm nhiều lần\n\nTài khoản sẽ được mở khóa vào: 06/11/2025 12:39', 'user', NULL, 12, NULL, NULL, '2025-11-06 13:18:22', NULL, 1, 0, NULL, '2025-11-06 05:09:51'),
	(52, 11, 'post_unbanned', '✅ Đã được phép đăng bài', 'Bạn đã được phép đăng bài trở lại.', 'user', NULL, NULL, NULL, NULL, '2025-11-06 13:18:22', NULL, 1, 0, NULL, '2025-11-06 05:31:45'),
	(53, 11, 'account_unbanned', '✅ Tài khoản đã được mở khóa', 'Tài khoản của bạn đã được mở khóa. Bạn có thể sử dụng lại tài khoản.', 'user', NULL, NULL, NULL, NULL, '2025-11-06 12:32:17', NULL, 1, 0, NULL, '2025-11-06 05:31:45'),
	(54, 11, 'post_banned', '📝 Cấm đăng bài', 'Bạn đã bị cấm đăng bài trong 30 phút. Lý do: Vi phạm quy định cộng đồng - Đã vi phạm từ khóa cấm nhiều lần\n\nBạn có thể đăng bài lại vào: 06/11/2025 13:20', 'user', NULL, 12, NULL, NULL, '2025-11-06 13:18:22', NULL, 1, 0, NULL, '2025-11-06 05:50:56'),
	(55, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 34, 10, '/messages/10', NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 05:59:42'),
	(56, 8, 'message', 'Tin nhắn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn một tin nhắn', 'chat', 35, 10, '/messages/10', NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 05:59:49'),
	(57, 11, 'friend_request', 'Lời mời kết bạn mới', 'Công Ty Du Lịch Việt Nam Pro đã gửi cho bạn lời mời kết bạn', 'friend_request', 16, 10, '/profile/user?id=10', '{"request_id": 16}', '2025-11-06 13:18:22', NULL, 1, 0, NULL, '2025-11-06 05:59:56'),
	(58, 10, 'friend_request_accepted', 'Lời mời kết bạn được chấp nhận', 'ngocthien đã chấp nhận lời mời kết bạn của bạn', 'user', 11, 11, '/profile/user?id=11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 06:02:46'),
	(59, 10, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 36, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 06:02:49'),
	(60, 10, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 37, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 06:13:43'),
	(61, 11, 'comment_banned', '💬 Cấm bình luận', 'Bạn đã bị cấm bình luận trong 1 ngày. Lý do: Vi phạm quy định cộng đồng - Đã vi phạm từ khóa cấm nhiều lần\n\nBạn có thể bình luận lại vào: 07/11/2025 13:14', 'user', NULL, 12, NULL, NULL, '2025-11-06 13:18:17', NULL, 1, 0, NULL, '2025-11-06 06:14:54'),
	(62, 11, 'post_unbanned', '✅ Đã được phép đăng bài', 'Bạn đã được phép đăng bài trở lại.', 'user', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 06:35:48'),
	(63, 11, 'comment_unbanned', '✅ Đã được phép bình luận', 'Bạn đã được phép bình luận trở lại.', 'user', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, '2025-11-06 06:35:48'),
	(64, 11, 'friend_request', 'Lời mời kết bạn mới', 'moderator1 đã gửi cho bạn lời mời kết bạn', 'friend_request', 17, 12, '/profile/user?id=12', '{"request_id": 17}', NULL, NULL, 0, 0, NULL, '2025-11-07 02:52:52'),
	(65, 12, 'friend_request_accepted', 'Lời mời kết bạn được chấp nhận', 'ngocthien đã chấp nhận lời mời kết bạn của bạn', 'user', 11, 11, '/profile/user?id=11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:53:32'),
	(66, 12, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 38, 11, '/messages/11', NULL, '2025-11-07 09:55:50', NULL, 1, 0, NULL, '2025-11-07 02:55:39'),
	(67, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 39, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:57:00'),
	(68, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 40, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:57:20'),
	(69, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 41, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:57:58'),
	(70, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 42, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:58:02'),
	(71, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 43, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:58:09'),
	(72, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 44, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 02:58:40'),
	(73, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 45, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:20:02'),
	(74, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 46, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:20:30'),
	(75, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 47, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:20:34'),
	(76, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 48, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:20:50'),
	(77, 8, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 49, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:21:08'),
	(78, 8, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 50, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:21:32'),
	(79, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 51, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:22:02'),
	(80, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 52, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:22:35'),
	(81, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 53, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:22:56'),
	(82, 8, 'friend_request', 'Lời mời kết bạn mới', 'moderator1 đã gửi cho bạn lời mời kết bạn', 'friend_request', 18, 12, '/profile/user?id=12', '{"request_id": 18}', NULL, NULL, 0, 0, NULL, '2025-11-07 03:35:38'),
	(83, 12, 'friend_request_accepted', 'Lời mời kết bạn được chấp nhận', 'thien đã chấp nhận lời mời kết bạn của bạn', 'user', 8, 8, '/profile/user?id=8', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:35:44'),
	(84, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 54, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 03:41:06'),
	(85, 8, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 55, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 04:00:10'),
	(86, 8, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 56, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 04:00:30'),
	(87, 11, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 57, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 04:00:44'),
	(88, 8, 'message', 'Tin nhắn mới', 'ngocthien đã gửi cho bạn một tin nhắn', 'chat', 58, 11, '/messages/11', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 04:13:55'),
	(89, 8, 'message', 'Tin nhắn mới', 'moderator1 đã gửi cho bạn một tin nhắn', 'chat', 59, 12, '/messages/12', NULL, NULL, NULL, 0, 0, NULL, '2025-11-07 04:14:06');

-- Dumping structure for table viego_blog.posts
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `excerpt` text COLLATE utf8mb4_unicode_ci,
  `featured_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author_id` int NOT NULL,
  `location_id` int DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `view_count` int DEFAULT '0',
  `like_count` int DEFAULT '0',
  `comment_count` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `content_type` enum('blog','video','photo','tour_guide') COLLATE utf8mb4_unicode_ci DEFAULT 'blog',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'vi',
  `reading_time` int DEFAULT '5',
  `images` text COLLATE utf8mb4_unicode_ci,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_embed` text COLLATE utf8mb4_unicode_ci,
  `location_lat` float DEFAULT NULL,
  `location_lng` float DEFAULT NULL,
  `location_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `difficulty_level` enum('easy','moderate','hard') COLLATE utf8mb4_unicode_ci DEFAULT 'easy',
  `views_count` int DEFAULT '0',
  `likes_count` int DEFAULT '0',
  `shares_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `featured` tinyint(1) DEFAULT '0',
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `meta_keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_interactive` tinyint(1) DEFAULT '0',
  `story_choices` text COLLATE utf8mb4_unicode_ci,
  `collaborative` tinyint(1) DEFAULT '0',
  `collaborators` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_author` (`author_id`),
  KEY `idx_status` (`status`),
  KEY `idx_category` (`category`),
  KEY `idx_published` (`published_at`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.posts: ~24 rows (approximately)
INSERT INTO `posts` (`id`, `title`, `slug`, `content`, `summary`, `excerpt`, `featured_image`, `author_id`, `location_id`, `category`, `tags`, `status`, `view_count`, `like_count`, `comment_count`, `is_featured`, `published_at`, `created_at`, `updated_at`, `content_type`, `language`, `reading_time`, `images`, `video_url`, `video_embed`, `location_lat`, `location_lng`, `location_name`, `location_address`, `difficulty_level`, `views_count`, `likes_count`, `shares_count`, `comments_count`, `featured`, `meta_title`, `meta_description`, `meta_keywords`, `is_interactive`, `story_choices`, `collaborative`, `collaborators`) VALUES
	(1, 'Hướng dẫn du lịch Hạ Long 3 ngày 2 đêm tiết kiệm', 'hướng-dẫn-du-lịch-hạ-long-3-ngày-2-đêm-tiết-kiệm', 'Vịnh Hạ Long là một trong những địa điểm du lịch nổi tiếng nhất Việt Nam. Sau chuyến đi vừa qua, mình xin chia sẻ kinh nghiệm du lịch Hạ Long tiết kiệm nhưng vẫn trọn vẹn.\n\n**Ngày 1: Khám phá phố cổ Hạ Long**\n- Buổi sáng: Di chuyển từ Hà Nội xuống Hạ Long (khoảng 3-4 tiếng)\n- Trưa: Ăn trưa tại chợ Hạ Long, thử hải sản tươi sống\n- Chiều: Tham quan Sun World Hạ Long Park, cáp treo lên đỉnh Bảo Đài\n- Tối: Dạo quanh phố cổ, thưởng thức ẩm thực địa phương\n\n**Ngày 2: Tour du thuyền Vịnh Hạ Long**\n- Cả ngày: Tham gia tour du thuyền 1 ngày (giá khoảng 400-600k/người)\n- Hoạt động: Chèo kayak, bơi lội, thăm hang động\n- Điểm đến: Hang Sửng Sốt, Đảo Titop, Làng chài\n\n**Ngày 3: Thăm quan thêm và về**\n- Sáng: Tham quan Quảng Ninh Museum (miễn phí)\n- Trưa: Ăn trưa và mua đặc sản\n- Chiều: Khởi hành về Hà Nội\n\n**Chi phí ước tính:** 2-3 triệu/người cho cả chuyến đi.', 'Kinh nghiệm du lịch Vịnh Hạ Long 3 ngày 2 đêm với chi phí tiết kiệm, tham quan đầy đủ các điểm đến nổi tiếng.', 'Kinh nghiệm du lịch Vịnh Hạ Long 3 ngày 2 đêm với chi phí tiết kiệm, tham quan đầy đủ các điểm đến nổi tiếng.', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 6, 1, 'travel', '["Hạ Long", "du lịch tiết kiệm", "3 ngày 2 đêm", "Quảng Ninh"]', 'published', 4488, 442, 0, 0, '2025-10-06 02:37:37', '2025-10-12 02:37:36', '2025-10-19 06:39:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 11, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(2, 'Top 10 quán ăn ngon nhất định phải thử khi đến Hội An', 'top-10-quán-ăn-ngon-nhất-định-phải-thử-khi-đến-hội-an', 'Hội An không chỉ nổi tiếng với phố cổ mà còn là thiên đường ẩm thực. Dưới đây là 10 quán ăn mình đã thử và rất hài lòng:\n\n**1. Cao Lầu Thanh (22 Thái Phiên)**\n- Món đặc sản: Cao lầu\n- Giá: 30-40k/bát\n- Đánh giá: 5⭐\n\n**2. Bánh Mì Phượng (2B Phan Châu Trinh)**\n- Nổi tiếng khắp thế giới\n- Giá: 20-30k/ổ\n- Phải xếp hàng đông!\n\n**3. Com Ga Bà Buội (22 Phan Châu Trinh)**\n- Cơm gà xé phay cực ngon\n- Giá: 30-35k/phần\n\n**4. Mì Quảng Bà Mua (1 Trần Cao Vân)**\n- Mì Quảng đậm đà, thơm ngon\n- Giá: 30-40k/tô\n\n**5. White Rose (533 Hai Bà Trưng)**\n- Bánh bao vạc - đặc sản Hội An\n- Giá: 40-50k/phần\n\n*Còn 5 quán nữa mình sẽ chia sẻ trong bài viết chi tiết...*\n\nNhớ đến sớm để tránh đông đúc nhé!', 'Review chi tiết 10 quán ăn ngon nhất Hội An, từ món đặc sản đến ẩm thực đường phố với giá cả hợp lý.', 'Review chi tiết 10 quán ăn ngon nhất Hội An, từ món đặc sản đến ẩm thực đường phố với giá cả hợp lý.', 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=1200', 6, 2, 'travel', '["Hội An", "ẩm thực", "cao lầu", "bánh mì", "quán ăn ngon"]', 'published', 801, 375, 0, 0, '2025-09-18 02:37:37', '2025-10-12 02:37:36', '2025-10-12 07:49:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(3, 'Checklist đồ cần mang khi đi Sapa mùa đông', 'checklist-đồ-cần-mang-khi-đi-sapa-mùa-đông', 'Sapa mùa đông rất lạnh, nhiệt độ có thể xuống 0-5 độ C. Đây là checklist đồ cần thiết mình đã chuẩn bị:\n\n**Quần áo:**\n- Áo khoác lông/phao dày\n- Áo len, áo nỉ\n- Khăn quàng cổ\n- Găng tay, mũ len\n- Quần dài ấm\n- Tất dày\n\n**Giày dép:**\n- Giày thể thao hoặc giày trekking\n- Tất len dày\n- Dép đi trong phòng\n\n**Skincare:**\n- Kem dưỡng ẩm\n- Son dưỡng môi\n- Kem chống nắng (vẫn cần!)\n\n**Khác:**\n- Thuốc cảm\n- Nhiệt kế\n- Pin sạc dự phòng\n- Túi ni lông (đề phòng mưa)\n\n**Lưu ý:**\n- Đặt phòng sớm vì Sapa mùa đông rất đông khách\n- Chuẩn bị tiền mặt vì nhiều nơi không có ATM\n- Mang theo ô hoặc áo mưa\n\nChúc các bạn có chuyến đi vui vẻ!', 'Hướng dẫn chi tiết những thứ cần mang theo khi đi Sapa mùa đông, giúp bạn chuẩn bị chu đáo cho chuyến đi.', 'Hướng dẫn chi tiết những thứ cần mang theo khi đi Sapa mùa đông, giúp bạn chuẩn bị chu đáo cho chuyến đi.', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 6, 6, 'travel', '["Sapa", "mùa đông", "checklist", "chuẩn bị", "du lịch"]', 'published', 2048, 252, 0, 0, '2025-10-04 02:37:37', '2025-10-12 02:37:36', '2025-10-12 07:49:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(4, 'Đà Lạt - Thành phố mộng mơ qua ống kính của tôi', 'đà-lạt-thành-phố-mộng-mơ-qua-ống-kính-của-tôi', 'Đà Lạt luôn có sức hút đặc biệt với tôi. Sau 5 lần đến, mỗi lần đều mang lại những cảm xúc khác nhau.\n\n**Những địa điểm chụp ảnh đẹp:**\n\n1. **Đồi chè Cầu Đất**\n   - Thời gian đẹp nhất: Sáng sớm (5-6h)\n   - Tips: Mang theo áo dài để chụp ảnh\n   \n2. **Hồ Tuyền Lâm**\n   - View nhìn từ trên cao tuyệt đẹp\n   - Có thể thuê thuyền kayak\n   \n3. **Ga Đà Lạt**\n   - Kiến trúc cổ điển Pháp\n   - Đẹp cả ngày lẫn tối\n\n4. **Quảng trường Lâm Viên**\n   - Biểu tượng của Đà Lạt\n   - Đẹp nhất khi có đèn trang trí\n\n5. **Thung lũng Đà Lạt**\n   - Cánh đồng hoa rộng lớn\n   - Nhiều góc check-in\n\n**Kinh nghiệm chụp ảnh:**\n- Đi sớm để tránh đông người\n- Mang nhiều bộ đồ để thay đổi\n- Thuê photographer local nếu cần (300-500k/set)\n\nĐà Lạt là nơi bạn có thể chụp ảnh đẹp ở bất cứ đâu!', 'Chia sẻ những địa điểm chụp ảnh đẹp nhất Đà Lạt cùng kinh nghiệm chụp ảnh du lịch từ nhiều chuyến đi.', 'Chia sẻ những địa điểm chụp ảnh đẹp nhất Đà Lạt cùng kinh nghiệm chụp ảnh du lịch từ nhiều chuyến đi.', 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=1200', 3, 5, 'travel', '["Đà Lạt", "chụp ảnh", "địa điểm đẹp", "photography"]', 'published', 2572, 221, 0, 0, '2025-09-18 02:37:37', '2025-10-12 02:37:36', '2025-10-12 07:49:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(5, 'Trải nghiệm homestay view núi tuyệt đẹp ở Sapa', 'trải-nghiệm-homestay-view-núi-tuyệt-đẹp-ở-sapa', 'Lần này đi Sapa, mình đã tìm được một homestay view cực đẹp và muốn chia sẻ với mọi người.\n\n**Thông tin homestay:**\n- Tên: Sapa Valley View Homestay\n- Địa chỉ: Lao Chải, Sapa\n- Giá: 300-500k/phòng/đêm\n- View: Ruộng bậc thang và núi non\n\n**Điểm nổi bật:**\n✅ View từ phòng nhìn ra ruộng bậc thang\n✅ Chủ nhà thân thiện, nhiệt tình\n✅ Có bữa sáng miễn phí (phở, bánh mì)\n✅ Phòng sạch sẽ, có điều hòa, nước nóng\n✅ Ban công riêng để ngắm cảnh\n\n**Hoạt động:**\n- Trekking đến các bản làng\n- Ngắm bình minh trên ban công\n- BBQ tối (order thêm 150k/người)\n- Tìm hiểu văn hóa dân tộc\n\n**Booking:**\n- Nên đặt trước 1-2 tuần\n- Có thể liên hệ qua Facebook\n- Free pick-up từ trung tâm Sapa\n\nĐây là một trong những homestay đẹp nhất mình từng ở!', 'Review chi tiết homestay view đẹp ở Sapa với giá cả hợp lý, view ruộng bậc thang tuyệt vời.', 'Review chi tiết homestay view đẹp ở Sapa với giá cả hợp lý, view ruộng bậc thang tuyệt vời.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200', 4, 6, 'travel', '["Sapa", "homestay", "accommodation", "view đẹp"]', 'published', 4554, 157, 0, 0, '2025-10-02 02:37:37', '2025-10-12 02:37:36', '2025-10-12 07:49:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(6, 'Khám phá ẩm thực đường phố Hà Nội trong 24 giờ', 'khám-phá-ẩm-thực-đường-phố-hà-nội-trong-24-giờ', 'Hà Nội - thiên đường ẩm thực đường phố! Đây là lịch trình ăn uống mình đã thực hiện:\n\n**6h sáng: Phở Gia Truyền Bát Đàn**\n- Địa chỉ: 49 Bát Đàn\n- Giá: 40-50k/tô\n- Must try!\n\n**9h sáng: Cà phê trứng Giảng**\n- Địa chỉ: 39 Nguyễn Hữu Huân\n- Giá: 35k/ly\n- Độc đáo, ngon\n\n**12h trưa: Bún chả Hương Liên**\n- Địa chỉ: 24 Lê Văn Hưu\n- Obama từng ăn ở đây!\n- Giá: 40-50k/phần\n\n**3h chiều: Chè Thanh Vân**\n- Địa chỉ: 48 Nguyễn Thị Định\n- Đủ loại chè ngon\n- Giá: 15-25k/tô\n\n**6h tối: Bún đậu mắm tôm**\n- Nhiều quán ở Hàng Bồ\n- Giá: 40-60k/phần\n\n**9h tối: Bia hơi Tạ Hiện**\n- Bia tươi + đồ nhắm\n- Trải nghiệm văn hóa đêm HN\n\nTổng chi phí: khoảng 300-400k cho cả ngày ăn no nê!', 'Lịch trình khám phá ẩm thực đường phố Hà Nội trong 24 giờ với các món ăn đặc sản không thể bỏ qua.', 'Lịch trình khám phá ẩm thực đường phố Hà Nội trong 24 giờ với các món ăn đặc sản không thể bỏ qua.', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1200', 2, 3, 'travel', '["Hà Nội", "ẩm thực", "phở", "bún chả", "street food"]', 'published', 3839, 284, 0, 0, '2025-10-05 02:37:37', '2025-10-12 02:37:36', '2025-10-12 07:49:31', 'blog', 'vi', 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(7, 'èadasda', 'eadasda-1760881243', 'ádasdas', NULL, 'ádasdas', '', 8, NULL, 'travel', '[]', 'published', 0, 0, 0, 0, '2025-10-19 06:40:43', '2025-10-19 06:40:43', '2025-10-23 00:13:52', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/1839cab9cbc34894be9299b290a91d5f_20251019204027.jpg"]', '', NULL, NULL, NULL, 'ádasd', 'adsdasd', 'easy', 36, 1, 0, 1, 0, '', '', NULL, 0, NULL, 0, NULL),
	(8, 'adffasf', 'adffasf-1760940414', 'ầ', NULL, 'ádasda', '', 8, NULL, 'luxury', '[]', 'published', 0, 0, 0, 0, '2025-10-19 23:06:55', '2025-10-19 23:06:55', '2025-10-19 23:06:55', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/c8b836aefacf47d5ac9d70153425cd19_20251020130640.jpg"]', '', NULL, NULL, NULL, '51/4 tan lập 2', 'ádas', 'easy', 0, 0, 0, 0, 0, '', '', NULL, 0, NULL, 0, NULL),
	(9, 'adffasf', 'adffasf-1760940417', 'ầ', NULL, 'ádasda', '', 8, NULL, 'luxury', '[]', 'published', 0, 0, 0, 0, '2025-10-19 23:06:57', '2025-10-19 23:06:57', '2025-10-21 23:41:27', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/c8b836aefacf47d5ac9d70153425cd19_20251020130640.jpg"]', '', NULL, NULL, NULL, '51/4 tan lập 2', 'ádas', 'easy', 40, 2, 0, 6, 0, '', '', NULL, 0, NULL, 0, NULL),
	(11, 'Khám phá Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới', 'kham-pha-vinh-ha-long-ky-quan-thien-nhien-the-gioi-1761881154', 'Vịnh Hạ Long là một trong những di sản thiên nhiên thế giới được UNESCO công nhận, nằm ở tỉnh Quảng Ninh, phía Bắc Việt Nam. Với hơn 1.600 hòn đảo đá vôi và đảo đá vôi vô cùng đẹp mắt, Vịnh Hạ Long đã trở thành điểm đến du lịch hàng đầu của Việt Nam.\n\n## 🌊 Tổng quan về Vịnh Hạ Long\n\nVịnh Hạ Long có diện tích khoảng 1.553 km² với 1.969 hòn đảo lớn nhỏ. Những hòn đảo này được hình thành từ hàng triệu năm trước, tạo nên cảnh quan kỳ vĩ và độc đáo.\n\n## 🚢 Hoạt động nổi bật\n\n### 1. Du thuyền qua Vịnh\n- Thời gian: 2 ngày 1 đêm hoặc 3 ngày 2 đêm\n- Giá: 1.500.000 - 3.000.000 VNĐ/người\n- Trải nghiệm: Ngắm cảnh, chèo kayak, tham quan hang động\n\n### 2. Chèo kayak khám phá\n- Khám phá các hang động ẩn\n- Chiêm ngưỡng hệ sinh thái đa dạng\n- Giá: 100.000 - 200.000 VNĐ/giờ\n\n### 3. Tham quan hang Sửng Sốt\n- Hang động lớn nhất Vịnh Hạ Long\n- Kiến trúc tự nhiên tuyệt đẹp\n- Giá vé: 30.000 VNĐ/người\n\n## 🍽️ Ẩm thực\n\nKhi đến Hạ Long, bạn không thể bỏ qua:\n- Hải sản tươi sống\n- Chả mực Hạ Long\n- Nem chua Quảng Ninh\n- Bánh gật gù\n\n## 💰 Chi phí ước tính\n\n- Du thuyền 2N1Đ: 1.500.000 - 2.500.000 VNĐ/người\n- Khách sạn: 500.000 - 2.000.000 VNĐ/đêm\n- Ăn uống: 300.000 - 500.000 VNĐ/ngày\n- Tổng: 2.500.000 - 5.000.000 VNĐ/người cho chuyến 2 ngày\n\n## 📸 Tips chụp ảnh\n\n- Thời gian đẹp nhất: Bình minh (5-6h sáng) và hoàng hôn (17-18h)\n- Địa điểm: Đỉnh núi Bảo Đài, đảo Titop\n- Thiết bị: Ống kính góc rộng cho cảnh quan\n\nVịnh Hạ Long thực sự là một kỳ quan mà mọi người nên đến ít nhất một lần trong đời!', NULL, 'Khám phá Vịnh Hạ Long - di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi tuyệt đẹp, hang động huyền bí và hệ sinh thái đa dạng.', 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800', 4, NULL, 'travel', '["Vịnh Hạ Long", "Quảng Ninh", "du lịch", "UNESCO", "đảo đá vôi", "hang động"]', 'published', 0, 0, 0, 0, '2025-10-31 03:25:55', '2025-10-31 03:25:54', '2025-10-31 03:25:54', 'blog', 'vi', 2, '["https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800", "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", "https://images.unsplash.com/photo-1588417388913-1bb0743f5f6e?w=800"]', NULL, NULL, 20.9101, 107.184, 'Vịnh Hạ Long', 'Thành phố Hạ Long, Quảng Ninh', 'easy', 2977, 295, 0, 60, 1, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(12, 'Hội An - Thành phố cổ lãng mạn nhất Việt Nam', 'hoi-an-thanh-pho-co-lang-man-nhat-viet-nam-1761881154', 'Hội An là một thành phố cổ tuyệt đẹp nằm bên bờ sông Thu Bồn, tỉnh Quảng Nam. Với kiến trúc độc đáo kết hợp giữa văn hóa Việt, Trung, Nhật và Pháp, Hội An đã được UNESCO công nhận là Di sản Văn hóa Thế giới.\n\n## 🏮 Lịch sử và Văn hóa\n\nHội An từng là một thương cảng quan trọng của Đông Nam Á từ thế kỷ 15 đến 19. Thành phố này là nơi giao thoa của nhiều nền văn hóa, tạo nên một không gian kiến trúc độc đáo.\n\n## 🎨 Địa điểm tham quan\n\n### 1. Chùa Cầu Nhật Bản\n- Biểu tượng của Hội An\n- Xây dựng từ thế kỷ 17\n- Kiến trúc độc đáo kết hợp Việt-Nhật\n\n### 2. Nhà cổ Tân Ký\n- Một trong những nhà cổ đẹp nhất\n- Kiến trúc pha trộn nhiều phong cách\n- Vé tham quan: 80.000 VNĐ\n\n### 3. Phố cổ Hội An\n- 36 phố phường với kiến trúc cổ\n- Đi bộ tham quan miễn phí\n- Mua vé tham quan: 120.000 VNĐ\n\n### 4. Làng gốm Thanh Hà\n- Nghề gốm truyền thống\n- Trải nghiệm làm gốm\n- Vé: 35.000 VNĐ/người\n\n## 🍜 Ẩm thực Hội An\n\n### Must-try món ăn:\n- **Cao lầu**: Món mì đặc trưng (30-40k/bát)\n- **Bánh mì Phượng**: Nổi tiếng thế giới (20-30k/ổ)\n- **Cơm gà Bà Buội**: Thơm ngon, đậm đà (30-35k/phần)\n- **Mì Quảng**: Đặc sản Quảng Nam (30-40k/tô)\n- **White Rose**: Bánh bao vạc (40-50k/phần)\n\n### Top quán ăn:\n1. Cao Lầu Thanh (22 Thái Phiên)\n2. Bánh Mì Phượng (2B Phan Châu Trinh)\n3. Com Ga Bà Buội (22 Phan Châu Trinh)\n4. Mì Quảng Bà Mua (1 Trần Cao Vân)\n\n## 🌙 Đêm Hội An\n\nKhi màn đêm buông xuống, Hội An khoác lên mình vẻ đẹp lãng mạn với hàng nghìn chiếc đèn lồng lung linh. Con phố cổ trở nên sống động với các quán cafe, nhà hàng và shop bán đồ lưu niệm.\n\n## 🛍️ Mua sắm\n\n- Áo dài may tại chỗ\n- Đèn lồng các loại\n- Đồ gốm sứ\n- Đồ handmade\n\n## 💰 Chi phí\n\n- Khách sạn: 300.000 - 1.500.000 VNĐ/đêm\n- Ăn uống: 200.000 - 400.000 VNĐ/ngày\n- Tham quan: 120.000 VNĐ (vé chung)\n- Mua sắm: Tùy ý\n\n## 📅 Thời gian tốt nhất để đi\n\n- Mùa khô: Tháng 2 - Tháng 8\n- Tránh mùa mưa: Tháng 9 - Tháng 1\n- Lễ hội đèn lồng: Rằm tháng Giêng hàng năm\n\nHội An là một nơi mà thời gian như ngừng lại, mang đến cho bạn những trải nghiệm khó quên!', NULL, 'Khám phá Hội An - thành phố cổ lãng mạn với kiến trúc độc đáo, đèn lồng lung linh và ẩm thực đậm đà bản sắc.', 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', 2, NULL, 'culture', '["Hội An", "phố cổ", "UNESCO", "đèn lồng", "ẩm thực", "văn hóa"]', 'published', 0, 0, 0, 0, '2025-10-30 03:25:55', '2025-10-31 03:25:54', '2025-10-31 03:25:54', 'blog', 'vi', 2, '["https://images.unsplash.com/photo-1528181304800-259b08848526?w=800", "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800", "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800"]', NULL, NULL, 15.8801, 108.338, 'Phố Cổ Hội An', 'Hội An, Quảng Nam', 'easy', 1232, 431, 0, 62, 1, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(13, 'Sapa - Thiên đường ruộng bậc thang và văn hóa dân tộc', 'sapa-thien-duong-ruong-bac-thang-va-van-hoa-dan-toc-1761881154', 'Sapa là một thị trấn nhỏ nằm ở độ cao 1.600m so với mực nước biển, thuộc tỉnh Lào Cai. Với khí hậu mát mẻ quanh năm, cảnh quan ruộng bậc thang tuyệt đẹp và văn hóa đa dân tộc độc đáo, Sapa đã trở thành điểm đến yêu thích của nhiều du khách trong và ngoài nước.\n\n## 🏔️ Cảnh quan tự nhiên\n\n### Ruộng bậc thang\nRuộng bậc thang Sapa là một trong những cảnh quan đẹp nhất Việt Nam, được hình thành từ hàng trăm năm qua bởi các dân tộc thiểu số. Thời điểm đẹp nhất để ngắm ruộng bậc thang:\n- **Mùa nước đổ**: Tháng 5-6 (xanh mướt)\n- **Mùa lúa chín**: Tháng 9-10 (vàng óng)\n- **Mùa cạn nước**: Tháng 12-2 (phản chiếu ánh sáng)\n\n### Núi Fansipan\n- Đỉnh núi cao nhất Đông Dương (3.143m)\n- Có thể đi cáp treo lên đỉnh\n- Giá cáp treo: 750.000 VNĐ/khứ hồi\n\n## 👥 Văn hóa dân tộc\n\nSapa là nơi sinh sống của nhiều dân tộc thiểu số:\n- **Người H\'Mông**: Dệt vải, làm đồ thủ công\n- **Người Dao Đỏ**: Trang phục đỏ rực rỡ\n- **Người Tày**: Văn hóa lúa nước\n- **Người Giáy**: Nghề dệt thổ cẩm\n\n### Chợ phiên Sapa\n- Họp vào thứ 7 và Chủ nhật\n- Mua sắm đồ thủ công\n- Trải nghiệm văn hóa địa phương\n\n## 🚶 Trekking và Hoạt động\n\n### 1. Trekking bản Cát Cát\n- Quãng đường: 3-4km\n- Thời gian: 2-3 giờ\n- Giá: 70.000 VNĐ (có hướng dẫn viên)\n\n### 2. Trekking bản Tả Phìn\n- Quãng đường: 6-8km\n- Thời gian: 4-5 giờ\n- Khám phá bản làng người Dao\n\n### 3. Leo Fansipan\n- Thời gian: 2 ngày 1 đêm\n- Độ khó: Trung bình - Khó\n- Giá: 3.000.000 - 5.000.000 VNĐ/người\n\n## 🏠 Homestay\n\nTrải nghiệm ở lại với người dân địa phương:\n- **Giá**: 200.000 - 500.000 VNĐ/đêm\n- **Bao gồm**: Ăn sáng, tour đi bộ\n- **Trải nghiệm**: Văn hóa, ẩm thực địa phương\n\n## 🌡️ Thời tiết và thời điểm đi\n\n- **Mùa xuân** (3-5): Hoa đào nở, khí hậu mát mẻ\n- **Mùa hè** (6-8): Xanh tươi, mát mẻ tránh nóng\n- **Mùa thu** (9-11): Lúa chín vàng, đẹp nhất\n- **Mùa đông** (12-2): Rất lạnh, có thể có tuyết\n\n## 🍲 Ẩm thực\n\n- **Thắng cố**: Món ăn truyền thống người H\'Mông\n- **Cá hồi Sapa**: Tươi ngon, đặc sản\n- **Rau cải mèo**: Rau đặc sản vùng cao\n- **Thịt lợn cắp nách**: Heo thả rông\n\n## 💰 Chi phí ước tính\n\n- Xe từ Hà Nội: 200.000 - 400.000 VNĐ/lượt\n- Khách sạn: 300.000 - 1.000.000 VNĐ/đêm\n- Homestay: 200.000 - 500.000 VNĐ/đêm\n- Ăn uống: 200.000 - 400.000 VNĐ/ngày\n- Trekking: 70.000 - 300.000 VNĐ/tour\n\n## 📝 Checklist khi đi Sapa mùa đông\n\n- Áo khoác dày, mũ len, khăn quàng\n- Găng tay, tất dày\n- Kem dưỡng ẩm, son dưỡng môi\n- Giày trekking\n- Thuốc cảm cúm\n\nSapa là nơi bạn có thể tìm thấy sự yên bình và vẻ đẹp tự nhiên của Việt Nam!', NULL, 'Khám phá Sapa - thiên đường ruộng bậc thang với văn hóa dân tộc đa dạng, khí hậu mát mẻ và cảnh quan núi non hùng vĩ.', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 2, NULL, 'travel', '["Sapa", "ruộng bậc thang", "dân tộc", "trekking", "Fansipan", "Lào Cai"]', 'published', 0, 0, 0, 0, '2025-10-29 03:25:55', '2025-10-31 03:25:54', '2025-10-30 20:27:54', 'blog', 'vi', 3, '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", "https://images.unsplash.com/photo-1511497584788-876760111969?w=800", "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800"]', NULL, NULL, 22.3363, 103.844, 'Sapa', 'Thị trấn Sa Pa, Lào Cai', 'easy', 1861, 391, 0, 48, 1, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(14, 'Đà Lạt - Thành phố ngàn hoa và không khí lãng mạn', 'da-lat-thanh-pho-ngan-hoa-va-khong-khi-lang-man-1761881154', 'Đà Lạt - thành phố ngàn hoa, nơi được mệnh danh là "Tiểu Paris" của Việt Nam. Với khí hậu mát mẻ quanh năm, cảnh quan đẹp như tranh vẽ và không khí lãng mạn, Đà Lạt luôn là điểm đến yêu thích của các cặp đôi và những người yêu thiên nhiên.\n\n## 🌸 Tổng quan\n\nĐà Lạt nằm ở độ cao 1.500m so với mực nước biển, thuộc tỉnh Lâm Đồng. Thành phố này được người Pháp phát hiện và xây dựng từ đầu thế kỷ 20 như một khu nghỉ dưỡng.\n\n## 🏞️ Địa điểm tham quan nổi bật\n\n### 1. Hồ Xuân Hương\n- Trái tim của thành phố Đà Lạt\n- Thích hợp dạo bộ, chụp ảnh\n- Miễn phí\n\n### 2. Nhà thờ Domaine de Marie\n- Kiến trúc Pháp cổ điển\n- Màu hồng độc đáo\n- Miễn phí tham quan\n\n### 3. Ga Đà Lạt\n- Ga xe lửa cổ nhất Việt Nam\n- Kiến trúc Art Deco\n- Vé tham quan: 5.000 VNĐ\n\n### 4. Thiền viện Trúc Lâm\n- Thiền viện lớn nhất Đà Lạt\n- View đẹp nhìn xuống hồ Tuyền Lâm\n- Miễn phí\n\n### 5. Đồi chè Cầu Đất\n- Đồi chè xanh mướt\n- Chụp ảnh sống ảo\n- Vé: 50.000 VNĐ/người\n\n## 📸 Địa điểm chụp ảnh đẹp\n\n1. **Đồi chè Cầu Đất** - Thời gian đẹp: 5-7h sáng\n2. **Hồ Tuyền Lâm** - View từ trên cao\n3. **Ga Đà Lạt** - Kiến trúc cổ điển\n4. **Quảng trường Lâm Viên** - Biểu tượng Đà Lạt\n5. **Thung lũng Đà Lạt** - Cánh đồng hoa\n\n## 🍓 Ẩm thực Đà Lạt\n\n### Đặc sản:\n- **Dâu tây**: Tươi ngon, giá rẻ (50.000 - 100.000 VNĐ/kg)\n- **Atiso**: Trà atiso, canh atiso\n- **Bánh tráng nướng**: Đặc sản đường phố (15.000 - 30.000 VNĐ)\n- **Bánh căn**: Bánh nướng nhỏ (20.000 - 30.000 VNĐ/phần)\n- **Kem bơ**: Kem làm từ bơ Đà Lạt\n\n### Quán cafe đẹp:\n- Cafe Tùng (view đẹp)\n- An Cafe (không gian xanh)\n- Mê Linh Coffee Garden\n\n## 🏨 Khách sạn & Resort\n\n- **Budget**: 300.000 - 700.000 VNĐ/đêm\n- **Mid-range**: 700.000 - 1.500.000 VNĐ/đêm\n- **Luxury**: 1.500.000 - 5.000.000 VNĐ/đêm\n\n## 🚗 Di chuyển\n\n- **Máy bay**: Sân bay Liên Khương (cách 30km)\n- **Xe khách**: Từ TP.HCM (7-8 giờ, 200.000 - 400.000 VNĐ)\n- **Xe máy**: Thuê xe máy trong thành phố (100.000 - 150.000 VNĐ/ngày)\n\n## 🌦️ Thời tiết\n\n- **Mùa khô** (11-4): Mát mẻ, ít mưa\n- **Mùa mưa** (5-10): Mưa nhiều, hoa đẹp\n- **Nhiệt độ**: 15-25°C quanh năm\n\n## 💰 Chi phí ước tính\n\n- Khách sạn: 400.000 - 1.000.000 VNĐ/đêm\n- Ăn uống: 200.000 - 400.000 VNĐ/ngày\n- Tham quan: 100.000 - 300.000 VNĐ/ngày\n- Mua sắm: Tùy ý\n\nĐà Lạt là nơi lý tưởng để "trốn" khỏi cuộc sống ồn ào và tận hưởng không khí trong lành!', NULL, 'Khám phá Đà Lạt - thành phố ngàn hoa với khí hậu mát mẻ, cảnh quan đẹp như tranh và không khí lãng mạn độc đáo.', 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', 3, NULL, 'travel', '["Đà Lạt", "thành phố ngàn hoa", "du lịch", "Lâm Đồng", "chụp ảnh"]', 'published', 0, 0, 0, 0, '2025-10-28 03:25:55', '2025-10-31 03:25:54', '2025-10-30 20:28:26', 'blog', 'vi', 2, '["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800", "https://images.unsplash.com/photo-1511497584788-876760111969?w=800", "https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800"]', NULL, NULL, 11.9404, 108.458, 'Đà Lạt', 'Thành phố Đà Lạt, Lâm Đồng', 'easy', 3818, 394, 0, 83, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(15, 'Top 10 món ăn đường phố Hà Nội không thể bỏ qua', 'top-10-mon-an-duong-pho-ha-noi-khong-the-bo-qua-1761881154', 'Hà Nội là thiên đường ẩm thực đường phố với những món ăn đậm đà bản sắc Việt Nam. Dưới đây là 10 món ăn bạn nhất định phải thử khi đến thủ đô.\n\n## 1. Phở Bò 🍜\n\nPhở là món ăn nổi tiếng nhất của Hà Nội, được cả thế giới biết đến.\n\n**Quán ngon:**\n- Phở Gia Truyền Bát Đàn (49 Bát Đàn) - 40-50k/tô\n- Phở Lý Quốc Sư (10 Lý Quốc Sư) - 50-60k/tô\n- Phở Thìn (13 Lò Đúc) - 45-55k/tô\n\n**Đặc điểm:** Nước dùng trong, thơm, thịt bò tái mềm\n\n## 2. Bún Chả 🍖\n\nMón ăn từng được Tổng thống Obama thưởng thức khi đến Việt Nam.\n\n**Quán ngon:**\n- Bún chả Hương Liên (24 Lê Văn Hưu) - 40-50k/phần\n- Bún chả Đắc Kim (1 Hàng Mành) - 40-50k/phần\n- Bún chả Hàng Mành - 35-45k/phần\n\n**Đặc điểm:** Thịt nướng thơm, nước mắm chua ngọt đậm đà\n\n## 3. Bún Đậu Mắm Tôm 🦐\n\nMón ăn "quốc dân" của người Hà Nội.\n\n**Quán ngon:**\n- Bún đậu Hàng Khay - 40-60k/phần\n- Bún đậu Mẹt (Hàng Bồ) - 45-55k/phần\n\n**Đặc điểm:** Đậu rán giòn, mắm tôm đậm đà\n\n## 4. Cà Phê Trứng ☕\n\nĐặc sản cà phê độc đáo của Hà Nội.\n\n**Quán ngon:**\n- Cafe Giảng (39 Nguyễn Hữu Huân) - 35k/ly\n- Cafe Đinh (13 Đinh Tiên Hoàng) - 30k/ly\n- Cafe Lâm (91 Nguyễn Hữu Huân) - 30k/ly\n\n**Đặc điểm:** Vị đắng cà phê kết hợp với trứng gà béo ngậy\n\n## 5. Chè 🌸\n\nHà Nội nổi tiếng với các loại chè ngon.\n\n**Quán ngon:**\n- Chè Thanh Vân (48 Nguyễn Thị Định) - 15-25k/tô\n- Chè Bốn Mùa (Hàng Gai) - 20-30k/tô\n\n**Đặc điểm:** Đa dạng loại chè, ngọt thanh\n\n## 6. Bánh Cuốn Thanh Trì 🥟\n\nBánh cuốn mỏng như tờ giấy.\n\n**Quán ngon:**\n- Bánh cuốn Bà Hoành (66 Tô Hiến Thành) - 40-50k/phần\n- Bánh cuốn Gia An (25 Hàng Gà) - 35-45k/phần\n\n## 7. Nem Nướng Nha Trang 🍢\n\nNem nướng thơm ngon, đậm đà.\n\n**Quán:** Nhiều quán trên phố Tạ Hiện - 30-50k/phần\n\n## 8. Bánh Mì 🥖\n\nBánh mì Việt Nam nổi tiếng thế giới.\n\n**Quán ngon:**\n- Bánh mì Phố (19 Lý Quốc Sư) - 20-30k/ổ\n- Bánh mì P (Hàng Buồm) - 25-35k/ổ\n\n## 9. Bánh Tôm Hồ Tây 🦐\n\nĐặc sản vùng Hồ Tây.\n\n**Quán:** Quán ven Hồ Tây - 50-70k/phần\n\n## 10. Bia Hơi 🍺\n\nTrải nghiệm văn hóa đêm Hà Nội.\n\n**Địa điểm:**\n- Phố Tạ Hiện\n- Phố Lương Ngọc Quyến\n- Giá: 15.000 - 30.000 VNĐ/ly\n\n## 📍 Lịch trình ăn uống 24 giờ\n\n- **6h sáng**: Phở Bát Đàn\n- **9h sáng**: Cà phê trứng Giảng\n- **12h trưa**: Bún chả Hương Liên\n- **3h chiều**: Chè Thanh Vân\n- **6h tối**: Bún đậu mắm tôm\n- **9h tối**: Bia hơi Tạ Hiện\n\nTổng chi phí: 300.000 - 500.000 VNĐ cho cả ngày ăn no nê!\n\nHà Nội thực sự là thiên đường ẩm thực mà bạn không thể bỏ qua!', NULL, 'Khám phá 10 món ăn đường phố Hà Nội nổi tiếng nhất, từ phở bò đến bún chả, bánh mì và cà phê trứng độc đáo.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 5, NULL, 'food', '["Hà Nội", "ẩm thực", "phở", "bún chả", "street food", "đường phố"]', 'published', 0, 0, 0, 0, '2025-10-27 03:25:55', '2025-10-31 03:25:54', '2025-10-31 03:25:54', 'blog', 'vi', 3, '["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800"]', NULL, NULL, 21.0285, 105.854, 'Hà Nội', 'Quận Hoàn Kiếm, Hà Nội', 'easy', 3138, 278, 0, 53, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(16, 'Nha Trang - Bãi biển đẹp nhất Việt Nam', 'nha-trang-bai-bien-dep-nhat-viet-nam-1761881154', 'Nha Trang là thành phố biển nổi tiếng của Việt Nam, nằm ở tỉnh Khánh Hòa. Với bãi biển dài 6km, nước biển trong xanh và nhiều đảo đẹp, Nha Trang đã trở thành điểm đến lý tưởng cho kỳ nghỉ biển.\n\n## 🏖️ Bãi biển Nha Trang\n\nBãi biển Nha Trang là một trong những bãi biển đẹp nhất Việt Nam với:\n- Cát trắng mịn\n- Nước biển trong xanh\n- Độ dốc nhẹ, an toàn\n- Dài 6km từ sân bay đến Cầu Đá\n\n## 🏝️ Đảo và Hoạt động\n\n### 1. Vinpearl Land\n- Công viên giải trí trên đảo\n- Cáp treo vượt biển dài nhất thế giới\n- Giá: 880.000 VNĐ/người (vé all-in)\n\n### 2. Đảo Hòn Tre\n- Tham quan bằng tàu\n- Lặn biển, snorkeling\n- Giá tour: 400.000 - 600.000 VNĐ/người\n\n### 3. Tháp Bà Ponagar\n- Di tích Chăm cổ\n- Kiến trúc độc đáo\n- Vé: 22.000 VNĐ/người\n\n### 4. Viện Hải dương học\n- Tham quan sinh vật biển\n- Bể cá lớn\n- Vé: 40.000 VNĐ/người\n\n## 🏊 Hoạt động nước\n\n- Lặn biển (diving): 1.500.000 - 2.500.000 VNĐ\n- Snorkeling: 300.000 - 500.000 VNĐ\n- Chèo thuyền kayak: 100.000 - 200.000 VNĐ/giờ\n- Parasailing: 800.000 - 1.200.000 VNĐ\n\n## 🍽️ Ẩm thực\n\n### Hải sản:\n- Cá ngừ tươi sống\n- Tôm hùm\n- Cua, ghẹ\n- Nghêu, sò\n\n### Quán ăn ngon:\n- Quán Số 1 (ven biển)\n- Nhà hàng Sailing Club\n- Chợ Đầm (hải sản tươi)\n\n## 🏨 Khách sạn\n\n- **Budget**: 300.000 - 800.000 VNĐ/đêm\n- **Mid-range**: 800.000 - 2.000.000 VNĐ/đêm\n- **Luxury**: 2.000.000 - 10.000.000 VNĐ/đêm\n\n## 💰 Chi phí ước tính\n\n- Khách sạn: 500.000 - 1.500.000 VNĐ/đêm\n- Ăn uống: 300.000 - 600.000 VNĐ/ngày\n- Hoạt động: 500.000 - 1.000.000 VNĐ/ngày\n\n## 🌤️ Thời tiết\n\n- **Mùa khô**: Tháng 1-8 (nắng đẹp, ít mưa)\n- **Mùa mưa**: Tháng 9-12 (mưa nhiều)\n\nNha Trang là điểm đến lý tưởng cho kỳ nghỉ biển tuyệt vời!', NULL, 'Khám phá Nha Trang - thành phố biển với bãi biển dài 6km, nước trong xanh và nhiều hoạt động giải trí thú vị.', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 4, NULL, 'travel', '["Nha Trang", "biển", "du lịch", "Khánh Hòa", "đảo"]', 'published', 0, 0, 0, 0, '2025-10-26 03:25:55', '2025-10-31 03:25:54', '2025-10-31 03:25:54', 'blog', 'vi', 2, '["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"]', NULL, NULL, 12.2388, 109.197, 'Nha Trang', 'Thành phố Nha Trang, Khánh Hòa', 'easy', 763, 320, 0, 75, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(17, 'Huế - Cố đô với kiến trúc cung đình tráng lệ', 'hue-co-do-voi-kien-truc-cung-dinh-trang-le-1761881154', 'Huế là thành phố cổ từng là kinh đô của Việt Nam dưới triều Nguyễn (1802-1945). Với hệ thống cung điện, lăng tẩm và đền đài tráng lệ, Huế đã được UNESCO công nhận là Di sản Văn hóa Thế giới.\n\n## 🏛️ Lịch sử\n\nHuế từng là thủ đô của Việt Nam trong hơn 140 năm (1802-1945) dưới triều đại nhà Nguyễn - triều đại phong kiến cuối cùng của Việt Nam.\n\n## 🏰 Địa điểm tham quan\n\n### 1. Đại Nội (Hoàng Thành)\n- Khu vực cung điện chính\n- Kiến trúc cổ kính\n- Vé: 150.000 VNĐ/người\n\n### 2. Lăng Tự Đức\n- Lăng tẩm đẹp nhất\n- Kiến trúc hài hòa với thiên nhiên\n- Vé: 100.000 VNĐ/người\n\n### 3. Lăng Khải Định\n- Phong cách Á-Âu độc đáo\n- Nghệ thuật khảm sứ tinh xảo\n- Vé: 100.000 VNĐ/người\n\n### 4. Chùa Thiên Mụ\n- Ngôi chùa cổ nhất Huế\n- Tháp Phước Duyên 7 tầng\n- Miễn phí\n\n### 5. Sông Hương\n- Dòng sông thơ mộng\n- Đi thuyền dragon boat\n- Giá: 100.000 - 200.000 VNĐ/người\n\n## 🍜 Ẩm thực Huế\n\n### Đặc sản:\n- **Bún bò Huế**: Món ăn nổi tiếng nhất\n- **Cơm hến**: Đặc sản độc đáo\n- **Bánh bèo**: Món ăn vặt phổ biến\n- **Bánh khoái**: Bánh xèo kiểu Huế\n- **Chè Huế**: Nhiều loại chè đặc biệt\n\n### Quán ngon:\n- Bún bò O Xuân (19 Phan Đình Phùng)\n- Cơm hến Ba Cây (17 Trần Cao Vân)\n- Bánh bèo Bà Đỏ (100 Điện Biên Phủ)\n\n## 🎭 Lễ hội\n\n- **Festival Huế**: 2 năm một lần\n- **Lễ hội đèn lồng**: Tháng 4\n- **Lễ hội áo dài**: Tháng 3\n\n## 💰 Chi phí\n\n- Khách sạn: 300.000 - 1.000.000 VNĐ/đêm\n- Ăn uống: 200.000 - 400.000 VNĐ/ngày\n- Tham quan: 300.000 - 500.000 VNĐ/ngày\n\nHuế là nơi bạn có thể cảm nhận được lịch sử và văn hóa của Việt Nam!', NULL, 'Khám phá Huế - cố đô với kiến trúc cung đình tráng lệ, lăng tẩm cổ kính và ẩm thực đậm đà bản sắc.', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800', 5, NULL, 'culture', '["Huế", "cố đô", "UNESCO", "cung đình", "lăng tẩm", "văn hóa"]', 'published', 0, 0, 0, 0, '2025-10-25 03:25:55', '2025-10-31 03:25:54', '2025-10-31 03:25:54', 'blog', 'vi', 2, '["https://images.unsplash.com/photo-1539650116574-75c0c6d73aa4?w=800", "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800"]', NULL, NULL, 16.4637, 107.591, 'Huế', 'Thành phố Huế, Thừa Thiên Huế', 'easy', 4938, 148, 0, 49, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(18, 'hú', 'hu-1761966110', 'test nè', NULL, 'sds', '', 10, NULL, 'travel', '[]', 'published', 0, 0, 0, 0, '2025-10-31 20:01:50', '2025-10-31 20:01:50', '2025-11-06 00:32:45', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/016f964f32524a8ebedfa1fa656da0ab_20251101100130.webp", "http://localhost:5000/uploads/images/5e24aa30c7aa489d82f8b6401669177d_20251101100130.webp", "http://localhost:5000/uploads/images/8f35c512f06042589795c24ef764ab5a_20251101100130.webp", "http://localhost:5000/uploads/images/09be3465cdf14c61b180e10cf3ed5c97_20251101100131.jpg", "http://localhost:5000/uploads/images/24c8c1f6e11848398d6c783f01e10734_20251101100131.jpg", "http://localhost:5000/uploads/images/29c564766828461190c8c606a9750025_20251101100131.jpg", "http://localhost:5000/uploads/images/7183245069b144f8997bd8081935de5e_20251101100131.jpg", "http://localhost:5000/uploads/images/102c33f0a084496997db1489d7612d30_20251101100131.jpg", "http://localhost:5000/uploads/images/9bcc3fecb4a4451f8a62d7db4fcc023c_20251101100131.jpg", "http://localhost:5000/uploads/images/8f308903d7824403894ac4c17f61e4fe_20251101100132.jpg", "http://localhost:5000/uploads/images/c9e6b151a0f5436890dab67f07c02128_20251101100132.jpg"]', '', NULL, NULL, NULL, 'ds', 'ds', 'easy', 20, 1, 0, 1, 0, '', '', NULL, 0, NULL, 0, NULL),
	(19, 'abc', 'abc-1762342804', 'aaa', NULL, NULL, NULL, 10, NULL, 'food', NULL, 'published', 0, 0, 0, 0, '2025-11-05 04:40:04', '2025-11-05 04:40:05', '2025-11-05 04:40:05', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/ec43b1ef1af74f7b88458fdbe54479af_20251105183953.jpg", "http://localhost:5000/uploads/images/9c42c03598654eda8f25cd8d19b2273e_20251105183953.jpeg"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(20, 'sdaasdasd', 'sdaasdasd-1762343230', 'ádas', NULL, NULL, NULL, 10, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 04:47:11', '2025-11-05 04:47:11', '2025-11-05 04:47:11', 'blog', 'vi', 1, '[]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(21, 'FSDS', 'fsds-1762343768', 'ỪEREFW', NULL, NULL, NULL, 10, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 04:56:08', '2025-11-05 04:56:08', '2025-11-05 06:29:55', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/16bce6162d4d4c4e9c41b6aaebcf17fb_20251105185606.png"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 7, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(22, 'test nè', 'test-ne-1762351011', 'đang tesr', NULL, NULL, NULL, 11, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 06:56:51', '2025-11-05 06:56:51', '2025-11-05 07:09:53', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/1a42fe2d87334f90aefdcb9b3ac940d9_20251105205647.jpg"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 2, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(23, 'adwawdawd', 'adwawdawd-1762351823', 'ădwadawd', NULL, NULL, NULL, 11, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 07:10:24', '2025-11-05 07:10:24', '2025-11-05 07:10:24', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/23b6056c352d4bec811e7119c46d2295_20251105211020.jpg"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(24, 'heheheh', 'heheheh-1762352317', 'abc', NULL, NULL, NULL, 11, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 07:18:37', '2025-11-05 07:18:37', '2025-11-05 07:18:37', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/7ceefd6bbd0f4a9aba2ec4b24d3d7bbd_20251105211835.jpg"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 0, 0, 0, 0, 0, NULL, NULL, NULL, 0, NULL, 0, NULL),
	(25, 'test tiếpd', 'test-tiepd-1762352837', 'test tiếpd', NULL, NULL, NULL, 11, NULL, 'travel', NULL, 'published', 0, 0, 0, 0, '2025-11-05 07:27:18', '2025-11-05 07:27:18', '2025-11-06 06:19:06', 'blog', 'vi', 1, '["http://localhost:5000/uploads/images/0866626174354bd2be562bd29ee99901_20251105212714.jpg"]', NULL, NULL, NULL, NULL, NULL, NULL, 'easy', 4, 0, 0, 1, 0, NULL, NULL, NULL, 0, NULL, 0, NULL);

-- Dumping structure for table viego_blog.post_images
CREATE TABLE IF NOT EXISTS `post_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` text COLLATE utf8mb4_unicode_ci,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  CONSTRAINT `post_images_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.post_images: ~18 rows (approximately)
INSERT INTO `post_images` (`id`, `post_id`, `image_url`, `caption`, `display_order`, `created_at`) VALUES
	(1, 1, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Vịnh Hạ Long - Di sản thiên nhiên thế giới', 1, '2025-10-12 07:40:02'),
	(2, 1, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Du thuyền trên Vịnh Hạ Long', 2, '2025-10-12 07:40:02'),
	(3, 1, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200', 'Hang Sửng Sốt', 3, '2025-10-12 07:40:02'),
	(4, 2, 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=1200', 'Phố cổ Hội An về đêm', 1, '2025-10-12 07:40:02'),
	(5, 2, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'Đèn lồng Hội An', 2, '2025-10-12 07:40:02'),
	(6, 2, 'https://images.unsplash.com/photo-1578680671705-0965e325b2ba?w=1200', 'Cao lầu - Đặc sản Hội An', 3, '2025-10-12 07:40:02'),
	(7, 3, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200', 'Ruộng bậc thang Sapa', 1, '2025-10-12 07:40:02'),
	(8, 3, 'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=1200', 'Núi non Sapa mùa đông', 2, '2025-10-12 07:40:02'),
	(9, 3, 'https://images.unsplash.com/photo-1604920099090-177577d1c9b6?w=1200', 'Dân tộc thiểu số Sapa', 3, '2025-10-12 07:40:02'),
	(10, 4, 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=1200', 'Thành phố Đà Lạt', 1, '2025-10-12 07:40:02'),
	(11, 4, 'https://images.unsplash.com/photo-1591696331111-ef9586a5b17a?w=1200', 'Hồ Xuân Hương', 2, '2025-10-12 07:40:02'),
	(12, 4, 'https://images.unsplash.com/photo-1606982896075-c15c0b8c2c41?w=1200', 'Vườn hoa Đà Lạt', 3, '2025-10-12 07:40:02'),
	(13, 5, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200', 'Homestay Sapa view núi', 1, '2025-10-12 07:40:02'),
	(14, 5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', 'Phòng nghỉ cozy', 2, '2025-10-12 07:40:02'),
	(15, 5, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', 'View từ homestay', 3, '2025-10-12 07:40:02'),
	(16, 6, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1200', 'Phố cổ Hà Nội', 1, '2025-10-12 07:40:02'),
	(17, 6, 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=1200', 'Phở Hà Nội', 2, '2025-10-12 07:40:02'),
	(18, 6, 'https://images.unsplash.com/photo-1562224768-6b9c8a0e4dfb?w=1200', 'Bún chả Hà Nội', 3, '2025-10-12 07:40:02');

-- Dumping structure for table viego_blog.post_stats
CREATE TABLE IF NOT EXISTS `post_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `view_count` int DEFAULT '0',
  `like_count` int DEFAULT '0',
  `comment_count` int DEFAULT '0',
  `share_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_post_stat` (`post_id`),
  CONSTRAINT `post_stats_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.post_stats: ~6 rows (approximately)
INSERT INTO `post_stats` (`id`, `post_id`, `view_count`, `like_count`, `comment_count`, `share_count`, `created_at`, `updated_at`) VALUES
	(1, 6, 601, 5, 5, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56'),
	(2, 4, 553, 6, 4, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56'),
	(3, 5, 862, 5, 2, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56'),
	(4, 1, 553, 5, 2, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56'),
	(5, 2, 1078, 5, 3, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56'),
	(6, 3, 630, 6, 2, 0, '2025-10-12 07:40:56', '2025-10-12 07:40:56');

-- Dumping structure for table viego_blog.reports
CREATE TABLE IF NOT EXISTS `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `report_type` enum('post','comment','user','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int NOT NULL,
  `reason` enum('spam','harassment','hate_speech','inappropriate_content','violence','copyright','misinformation','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','reviewing','resolved','dismissed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  `action_taken` enum('none','content_removed','user_warned','user_banned','edited','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `resolved_by` (`resolved_by`),
  KEY `ix_reports_target_id` (`target_id`),
  KEY `ix_reports_created_at` (`created_at`),
  KEY `ix_reports_status` (`status`),
  KEY `ix_reports_reporter_id` (`reporter_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.reports: ~0 rows (approximately)

-- Dumping structure for table viego_blog.stories
CREATE TABLE IF NOT EXISTS `stories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` enum('image','video') COLLATE utf8mb4_unicode_ci DEFAULT 'image',
  `view_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT ((now() + interval 24 hour)),
  `is_archived` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `stories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.stories: ~9 rows (approximately)
INSERT INTO `stories` (`id`, `user_id`, `content`, `media_url`, `media_type`, `view_count`, `created_at`, `expires_at`, `is_archived`) VALUES
	(1, 4, 'Lạng Sơn view đẹp ngất ngây! 🏔️', 'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=800', 'image', 234, '2025-10-12 07:40:56', '2025-10-13 07:40:57', 1),
	(2, 5, 'Ancient Town vibes ✨', 'https://images.unsplash.com/photo-1555639003-e8076e8de985?w=800', 'image', 156, '2025-10-12 07:40:56', '2025-10-13 07:40:57', 1),
	(3, 3, 'Quang Anh - Núi trời view đỉnh', 'https://images.unsplash.com/photo-1632646723753-3c0e44f1f040?w=800', 'image', 89, '2025-10-12 07:40:56', '2025-10-13 07:40:57', 1),
	(4, 2, 'Linh Chi - Delta vibes 🚤', 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800', 'image', 312, '2025-10-12 07:40:56', '2025-10-13 07:40:57', 1),
	(5, 10, NULL, '/uploads/stories/images/a8edd0fd37e14cf4bd49b5ed4c44dd12_20251105114212.jpg', 'image', 1, '2025-11-05 04:42:13', '2025-11-06 04:42:13', 1),
	(6, 10, NULL, '/uploads/stories/images/a95a87ba16b94907a78c96f4b937a57a_20251105114939.jpg', 'image', 167, '2025-11-05 04:49:40', '2025-11-06 04:49:40', 1),
	(7, 10, 'hé lô', '/uploads/stories/images/b6b013b925104ae79b34add2214860cd_20251105122643.png', 'image', 125, '2025-11-05 05:26:43', '2025-11-06 05:26:43', 1),
	(8, 10, NULL, '/uploads/stories/images/701e8d95d2384bd5846692002f0e96e9_20251105124259.jpg', 'image', 4, '2025-11-05 05:42:59', '2025-11-06 05:42:59', 1),
	(9, 11, NULL, '/uploads/stories/images/4c42408ff8be4ca5beee4c6683abd267_20251105130014.png', 'image', 1, '2025-11-05 06:00:15', '2025-11-06 06:00:15', 1),
	(10, 12, NULL, '/uploads/stories/images/fa722b808bf146c1b99a59b3915b7ee9_20251106131246.png', 'image', 1, '2025-11-06 06:12:47', '2025-11-07 06:12:47', 0);

-- Dumping structure for table viego_blog.tours
CREATE TABLE IF NOT EXISTS `tours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_days` int NOT NULL,
  `max_participants` int DEFAULT NULL,
  `min_participants` int DEFAULT NULL,
  `difficulty_level` enum('easy','moderate','hard') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starting_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ending_location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `itinerary` text COLLATE utf8mb4_unicode_ci,
  `locations_covered` text COLLATE utf8mb4_unicode_ci,
  `price_per_person` float NOT NULL,
  `currency` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_percentage` float DEFAULT NULL,
  `inclusions` text COLLATE utf8mb4_unicode_ci,
  `exclusions` text COLLATE utf8mb4_unicode_ci,
  `featured_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gallery_images` text COLLATE utf8mb4_unicode_ci,
  `video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `available_dates` text COLLATE utf8mb4_unicode_ci,
  `booking_deadline_days` int DEFAULT NULL,
  `cancellation_policy` text COLLATE utf8mb4_unicode_ci,
  `category` enum('adventure','cultural','food','nature','urban','spiritual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` text COLLATE utf8mb4_unicode_ci,
  `rating` float DEFAULT NULL,
  `reviews_count` int DEFAULT NULL,
  `views_count` int DEFAULT NULL,
  `bookings_count` int DEFAULT NULL,
  `status` enum('active','inactive','draft','suspended') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `seller_id` int NOT NULL,
  `featured` tinyint(1) DEFAULT NULL,
  `affiliate_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commission_rate` float DEFAULT NULL,
  `age_requirement` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fitness_requirement` enum('low','moderate','high') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `equipment_provided` text COLLATE utf8mb4_unicode_ci,
  `equipment_required` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `ix_tours_created_at` (`created_at`),
  KEY `ix_tours_seller_id` (`seller_id`),
  KEY `ix_tours_title` (`title`),
  CONSTRAINT `tours_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.tours: ~5 rows (approximately)
INSERT INTO `tours` (`id`, `title`, `description`, `duration_days`, `max_participants`, `min_participants`, `difficulty_level`, `starting_location`, `ending_location`, `itinerary`, `locations_covered`, `price_per_person`, `currency`, `discount_percentage`, `inclusions`, `exclusions`, `featured_image`, `gallery_images`, `video_url`, `available_dates`, `booking_deadline_days`, `cancellation_policy`, `category`, `tags`, `rating`, `reviews_count`, `views_count`, `bookings_count`, `status`, `created_at`, `updated_at`, `seller_id`, `featured`, `affiliate_link`, `commission_rate`, `age_requirement`, `fitness_requirement`, `equipment_provided`, `equipment_required`) VALUES
	(1, 'Tour Hà Nội - Vịnh Hạ Long 2 Ngày 1 Đêm', 'Khám phá thủ đô Hà Nội và vịnh Hạ Long kỳ quan thiên nhiên thế giới. Trải nghiệm văn hóa miền Bắc và cảnh quan tuyệt đẹp.', 2, 20, 2, 'easy', 'Hà Nội', 'Hà Nội', '{"day1": {"morning": "\\u0110\\u00f3n kh\\u00e1ch t\\u1ea1i s\\u00e2n bay/kh\\u00e1ch s\\u1ea1n H\\u00e0 N\\u1ed9i, kh\\u1edfi h\\u00e0nh \\u0111i H\\u1ea1 Long", "afternoon": "Tham quan hang S\\u1eedng S\\u1ed1t, ch\\u00e8o thuy\\u1ec1n kayak, t\\u1eafm bi\\u1ec3n", "evening": "Ngh\\u1ec9 \\u0111\\u00eam tr\\u00ean t\\u00e0u, th\\u01b0\\u1edfng th\\u1ee9c h\\u1ea3i s\\u1ea3n t\\u01b0\\u01a1i s\\u1ed1ng"}, "day2": {"morning": "Tham quan hang Lu\\u1ed3n, ti\\u00ean \\u00f4ng", "afternoon": "Quay v\\u1ec1 H\\u00e0 N\\u1ed9i, tham quan ph\\u1ed1 c\\u1ed5 H\\u00e0 N\\u1ed9i", "evening": "K\\u1ebft th\\u00fac tour, ti\\u1ec5n kh\\u00e1ch"}}', '[1]', 2500000, 'VND', 10, '["Xe \\u0111\\u01b0a \\u0111\\u00f3n H\\u00e0 N\\u1ed9i - H\\u1ea1 Long", "T\\u00e0u tham quan v\\u1ecbnh H\\u1ea1 Long", "H\\u01b0\\u1edbng d\\u1eabn vi\\u00ean ti\\u1ebfng Vi\\u1ec7t/Anh", "B\\u1eefa \\u0103n theo ch\\u01b0\\u01a1ng tr\\u00ecnh", "Ph\\u00f2ng ngh\\u1ec9 tr\\u00ean t\\u00e0u (2 ng\\u01b0\\u1eddi/ph\\u00f2ng)", "B\\u1ea3o hi\\u1ec3m du l\\u1ecbch"]', '["\\u0110\\u1ed3 u\\u1ed1ng c\\u00e1 nh\\u00e2n", "Chi ph\\u00ed ph\\u00e1t sinh", "Tips cho h\\u01b0\\u1edbng d\\u1eabn vi\\u00ean", "D\\u1ecbch v\\u1ee5 massage, spa"]', '/uploads/images/a869a404f75b4dd5947c02a188f62460_20251102011952.jpg', '["/uploads/images/a869a404f75b4dd5947c02a188f62460_20251102011952.jpg", "/uploads/images/db19b974e1b64f0f812313ade5cbe85a_20251102011952.jpg", "/uploads/images/fe291668f41b452ebc883c78c3eb20fc_20251102011953.jpg"]', NULL, '["2025-11-01", "2025-11-04", "2025-11-07", "2025-11-10", "2025-11-13", "2025-11-16", "2025-11-19", "2025-11-22", "2025-11-25", "2025-11-28", "2025-12-01", "2025-12-04", "2025-12-07", "2025-12-10", "2025-12-13", "2025-12-16", "2025-12-19", "2025-12-22", "2025-12-25", "2025-12-28", "2025-12-31", "2026-01-03", "2026-01-06", "2026-01-09", "2026-01-12", "2026-01-15", "2026-01-18", "2026-01-21", "2026-01-24", "2026-01-27"]', 3, NULL, 'adventure', '["h\\u1ea1 long", "h\\u00e0 n\\u1ed9i", "du thuy\\u1ec1n", "thi\\u00ean nhi\\u00ean"]', 4.8, 342, 1323, 5, 'active', '2025-10-31 11:50:12', '2025-11-05 13:16:44', 10, 1, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 'Tour Miền Trung: Đà Nẵng - Hội An - Huế 4 Ngày', 'Hành trình khám phá di sản văn hóa miền Trung: phố cổ Hội An, cố đô Huế và thành phố biển Đà Nẵng.', 4, 16, 2, 'moderate', 'Đà Nẵng', 'Huế', '{"day1": {"morning": "\\u0110\\u00f3n t\\u1ea1i \\u0110\\u00e0 N\\u1eb5ng, tham quan B\\u00e0 N\\u00e0 Hills", "afternoon": "Check-in kh\\u00e1ch s\\u1ea1n, ngh\\u1ec9 ng\\u01a1i", "evening": "Th\\u01b0\\u1edfng th\\u1ee9c h\\u1ea3i s\\u1ea3n t\\u1ea1i \\u0110\\u00e0 N\\u1eb5ng"}, "day2": {"morning": "Kh\\u1edfi h\\u00e0nh \\u0111i H\\u1ed9i An, tham quan ph\\u1ed1 c\\u1ed5", "afternoon": "L\\u00e0m \\u0111\\u00e8n l\\u1ed3ng, tham quan ch\\u00f9a C\\u1ea7u", "evening": "Ng\\u1eafm \\u0111\\u00e8n l\\u1ed3ng, shopping t\\u1ea1i H\\u1ed9i An"}, "day3": {"morning": "Kh\\u1edfi h\\u00e0nh \\u0111i Hu\\u1ebf, tham quan l\\u0103ng Kh\\u1ea3i \\u0110\\u1ecbnh", "afternoon": "Tham quan \\u0110\\u1ea1i N\\u1ed9i, Ho\\u00e0ng Th\\u00e0nh", "evening": "Th\\u01b0\\u1edfng th\\u1ee9c \\u1ea9m th\\u1ef1c cung \\u0111\\u00ecnh Hu\\u1ebf"}, "day4": {"morning": "Ch\\u00f9a Thi\\u00ean M\\u1ee5, tham quan s\\u00f4ng H\\u01b0\\u01a1ng", "afternoon": "Mua qu\\u00e0, tr\\u1ea3 kh\\u00e1ch t\\u1ea1i Hu\\u1ebf ho\\u1eb7c \\u0110\\u00e0 N\\u1eb5ng"}}', '[2, 14]', 5800000, 'VND', 15, '["Xe du l\\u1ecbch \\u0111\\u1eddi m\\u1edbi c\\u00f3 m\\u00e1y l\\u1ea1nh", "H\\u01b0\\u1edbng d\\u1eabn vi\\u00ean chuy\\u00ean nghi\\u1ec7p", "V\\u00e9 tham quan c\\u00e1c \\u0111i\\u1ec3m du l\\u1ecbch", "Kh\\u00e1ch s\\u1ea1n 3 sao (3 \\u0111\\u00eam)", "B\\u1eefa \\u0103n theo ch\\u01b0\\u01a1ng tr\\u00ecnh", "B\\u1ea3o hi\\u1ec3m du l\\u1ecbch"]', '["V\\u00e9 m\\u00e1y bay", "\\u0110\\u1ed3 u\\u1ed1ng c\\u00e1 nh\\u00e2n", "Chi ph\\u00ed ph\\u00e1t sinh", "Tips, ph\\u1ee5 thu ph\\u00f2ng \\u0111\\u01a1n"]', NULL, NULL, NULL, '["2025-11-01", "2025-11-04", "2025-11-07", "2025-11-10", "2025-11-13", "2025-11-16", "2025-11-19", "2025-11-22", "2025-11-25", "2025-11-28", "2025-12-01", "2025-12-04", "2025-12-07", "2025-12-10", "2025-12-13", "2025-12-16", "2025-12-19", "2025-12-22", "2025-12-25", "2025-12-28", "2025-12-31", "2026-01-03", "2026-01-06", "2026-01-09", "2026-01-12", "2026-01-15", "2026-01-18", "2026-01-21", "2026-01-24", "2026-01-27"]', NULL, NULL, 'cultural', '["h\\u1ed9i an", "hu\\u1ebf", "\\u0111\\u00e0 n\\u1eb5ng", "v\\u0103n h\\u00f3a", "di s\\u1ea3n"]', 4.7, 256, 898, 3, 'active', '2025-10-31 11:50:12', '2025-11-05 13:16:35', 10, 1, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 'Tour Sapa Trekking 3 Ngày 2 Đêm', 'Khám phá Sapa với trekking qua các bản làng dân tộc, ngắm ruộng bậc thang và trải nghiệm văn hóa địa phương.', 3, 12, 2, 'moderate', 'Sapa', 'Sapa', '{"day1": {"morning": "\\u0110\\u00f3n t\\u1ea1i Sapa, trekking b\\u1ea3n T\\u1ea3 Van", "afternoon": "Kh\\u00e1m ph\\u00e1 b\\u1ea3n C\\u00e1t C\\u00e1t, th\\u00e1c n\\u01b0\\u1edbc", "evening": "Ngh\\u1ec9 \\u0111\\u00eam homestay t\\u1ea1i b\\u1ea3n l\\u00e0ng"}, "day2": {"morning": "Trekking b\\u1ea3n Lao Ch\\u1ea3i, T\\u1ea3 Van", "afternoon": "Th\\u0103m ru\\u1ed9ng b\\u1eadc thang, t\\u00ecm hi\\u1ec3u v\\u0103n h\\u00f3a d\\u00e2n t\\u1ed9c", "evening": "Ngh\\u1ec9 \\u0111\\u00eam t\\u1ea1i Sapa"}, "day3": {"morning": "Chinh ph\\u1ee5c \\u0111\\u1ec9nh Fansipan (n\\u1ebfu c\\u00f3 th\\u1eddi gian)", "afternoon": "Mua s\\u1eafm t\\u1ea1i ch\\u1ee3 Sapa, k\\u1ebft th\\u00fac tour"}}', '[11]', 3200000, 'VND', 5, '["Xe \\u0111\\u01b0a \\u0111\\u00f3n t\\u1ea1i Sapa", "H\\u01b0\\u1edbng d\\u1eabn vi\\u00ean \\u0111\\u1ecba ph\\u01b0\\u01a1ng", "Homestay t\\u1ea1i b\\u1ea3n l\\u00e0ng (1 \\u0111\\u00eam)", "Kh\\u00e1ch s\\u1ea1n Sapa (1 \\u0111\\u00eam)", "B\\u1eefa \\u0103n theo ch\\u01b0\\u01a1ng tr\\u00ecnh", "V\\u00e9 tham quan c\\u00e1c \\u0111i\\u1ec3m"]', '["V\\u00e9 c\\u00e1p treo Fansipan", "\\u0110\\u1ed3 u\\u1ed1ng c\\u00e1 nh\\u00e2n", "Chi ph\\u00ed ph\\u00e1t sinh", "Tips"]', NULL, NULL, NULL, '["2025-11-01", "2025-11-04", "2025-11-07", "2025-11-10", "2025-11-13", "2025-11-16", "2025-11-19", "2025-11-22", "2025-11-25", "2025-11-28", "2025-12-01", "2025-12-04", "2025-12-07", "2025-12-10", "2025-12-13", "2025-12-16", "2025-12-19", "2025-12-22", "2025-12-25", "2025-12-28", "2025-12-31", "2026-01-03", "2026-01-06", "2026-01-09", "2026-01-12", "2026-01-15", "2026-01-18", "2026-01-21", "2026-01-24", "2026-01-27"]', NULL, NULL, 'nature', '["sapa", "trekking", "v\\u0103n h\\u00f3a d\\u00e2n t\\u1ed9c", "ru\\u1ed9ng b\\u1eadc thang"]', 4.6, 189, 686, 1, 'active', '2025-10-31 11:50:12', '2025-11-01 08:20:04', 10, 0, NULL, NULL, NULL, NULL, NULL, NULL),
	(4, 'Tour Phú Quốc Resort 3 Ngày 2 Đêm', 'Nghỉ dưỡng tại đảo ngọc Phú Quốc với resort 4 sao, thưởng thức hải sản tươi sống và khám phá các bãi biển đẹp nhất.', 3, 25, 2, 'easy', 'Phú Quốc', 'Phú Quốc', '{"day1": {"morning": "\\u0110\\u00f3n t\\u1ea1i s\\u00e2n bay Ph\\u00fa Qu\\u1ed1c, check-in resort", "afternoon": "Ngh\\u1ec9 ng\\u01a1i t\\u1ea1i b\\u00e3i bi\\u1ec3n, t\\u1eafm bi\\u1ec3n", "evening": "Th\\u01b0\\u1edfng th\\u1ee9c h\\u1ea3i s\\u1ea3n t\\u1ea1i nh\\u00e0 h\\u00e0ng bi\\u1ec3n"}, "day2": {"morning": "Tham quan C\\u00f4ng vi\\u00ean Safari, Vinpearl Land", "afternoon": "Tham quan ch\\u1ee3 \\u0111\\u00eam Dinh C\\u1eadu", "evening": "Ngh\\u1ec9 ng\\u01a1i t\\u1ea1i resort"}, "day3": {"morning": "T\\u1ef1 do t\\u1eafm bi\\u1ec3n, shopping", "afternoon": "Check-out, ti\\u1ec5n kh\\u00e1ch ra s\\u00e2n bay"}}', '[13]', 4500000, 'VND', 20, '["Xe \\u0111\\u01b0a \\u0111\\u00f3n s\\u00e2n bay", "Resort 4 sao (2 \\u0111\\u00eam)", "B\\u1eefa s\\u00e1ng buffet", "V\\u00e9 tham quan Safari, Vinpearl", "B\\u1ea3o hi\\u1ec3m du l\\u1ecbch"]', '["V\\u00e9 m\\u00e1y bay", "B\\u1eefa tr\\u01b0a, t\\u1ed1i", "\\u0110\\u1ed3 u\\u1ed1ng c\\u00e1 nh\\u00e2n", "Chi ph\\u00ed spa, massage"]', NULL, NULL, NULL, '["2025-11-01", "2025-11-04", "2025-11-07", "2025-11-10", "2025-11-13", "2025-11-16", "2025-11-19", "2025-11-22", "2025-11-25", "2025-11-28", "2025-12-01", "2025-12-04", "2025-12-07", "2025-12-10", "2025-12-13", "2025-12-16", "2025-12-19", "2025-12-22", "2025-12-25", "2025-12-28", "2025-12-31", "2026-01-03", "2026-01-06", "2026-01-09", "2026-01-12", "2026-01-15", "2026-01-18", "2026-01-21", "2026-01-24", "2026-01-27"]', NULL, NULL, 'nature', '["ph\\u00fa qu\\u1ed1c", "resort", "bi\\u1ec3n", "ngh\\u1ec9 d\\u01b0\\u1ee1ng", "h\\u1ea3i s\\u1ea3n"]', 4.5, 423, 1578, 1, 'active', '2025-10-31 11:50:12', '2025-11-01 18:01:05', 10, 1, NULL, NULL, NULL, NULL, NULL, NULL),
	(5, 'Tour Đà Lạt Ngàn Hoa 2 Ngày 1 Đêm', 'Khám phá thành phố ngàn hoa với thác nước, đồi chè, vườn hoa và không khí mát mẻ quanh năm.', 2, 18, 2, 'easy', 'Đà Lạt', 'Đà Lạt', '{"day1": {"morning": "\\u0110\\u00f3n t\\u1ea1i \\u0110\\u00e0 L\\u1ea1t, tham quan th\\u00e1c Datanla", "afternoon": "Tham quan v\\u01b0\\u1eddn hoa th\\u00e0nh ph\\u1ed1, \\u0111\\u1ed3i ch\\u00e8 C\\u1ea7u \\u0110\\u1ea5t", "evening": "Ch\\u1ee3 \\u0111\\u00eam \\u0110\\u00e0 L\\u1ea1t, th\\u01b0\\u1edfng th\\u1ee9c \\u1ea9m th\\u1ef1c \\u0111\\u1ecba ph\\u01b0\\u01a1ng"}, "day2": {"morning": "Tham quan Dinh B\\u1ea3o \\u0110\\u1ea1i, nh\\u00e0 th\\u1edd Con G\\u00e0", "afternoon": "Tham quan v\\u01b0\\u1eddn hoa, mua s\\u1eafm \\u0111\\u1eb7c s\\u1ea3n", "evening": "K\\u1ebft th\\u00fac tour"}}', '[15]', 1800000, 'VND', 0, '["Xe du l\\u1ecbch", "H\\u01b0\\u1edbng d\\u1eabn vi\\u00ean", "V\\u00e9 tham quan c\\u00e1c \\u0111i\\u1ec3m", "Kh\\u00e1ch s\\u1ea1n 3 sao (1 \\u0111\\u00eam)", "B\\u1eefa s\\u00e1ng buffet"]', '["B\\u1eefa tr\\u01b0a, t\\u1ed1i", "\\u0110\\u1ed3 u\\u1ed1ng c\\u00e1 nh\\u00e2n", "Chi ph\\u00ed ph\\u00e1t sinh"]', NULL, NULL, NULL, '["2025-11-01", "2025-11-04", "2025-11-07", "2025-11-10", "2025-11-13", "2025-11-16", "2025-11-19", "2025-11-22", "2025-11-25", "2025-11-28", "2025-12-01", "2025-12-04", "2025-12-07", "2025-12-10", "2025-12-13", "2025-12-16", "2025-12-19", "2025-12-22", "2025-12-25", "2025-12-28", "2025-12-31", "2026-01-03", "2026-01-06", "2026-01-09", "2026-01-12", "2026-01-15", "2026-01-18", "2026-01-21", "2026-01-24", "2026-01-27"]', NULL, NULL, 'nature', '["\\u0111\\u00e0 l\\u1ea1t", "hoa", "th\\u00e1c n\\u01b0\\u1edbc", "ngh\\u1ec9 d\\u01b0\\u1ee1ng"]', 4.7, 298, 1142, 6, 'active', '2025-10-31 11:50:12', '2025-11-02 15:09:22', 10, 0, NULL, NULL, NULL, NULL, NULL, NULL),
	(6, 'test', '123', 1, 10, 1, 'easy', 'bến tre', NULL, '[{"day": 1, "title": "abcd", "description": "aaa"}]', NULL, 1100000, 'VND', 0, '["ddd"]', '["ddddaadasd"]', '/uploads/images/7513e9f4540d49b9beff40f0ddb5d1a7_20251101223708.jpg', '["/uploads/images/7513e9f4540d49b9beff40f0ddb5d1a7_20251101223708.jpg", "/uploads/images/21dc76c74e204dcc95954e246f4ff6b7_20251101223708.jpg", "/uploads/images/1a5b0d7427d44d1f86c9391f17bedff9_20251101223708.jpg"]', NULL, NULL, 3, NULL, 'adventure', '["\\u0103dawdawd"]', 0, 0, 12, 1, 'active', '2025-11-01 15:37:15', '2025-11-01 18:21:00', 10, 0, NULL, 0.1, NULL, 'low', NULL, NULL);

-- Dumping structure for table viego_blog.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','moderator','admin','seller','editor') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT '1',
  `email_verified` tinyint(1) DEFAULT '0',
  `account_banned_until` datetime DEFAULT NULL,
  `post_banned_until` datetime DEFAULT NULL,
  `comment_banned_until` datetime DEFAULT NULL,
  `violation_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `points` int NOT NULL DEFAULT '0',
  `level` int NOT NULL DEFAULT '1',
  `badges` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'vi',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Asia/Ho_Chi_Minh',
  `social_links` text COLLATE utf8mb4_unicode_ci,
  `bookmarks` text COLLATE utf8mb4_unicode_ci,
  `liked_posts` text COLLATE utf8mb4_unicode_ci,
  `following` text COLLATE utf8mb4_unicode_ci,
  `followers` text COLLATE utf8mb4_unicode_ci,
  `seller_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email address for seller to send booking confirmation emails',
  `seller_email_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Encrypted password for seller email (bcrypt hashed)',
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên công ty',
  `company_address` text COLLATE utf8mb4_unicode_ci COMMENT 'Địa chỉ công ty',
  `company_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số điện thoại công ty',
  `company_tax_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã số thuế',
  `company_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email công ty (để hiển thị trong booking)',
  `bank_account_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số tài khoản ngân hàng',
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên ngân hàng',
  `bank_account_holder` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chủ tài khoản',
  `friends` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of friend user IDs',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.users: ~12 rows (approximately)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `bio`, `avatar_url`, `cover_image_url`, `role`, `is_active`, `email_verified`, `account_banned_until`, `post_banned_until`, `comment_banned_until`, `violation_count`, `created_at`, `updated_at`, `is_verified`, `points`, `level`, `badges`, `location`, `language`, `timezone`, `social_links`, `bookmarks`, `liked_posts`, `following`, `followers`, `seller_email`, `seller_email_password`, `company_name`, `company_address`, `company_phone`, `company_tax_id`, `company_email`, `bank_account_number`, `bank_name`, `bank_account_holder`, `friends`) VALUES
	(1, 'admin', 'admin@viego.com', '$2b$12$WG6IPKjd8zOlcPuhXpcJjubj0m5n54KY9TywxElRGbucHZ6keSH6G', 'Administrator', 'System Administrator - VieGo Blog', NULL, NULL, 'admin', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:35', '2025-10-12 01:13:35', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 'nguyenvana', 'vana@gmail.com', '$2b$12$Fs5W8qSlzPTkI6vST9k.lOCJadocg6Oq3OWj0z.Lc5ubJjikd2fly', 'Nguyễn Văn A', 'Yêu thích du lịch khám phá Việt Nam. Đã đi qua 50+ tỉnh thành.', NULL, NULL, 'user', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:35', '2025-10-12 03:41:44', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 'tranthib', 'thib@gmail.com', '$2b$12$9.HwqyHVnnsxcU73JezQYOYnC5ds4gERKOcpw10t3ARCy9d76K6Jq', 'Trần Thị B', 'Travel blogger, photographer. Đam mê chụp ảnh phong cảnh.', NULL, NULL, 'user', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:36', '2025-10-12 03:41:44', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(4, 'leminhtuan', 'minhtuan@gmail.com', '$2b$12$bAsqhQo4CRcz5reXl1zftOYs89O7lqy3Bfy0xCa20sdfjXJ1B0iZq', 'Lê Minh Tuấn', 'Food blogger - Khám phá ẩm thực Việt Nam', NULL, NULL, 'user', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:36', '2025-10-12 03:41:44', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(5, 'phamthuhang', 'thuhang@gmail.com', '$2b$12$A6iu39HjseL0tMNkUJjqsOg3PV0thyurBb6Zzp4g76nOyDtcao.3y', 'Phạm Thu Hằng', 'Backpacker - Budget travel specialist', NULL, NULL, 'user', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:36', '2025-10-12 03:41:44', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(6, 'editor01', 'editor@viego.com', '$2b$12$blQc8noG7Grtos.m0FFmk.bgtVP3n5jRsZsrSQ0ibH6p4ZjLpWpkC', 'Biên Tập Viên', 'Content Editor - VieGo Blog', NULL, NULL, 'editor', 1, 1, NULL, NULL, NULL, 0, '2025-10-12 02:37:36', '2025-10-12 03:41:44', 0, 0, 1, NULL, NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(7, 'thien', 'ngocthien160224@gmail.com', '$2b$12$7mC032n5xx2Bq7MK.IDTeeVg27OjJtIW0/C579jEtVq0olATheNCG', 'thien', '', NULL, NULL, 'admin', 1, 0, NULL, NULL, NULL, 0, '2025-10-12 01:13:02', '2025-11-06 06:01:42', 0, 100, 1, '["welcome"]', '', 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, '[9]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[10]'),
	(8, 'moderator', 'admin@example.com', '$2b$12$JaM9t4Pl3MA6lm7bRTmBBusDFhMZ6oTTtQhzZujyUw5woq1EuZ9EO', 'thien', '', NULL, NULL, 'user', 1, 0, NULL, NULL, NULL, 0, '2025-10-12 20:27:44', '2025-11-07 03:35:44', 0, 360, 1, '["welcome"]', '', 'vi', 'Asia/Ho_Chi_Minh', NULL, '[7]', '[7, 9]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[10, 11, 12]'),
	(9, 'testuser1', 'test1@example.com', '$2b$12$JKe.4ViluyRVdXoMpLroDOyZC8HlAMzAzGTpMtebzQWnS64mfKzyy', 'Tester', NULL, NULL, NULL, 'user', 1, 0, NULL, NULL, NULL, 0, '2025-10-21 19:10:00', '2025-10-21 19:14:54', 0, 60, 1, '["welcome"]', NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(10, 'tour_seller_vn', 'seller@viego.com', '$2b$12$dY1WHVrNMZ/Z5boeTXddEOL9NfkzOM5U.e2eytM1fSjZlTpvZOLsm', 'Công Ty Du Lịch Việt Nam Pro', 'Chuyên cung cấp tour du lịch chất lượng cao trên khắp Việt Nam. Hơn 10 năm kinh nghiệm trong ngành du lịch.', 'https://ui-avatars.com/api/?name=Tour+Seller&background=0ea5e9&color=fff', NULL, 'seller', 1, 1, '2025-11-06 08:57:15', NULL, NULL, 0, '2025-10-31 04:47:56', '2025-11-07 04:15:23', 1, 3120, 5, NULL, 'Hà Nội, Việt Nam', 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, '[18]', NULL, NULL, 'ngocthien160224@gmail.com', 'cznj hurk ylkr iimb', 'aaa', '122333', '0948283917', '13334144', 'ngocthien160224@gmail.com', '070948283916', 'Sacombank', 'THACH VAN NGOC THIEN', '[7, 8, 11]'),
	(11, 'ngocthien', 'thienne160224@gmail.com', '$2b$12$jjMf4CTVcZzp7JPmITz7Kuq1C3zuKKMs6cM4oXVpG3rHn98JWmtSC', 'ngocthien', NULL, '/uploads/avatars/30daae2f84724045887249b2d0639730_20251105212926.jpg', '/uploads/covers/7b15cdc27e3343f1bb5e3217307bdbaf_20251105212020.jpg', 'user', 1, 0, NULL, NULL, NULL, 4, '2025-11-04 23:48:50', '2025-11-07 03:36:31', 0, 450, 1, '["welcome"]', NULL, 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[8, 10, 12]'),
	(12, 'moderator1', 'moderator@gmail.com', '$2b$12$5huh0rBXYZ7SwcgXDyneOOmxz1zz1QbO/bPWpp4aWFKk8A9xNuAO.', 'moderator1', '', NULL, NULL, 'moderator', 1, 0, NULL, NULL, NULL, 4, '2025-11-05 23:47:09', '2025-11-07 03:35:44', 0, 50, 1, '["welcome"]', '', 'vi', 'Asia/Ho_Chi_Minh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '[11, 8]');

-- Dumping structure for table viego_blog.user_preferences
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `travel_interests` text COLLATE utf8mb4_unicode_ci,
  `budget_range` enum('budget','mid-range','luxury') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `travel_style` enum('backpacker','family','luxury','business','adventure') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dietary_restrictions` text COLLATE utf8mb4_unicode_ci,
  `cuisine_preferences` text COLLATE utf8mb4_unicode_ci,
  `spice_tolerance` enum('none','mild','medium','hot') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_activities` text COLLATE utf8mb4_unicode_ci,
  `fitness_level` enum('low','moderate','high') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `group_size_preference` enum('solo','couple','small_group','large_group') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_regions` text COLLATE utf8mb4_unicode_ci,
  `climate_preference` enum('tropical','temperate','cold','any') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_notifications` tinyint(1) DEFAULT NULL,
  `push_notifications` tinyint(1) DEFAULT NULL,
  `newsletter_subscription` tinyint(1) DEFAULT NULL,
  `ai_recommendations` tinyint(1) DEFAULT NULL,
  `personalization_data` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table viego_blog.user_preferences: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
