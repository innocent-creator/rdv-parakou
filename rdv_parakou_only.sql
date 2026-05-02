-- Current Database: `rdv_parakou`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `rdv_parakou` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `rdv_parakou`;

--
-- Table structure for table `api_appointment`
--

DROP TABLE IF EXISTS `api_appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_appointment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reason` longtext NOT NULL,
  `consultation_type` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `patient_id` bigint(20) DEFAULT NULL,
  `slot_id` bigint(20) NOT NULL,
  `specialist_id` bigint(20) NOT NULL,
  `patient_name` varchar(200) DEFAULT NULL,
  `patient_phone` varchar(50) DEFAULT NULL,
  `patient_email` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `api_appointment_slot_id_53d7e739_fk_api_availabilityslot_id` (`slot_id`),
  KEY `api_appointment_specialist_id_28d4a6d3_fk_api_specialist_id` (`specialist_id`),
  KEY `api_appointment_patient_id_52c787b0_fk_api_user_id` (`patient_id`),
  CONSTRAINT `api_appointment_patient_id_52c787b0_fk_api_user_id` FOREIGN KEY (`patient_id`) REFERENCES `api_user` (`id`),
  CONSTRAINT `api_appointment_slot_id_53d7e739_fk_api_availabilityslot_id` FOREIGN KEY (`slot_id`) REFERENCES `api_availabilityslot` (`id`),
  CONSTRAINT `api_appointment_specialist_id_28d4a6d3_fk_api_specialist_id` FOREIGN KEY (`specialist_id`) REFERENCES `api_specialist` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_appointment`
--

LOCK TABLES `api_appointment` WRITE;
/*!40000 ALTER TABLE `api_appointment` DISABLE KEYS */;
INSERT INTO `api_appointment` VALUES (1,'Douleurs thoraciques récurrentes','Première consultation','confirmed','2026-04-30 17:23:41.916739',5,2,1,NULL,NULL,NULL),(2,'Fièvre persistante de l\'enfant','Consultation pédiatrique','pending','2026-04-30 17:23:42.116695',6,4,2,NULL,NULL,NULL),(3,'Suivi de grossesse 6 mois','Suivi prénatal','confirmed','2026-04-30 17:23:42.216933',NULL,6,4,'Rachida Alabi','96333001','rachida@gmail.com');
/*!40000 ALTER TABLE `api_appointment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_availabilityslot`
--

DROP TABLE IF EXISTS `api_availabilityslot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_availabilityslot` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `slot_date` date NOT NULL,
  `start_time` time(6) NOT NULL,
  `end_time` time(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `specialist_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_availabilityslot_specialist_id_slot_date__32126363_uniq` (`specialist_id`,`slot_date`,`start_time`),
  CONSTRAINT `api_availabilityslot_specialist_id_2933a7e6_fk_api_specialist_id` FOREIGN KEY (`specialist_id`) REFERENCES `api_specialist` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_availabilityslot`
--

LOCK TABLES `api_availabilityslot` WRITE;
/*!40000 ALTER TABLE `api_availabilityslot` DISABLE KEYS */;
INSERT INTO `api_availabilityslot` VALUES (1,'2026-05-05','08:00:00.000000','08:30:00.000000','available',1),(2,'2026-05-05','09:00:00.000000','09:30:00.000000','booked',1),(3,'2026-05-06','10:00:00.000000','10:30:00.000000','available',2),(4,'2026-05-06','11:00:00.000000','11:30:00.000000','pending',2),(5,'2026-05-07','14:00:00.000000','14:30:00.000000','available',3),(6,'2026-05-08','09:00:00.000000','09:30:00.000000','booked',4);
/*!40000 ALTER TABLE `api_availabilityslot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_clinic`
--

DROP TABLE IF EXISTS `api_clinic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_clinic` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `address` varchar(300) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `village_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `api_clinic_village_id_1261b970_fk_api_village_id` (`village_id`),
  CONSTRAINT `api_clinic_village_id_1261b970_fk_api_village_id` FOREIGN KEY (`village_id`) REFERENCES `api_village` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_clinic`
--

LOCK TABLES `api_clinic` WRITE;
/*!40000 ALTER TABLE `api_clinic` DISABLE KEYS */;
INSERT INTO `api_clinic` VALUES (1,'Clinique Sainte Marie','Rue 12, Banikanni','97000001',1),(2,'Centre Médical Al-Iman','Quartier Ganrou','97000002',2),(3,'Clinique La Grâce','Avenue Madina','97000003',3),(4,'Centre de Santé N\'Dali','N\'Dali Centre','97000004',4),(5,'Hôpital de Zone Bétérou','Bétérou','97000005',5);
/*!40000 ALTER TABLE `api_clinic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_commune`
--

DROP TABLE IF EXISTS `api_commune`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_commune` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_commune`
--

LOCK TABLES `api_commune` WRITE;
/*!40000 ALTER TABLE `api_commune` DISABLE KEYS */;
INSERT INTO `api_commune` VALUES (2,'N\'Dali'),(1,'Parakou'),(3,'Tchaourou');
/*!40000 ALTER TABLE `api_commune` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_specialist`
--

DROP TABLE IF EXISTS `api_specialist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_specialist` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `specialty` varchar(100) NOT NULL,
  `bio` longtext DEFAULT NULL,
  `clinic_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `photo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `api_specialist_clinic_id_06a918ba_fk_api_clinic_id` (`clinic_id`),
  CONSTRAINT `api_specialist_clinic_id_06a918ba_fk_api_clinic_id` FOREIGN KEY (`clinic_id`) REFERENCES `api_clinic` (`id`),
  CONSTRAINT `api_specialist_user_id_5362cb8a_fk_api_user_id` FOREIGN KEY (`user_id`) REFERENCES `api_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_specialist`
--

LOCK TABLES `api_specialist` WRITE;
/*!40000 ALTER TABLE `api_specialist` DISABLE KEYS */;
INSERT INTO `api_specialist` VALUES (1,'Cardiologue','Spécialiste des maladies cardiovasculaires, 10 ans d\'expérience.',1,1,''),(2,'Pédiatre','Médecin des enfants de 0 à 15 ans.',2,2,''),(3,'ORL','Oto-rhino-laryngologiste, chirurgie de la tête et du cou.',3,3,''),(4,'Gynécologue','Suivi de grossesse et santé de la femme.',4,4,'');
/*!40000 ALTER TABLE `api_specialist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_user`
--

DROP TABLE IF EXISTS `api_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_user`
--

LOCK TABLES `api_user` WRITE;
/*!40000 ALTER TABLE `api_user` DISABLE KEYS */;
INSERT INTO `api_user` VALUES (1,'pbkdf2_sha256$600000$4GnlIly0DXOn4NQ9OHFrf1$RMD9MG6cEpCJQQWdHaM6jirspW61kNwm7cYyZL471r0=',NULL,0,'Dr. Kofi Agbossou','kofi.agbossou@rdv.bj','97111001','specialist',1,0,'2026-04-30 17:23:35.082869'),(2,'pbkdf2_sha256$600000$aMLlqXXCqxb32Gcexu5aLk$cvS1mVHjjZjBvyR5hTxRFPR/jQxHmK8TMYBZ0HaCkFQ=',NULL,0,'Dr. Fatima Idrissou','fatima.idrissou@rdv.bj','97111002','specialist',1,0,'2026-04-30 17:23:36.225763'),(3,'pbkdf2_sha256$600000$4cuRPxYWHnXWjS6DLJJoEc$4pAwhlP1FM92TNLCAXoDtdtUAADN+NgJPeCrocLOxYY=',NULL,0,'Dr. Pierre Tossou','pierre.tossou@rdv.bj','97111003','specialist',1,0,'2026-04-30 17:23:37.389244'),(4,'pbkdf2_sha256$600000$ZQqTVnYxSQmURvq7wLuYxB$bnYTqvTBXq6LX64UK45SzPfiZWt7M+x+NQ+zdQ9fOb4=',NULL,0,'Dr. Aïcha Sanni','aïcha.sanni@rdv.bj','97111004','specialist',1,0,'2026-04-30 17:23:38.546786'),(5,'pbkdf2_sha256$600000$fuCA1c81bzxfith12wpjcR$qjKQ8C86fQV2WDbnUUyxf4a/aV+ueRMt4EQFdc4WSYc=',NULL,0,'Moussa Séka','moussa.seka@gmail.com','96222001','patient',1,0,'2026-04-30 17:23:40.708179'),(6,'pbkdf2_sha256$600000$yFBn8GJO0ruWGPEsg0dHSg$dQ/HbX/IWOfQo6pPkN3FKAqFzF//jYlesx5Vhj5mU4w=',NULL,0,'Aminata Bio','aminata.bio@gmail.com','96222002','patient',1,0,'2026-04-30 17:23:41.844072');
/*!40000 ALTER TABLE `api_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_user_groups`
--

DROP TABLE IF EXISTS `api_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_user_groups` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_user_groups_user_id_group_id_9c7ddfb5_uniq` (`user_id`,`group_id`),
  KEY `api_user_groups_group_id_3af85785_fk_auth_group_id` (`group_id`),
  CONSTRAINT `api_user_groups_group_id_3af85785_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `api_user_groups_user_id_a5ff39fa_fk_api_user_id` FOREIGN KEY (`user_id`) REFERENCES `api_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_user_groups`
--

LOCK TABLES `api_user_groups` WRITE;
/*!40000 ALTER TABLE `api_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_user_user_permissions`
--

DROP TABLE IF EXISTS `api_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_user_user_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_user_user_permissions_user_id_permission_id_a06dd704_uniq` (`user_id`,`permission_id`),
  KEY `api_user_user_permis_permission_id_305b7fea_fk_auth_perm` (`permission_id`),
  CONSTRAINT `api_user_user_permis_permission_id_305b7fea_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `api_user_user_permissions_user_id_f3945d65_fk_api_user_id` FOREIGN KEY (`user_id`) REFERENCES `api_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_user_user_permissions`
--

LOCK TABLES `api_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `api_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `api_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_village`
--

DROP TABLE IF EXISTS `api_village`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_village` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `commune_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `api_village_commune_id_94a7dce6_fk_api_commune_id` (`commune_id`),
  CONSTRAINT `api_village_commune_id_94a7dce6_fk_api_commune_id` FOREIGN KEY (`commune_id`) REFERENCES `api_commune` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_village`
--

LOCK TABLES `api_village` WRITE;
/*!40000 ALTER TABLE `api_village` DISABLE KEYS */;
INSERT INTO `api_village` VALUES (1,'Banikanni',1),(2,'Ganrou',1),(3,'Madina',1),(4,'N\'Dali Centre',2),(5,'Bétérou',3);
/*!40000 ALTER TABLE `api_village` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add clinic',6,'add_clinic'),(22,'Can change clinic',6,'change_clinic'),(23,'Can delete clinic',6,'delete_clinic'),(24,'Can view clinic',6,'view_clinic'),(25,'Can add village',7,'add_village'),(26,'Can change village',7,'change_village'),(27,'Can delete village',7,'delete_village'),(28,'Can view village',7,'view_village'),(29,'Can add user',8,'add_user'),(30,'Can change user',8,'change_user'),(31,'Can delete user',8,'delete_user'),(32,'Can view user',8,'view_user'),(33,'Can add specialist',9,'add_specialist'),(34,'Can change specialist',9,'change_specialist'),(35,'Can delete specialist',9,'delete_specialist'),(36,'Can view specialist',9,'view_specialist'),(37,'Can add availability slot',10,'add_availabilityslot'),(38,'Can change availability slot',10,'change_availabilityslot'),(39,'Can delete availability slot',10,'delete_availabilityslot'),(40,'Can view availability slot',10,'view_availabilityslot'),(41,'Can add appointment',11,'add_appointment'),(42,'Can change appointment',11,'change_appointment'),(43,'Can delete appointment',11,'delete_appointment'),(44,'Can view appointment',11,'view_appointment'),(45,'Can add commune',12,'add_commune'),(46,'Can change commune',12,'change_commune'),(47,'Can delete commune',12,'delete_commune'),(48,'Can view commune',12,'view_commune');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) unsigned NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_api_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_api_user_id` FOREIGN KEY (`user_id`) REFERENCES `api_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(11,'api','appointment'),(10,'api','availabilityslot'),(6,'api','clinic'),(12,'api','commune'),(9,'api','specialist'),(8,'api','user'),(7,'api','village'),(3,'auth','group'),(2,'auth','permission'),(4,'contenttypes','contenttype'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-04-30 16:57:08.211911'),(2,'contenttypes','0002_remove_content_type_name','2026-04-30 16:57:12.173663'),(3,'auth','0001_initial','2026-04-30 16:57:45.803678'),(4,'auth','0002_alter_permission_name_max_length','2026-04-30 16:57:53.688700'),(5,'auth','0003_alter_user_email_max_length','2026-04-30 16:57:53.984313'),(6,'auth','0004_alter_user_username_opts','2026-04-30 16:57:54.233792'),(7,'auth','0005_alter_user_last_login_null','2026-04-30 16:57:54.427794'),(8,'auth','0006_require_contenttypes_0002','2026-04-30 16:57:54.528147'),(9,'auth','0007_alter_validators_add_error_messages','2026-04-30 16:57:54.724031'),(10,'auth','0008_alter_user_username_max_length','2026-04-30 16:57:54.814183'),(11,'auth','0009_alter_user_last_name_max_length','2026-04-30 16:57:54.992772'),(12,'auth','0010_alter_group_name_max_length','2026-04-30 16:57:59.413346'),(13,'auth','0011_update_proxy_permissions','2026-04-30 16:57:59.667210'),(14,'auth','0012_alter_user_first_name_max_length','2026-04-30 16:57:59.945800'),(15,'api','0001_initial','2026-04-30 16:58:32.905919'),(16,'admin','0001_initial','2026-04-30 16:58:36.770054'),(17,'admin','0002_logentry_remove_auto_add','2026-04-30 16:58:36.850851'),(18,'admin','0003_logentry_add_action_flag_choices','2026-04-30 16:58:36.950532'),(19,'api','0002_appointment_patient_name_appointment_patient_phone_and_more','2026-04-30 16:58:41.738983'),(20,'api','0003_commune_village_commune','2026-04-30 16:58:44.635960'),(21,'api','0004_specialist_photo','2026-04-30 16:58:44.857580'),(22,'api','0005_appointment_patient_email','2026-04-30 16:58:45.047910'),(23,'sessions','0001_initial','2026-04-30 16:58:46.430507');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Current Database: `test`
