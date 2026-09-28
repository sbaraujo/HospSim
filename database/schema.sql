-- =============================================================================
-- SIMULADOR IA DE TOMADA DE DECISÃO EM EMERGÊNCIAS HOSPITALARES (HEDS)
-- Subtítulo: Hospital Emergency Decision Simulator — HEDS
-- Database Schema: MySQL 8.0+ / Engine: InnoDB / Charset: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `heds_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `heds_db`;

-- Desativar verificação temporária de chaves estrangeiras para recriação limpa
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. HOSPITAIS E ESTRUTURA FÍSICA
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `scores`;
DROP TABLE IF EXISTS `evaluations`;
DROP TABLE IF EXISTS `evacuation_routes`;
DROP TABLE IF EXISTS `fire_states`;
DROP TABLE IF EXISTS `smoke_states`;
DROP TABLE IF EXISTS `simulation_resources`;
DROP TABLE IF EXISTS `simulation_patients`;
DROP TABLE IF EXISTS `simulation_decisions`;
DROP TABLE IF EXISTS `simulation_events`;
DROP TABLE IF EXISTS `simulation_sessions`;
DROP TABLE IF EXISTS `decision_consequences`;
DROP TABLE IF EXISTS `decision_options`;
DROP TABLE IF EXISTS `scenario_events`;
DROP TABLE IF EXISTS `scenarios`;
DROP TABLE IF EXISTS `equipment`;
DROP TABLE IF EXISTS `resources`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `patient_equipment`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `patient_types`;
DROP TABLE IF EXISTS `assembly_points`;
DROP TABLE IF EXISTS `refuge_areas`;
DROP TABLE IF EXISTS `elevators`;
DROP TABLE IF EXISTS `stairs`;
DROP TABLE IF EXISTS `doors`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `zones`;
DROP TABLE IF EXISTS `floors`;
DROP TABLE IF EXISTS `buildings`;
DROP TABLE IF EXISTS `hospitals`;

-- Tabela: hospitals
CREATE TABLE `hospitals` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `trade_name` VARCHAR(255) NULL,
  `address` VARCHAR(500) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `floors_count` INT NOT NULL DEFAULT 5,
  `total_area_m2` DECIMAL(10,2) NOT NULL DEFAULT 15000.00,
  `max_occupancy` INT NOT NULL DEFAULT 600,
  `has_heliport` TINYINT(1) NOT NULL DEFAULT 0,
  `phone_emergency` VARCHAR(50) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hospitals_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: buildings
CREATE TABLE `buildings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `structural_type` VARCHAR(100) NOT NULL DEFAULT 'Concreto Armado / Alvenaria',
  `floors_above_ground` INT NOT NULL DEFAULT 5,
  `basements_count` INT NOT NULL DEFAULT 1,
  `has_sprinklers` TINYINT(1) NOT NULL DEFAULT 1,
  `has_smoke_exhaust` TINYINT(1) NOT NULL DEFAULT 1,
  `has_pressurized_stairs` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bld_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE,
  INDEX `idx_buildings_hospital` (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: floors
CREATE TABLE `floors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `building_id` VARCHAR(36) NOT NULL,
  `level_number` INT NOT NULL, -- -1 (Subsolo), 0 (Térreo), 1, 2, 3, 4...
  `name` VARCHAR(100) NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `area_m2` DECIMAL(10,2) NOT NULL DEFAULT 2500.00,
  `height_meters` DECIMAL(4,2) NOT NULL DEFAULT 3.60,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_flr_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE,
  INDEX `idx_floors_level` (`building_id`, `level_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: zones
CREATE TABLE `zones` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `floor_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `zone_type` ENUM('internacao', 'uti', 'cirurgico', 'emergencia', 'apoio_tecnico', 'administrativo', 'circulacao') NOT NULL,
  `compartmented` TINYINT(1) NOT NULL DEFAULT 1,
  `fire_resistance_rating_min` INT NOT NULL DEFAULT 120,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_zne_floor` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE CASCADE,
  INDEX `idx_zones_floor` (`floor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: rooms
CREATE TABLE `rooms` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `zone_id` VARCHAR(36) NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NOT NULL, -- Leito, Posto de Enfermagem, DML, Expurgos, etc.
  `capacity_beds` INT NOT NULL DEFAULT 1,
  `pos_x` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `pos_y` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `pos_z` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `width` DECIMAL(8,2) NOT NULL DEFAULT 6.00,
  `length` DECIMAL(8,2) NOT NULL DEFAULT 5.00,
  `has_medical_gas` TINYINT(1) NOT NULL DEFAULT 1,
  `has_emergency_power` TINYINT(1) NOT NULL DEFAULT 1,
  `has_sprinkler_head` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rm_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE CASCADE,
  INDEX `idx_rooms_zone` (`zone_id`),
  INDEX `idx_rooms_number` (`room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: doors
CREATE TABLE `doors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `room_id` VARCHAR(36) NOT NULL,
  `door_type` ENUM('padrao', 'corta_fogo_p60', 'corta_fogo_p90', 'corta_fogo_p120', 'automatica') NOT NULL DEFAULT 'padrao',
  `width_meters` DECIMAL(4,2) NOT NULL DEFAULT 1.20,
  `status` ENUM('aberta', 'fechada', 'trancada', 'bloqueada_por_fogo') NOT NULL DEFAULT 'fechada',
  `has_smoke_seal` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dr_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: stairs
CREATE TABLE `stairs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `building_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL, -- Escada Norte, Escada Sul, etc.
  `stair_type` ENUM('comum', 'enclausurada_protegida', 'pressurizada') NOT NULL DEFAULT 'pressurizada',
  `width_meters` DECIMAL(4,2) NOT NULL DEFAULT 1.60,
  `is_compromised` TINYINT(1) NOT NULL DEFAULT 0,
  `has_smoke_barrier` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_str_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: elevators
CREATE TABLE `elevators` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `building_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `is_emergency_elevator` TINYINT(1) NOT NULL DEFAULT 0, -- Elevador de emergência / bombeiro
  `status` ENUM('operacional', 'bloqueado_fase_1', 'uso_bombeiro', 'fora_de_servico') NOT NULL DEFAULT 'operacional',
  `current_floor` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_elv_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: refuge_areas
CREATE TABLE `refuge_areas` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `floor_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `capacity_beds` INT NOT NULL DEFAULT 10,
  `capacity_wheelchairs` INT NOT NULL DEFAULT 15,
  `has_fire_compartment` TINYINT(1) NOT NULL DEFAULT 1,
  `has_independent_ventilation` TINYINT(1) NOT NULL DEFAULT 1,
  `current_occupancy` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ref_floor` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: assembly_points
CREATE TABLE `assembly_points` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `location_description` VARCHAR(255) NOT NULL,
  `safe_capacity` INT NOT NULL DEFAULT 300,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_asm_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. PACIENTES E PERFIS DE DEPENDÊNCIA
-- -----------------------------------------------------------------------------

-- Tabela: patient_types
CREATE TABLE `patient_types` (
  `code` VARCHAR(10) NOT NULL PRIMARY KEY, -- P0, P1, P2, P3, P4
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `requires_staff_count` INT NOT NULL DEFAULT 1,
  `prep_time_minutes` INT NOT NULL DEFAULT 2,
  `movement_speed_ms` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `priority_level` INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: patients
CREATE TABLE `patients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `room_id` VARCHAR(36) NOT NULL,
  `fictional_name` VARCHAR(150) NOT NULL,
  `patient_type_code` VARCHAR(10) NOT NULL,
  `age` INT NOT NULL,
  `clinical_condition` VARCHAR(255) NOT NULL,
  `consciousness_level` ENUM('alerta', 'confuso', 'sedado', 'coma') NOT NULL DEFAULT 'alerta',
  `mobility_status` ENUM('autonomo', 'auxilio_leve', 'cadeirante', 'acamado', 'instavel') NOT NULL DEFAULT 'autonomo',
  `needs_oxygen` TINYINT(1) NOT NULL DEFAULT 0,
  `needs_mechanical_ventilator` TINYINT(1) NOT NULL DEFAULT 0,
  `needs_infusion_pumps` TINYINT(1) NOT NULL DEFAULT 0,
  `needs_vital_monitor` TINYINT(1) NOT NULL DEFAULT 0,
  `preparation_time_sec` INT NOT NULL DEFAULT 60,
  `assigned_staff_count` INT NOT NULL DEFAULT 1,
  `status` ENUM('em_leito', 'preparando', 'em_evacuacao', 'em_area_refugio', 'evacuado_seguro', 'exposto_risco', 'critico') NOT NULL DEFAULT 'em_leito',
  `destination_refuge_id` VARCHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pat_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pat_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pat_type` FOREIGN KEY (`patient_type_code`) REFERENCES `patient_types` (`code`),
  INDEX `idx_patients_type` (`patient_type_code`),
  INDEX `idx_patients_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: patient_equipment
CREATE TABLE `patient_equipment` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `patient_id` VARCHAR(36) NOT NULL,
  `equipment_name` VARCHAR(100) NOT NULL,
  `battery_duration_min` INT NOT NULL DEFAULT 60,
  `weight_kg` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  CONSTRAINT `fk_peq_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. GESTÃO DE RECURSOS, EQUIPES E USUÁRIOS
-- -----------------------------------------------------------------------------

-- Tabela: roles
CREATE TABLE `roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: users
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `role_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `registration_number` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_usr_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: teams
CREATE TABLE `teams` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `team_type` ENUM('brigada_incendio', 'enfermagem_evacuacao', 'medicos_triagem', 'seguranca_patrimonial', 'manutencao_tecnica', 'bombeiros_externos', 'samu_externo') NOT NULL,
  `members_count` INT NOT NULL DEFAULT 4,
  `current_location` VARCHAR(150) NOT NULL DEFAULT 'Posto Central',
  `status` ENUM('disponivel', 'deslocando', 'em_combate', 'em_evacuacao', 'atendendo_vitimas', 'indisponivel') NOT NULL DEFAULT 'disponivel',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tm_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: resources
CREATE TABLE `resources` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `resource_type` ENUM('maca', 'cadeira_rodas', 'evac_chair', 'cilindro_o2_portatil', 'extintor_pqs', 'extintor_co2', 'extintor_agua', 'mangueira_hidrante', 'radio_comunicador', 'mascara_autonoma', 'kit_arrombamento', 'ambulancia') NOT NULL,
  `total_quantity` INT NOT NULL DEFAULT 10,
  `available_quantity` INT NOT NULL DEFAULT 10,
  `storage_location` VARCHAR(150) NOT NULL DEFAULT 'Depósito Central',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_res_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: equipment
CREATE TABLE `equipment` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `floor_id` VARCHAR(36) NOT NULL,
  `tag` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('extintor', 'hidrante', 'bomba_incendio', 'painel_alarme', 'sprinkler_valvula', 'pressurizador_escada', 'gerador_emergencia', 'central_gases') NOT NULL,
  `location_details` VARCHAR(255) NOT NULL,
  `status` ENUM('operacional', 'acionado', 'em_falha', 'em_manutencao') NOT NULL DEFAULT 'operacional',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_eqp_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eqp_floor` FOREIGN KEY (`floor_id`) REFERENCES `floors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CENÁRIOS, MOTOR DE EVENTOS E JOGO DE DECISÃO
-- -----------------------------------------------------------------------------

-- Tabela: scenarios
CREATE TABLE `scenarios` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `hospital_id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `hazard_type` ENUM('incendio', 'explosao', 'vazamento_gas', 'falha_energia', 'falha_oxigenio', 'inundacao', 'incidente_quimico', 'ameaca_bomba', 'agressor_ativo', 'multiplas_vitimas') NOT NULL DEFAULT 'incendio',
  `initial_floor` INT NOT NULL DEFAULT 4,
  `initial_room_description` VARCHAR(200) NOT NULL,
  `simulated_start_time` TIME NOT NULL DEFAULT '10:20:00',
  `severity_level` ENUM('baixo', 'medio', 'alto', 'critico_geral') NOT NULL DEFAULT 'alto',
  `description` TEXT NOT NULL,
  `learning_objectives` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_scn_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: scenario_events
CREATE TABLE `scenario_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `scenario_id` VARCHAR(36) NOT NULL,
  `step_order` INT NOT NULL,
  `trigger_time_sec` INT NOT NULL DEFAULT 0, -- Segundo relativo ao início
  `event_type` ENUM('deteccao', 'confirmacao', 'alarme', 'falha_sistema', 'propagacao_fogo', 'propagacao_fumaca', 'bloqueio_rota', 'paciente_critico', 'reforco_externo', 'encerramento') NOT NULL,
  `location_label` VARCHAR(150) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `available_info` TEXT NOT NULL,
  `is_critical` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sev_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenarios` (`id`) ON DELETE CASCADE,
  INDEX `idx_scenario_events_order` (`scenario_id`, `step_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: decision_options
CREATE TABLE `decision_options` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `scenario_event_id` VARCHAR(36) NOT NULL,
  `option_letter` CHAR(1) NOT NULL, -- A, B, C, D
  `label` VARCHAR(255) NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `required_resources` TEXT NULL,
  `score_weight` INT NOT NULL DEFAULT 10,
  `is_optimal` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dopt_event` FOREIGN KEY (`scenario_event_id`) REFERENCES `scenario_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: decision_consequences
CREATE TABLE `decision_consequences` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `decision_option_id` VARCHAR(36) NOT NULL,
  `consequence_type` ENUM('positiva', 'negativa', 'atraso', 'consumo_recurso', 'perda_recurso', 'agravamento_fogo', 'bloqueio_rota', 'exposicao_paciente', 'reforco_necessario') NOT NULL,
  `description` TEXT NOT NULL,
  `score_penalty_or_bonus` INT NOT NULL DEFAULT 0,
  `fire_spread_increment` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `smoke_spread_increment` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `evacuation_delay_sec` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dcn_option` FOREIGN KEY (`decision_option_id`) REFERENCES `decision_options` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. SESSÕES DE SIMULAÇÃO, AUDITORIA E DADOS DINÂMICOS
-- -----------------------------------------------------------------------------

-- Tabela: simulation_sessions
CREATE TABLE `simulation_sessions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `scenario_id` VARCHAR(36) NOT NULL,
  `participant_user_id` VARCHAR(36) NOT NULL,
  `instructor_user_id` VARCHAR(36) NULL,
  `session_mode` ENUM('treinamento', 'avaliacao', 'instrutor') NOT NULL DEFAULT 'treinamento',
  `status` ENUM('em_preparacao', 'em_andamento', 'pausado', 'concluido', 'abortado') NOT NULL DEFAULT 'em_preparacao',
  `simulated_elapsed_sec` INT NOT NULL DEFAULT 0,
  `speed_multiplier` DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  `emergency_level` ENUM('verde_normal', 'amarelo_alerta', 'laranja_emergencia_local', 'vermelho_evacuacao_geral') NOT NULL DEFAULT 'amarelo_alerta',
  `sync_status` ENUM('sincronizado', 'pendente_upload', 'conflito') NOT NULL DEFAULT 'sincronizado',
  `started_at` DATETIME NULL,
  `ended_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sim_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenarios` (`id`),
  CONSTRAINT `fk_sim_participant` FOREIGN KEY (`participant_user_id`) REFERENCES `users` (`id`),
  INDEX `idx_simulation_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: simulation_events
CREATE TABLE `simulation_events` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `simulated_time_str` VARCHAR(20) NOT NULL, -- Ex: 10:20:15
  `elapsed_seconds` INT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sev_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  INDEX `idx_sim_events_time` (`simulation_session_id`, `elapsed_seconds`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: simulation_decisions
CREATE TABLE `simulation_decisions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `decision_option_id` VARCHAR(36) NOT NULL,
  `decision_timestamp_sec` INT NOT NULL,
  `response_time_seconds` INT NOT NULL,
  `feedback_shown` TEXT NULL,
  `score_awarded` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sdec_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sdec_option` FOREIGN KEY (`decision_option_id`) REFERENCES `decision_options` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: simulation_patients
CREATE TABLE `simulation_patients` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `patient_id` VARCHAR(36) NOT NULL,
  `initial_room_id` VARCHAR(36) NOT NULL,
  `current_status` VARCHAR(50) NOT NULL,
  `assigned_team_id` VARCHAR(36) NULL,
  `evacuated_at_sec` INT NULL,
  `exposure_smoke_seconds` INT NOT NULL DEFAULT 0,
  `vital_stability_percent` INT NOT NULL DEFAULT 100,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_spat_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spat_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: simulation_resources
CREATE TABLE `simulation_resources` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `resource_id` VARCHAR(36) NOT NULL,
  `used_quantity` INT NOT NULL DEFAULT 0,
  `remaining_quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sres_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sres_resource` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: fire_states
CREATE TABLE `fire_states` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `room_id` VARCHAR(36) NOT NULL,
  `temperature_celsius` DECIMAL(6,2) NOT NULL DEFAULT 24.00,
  `heat_release_kw` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `flame_height_meters` DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  `is_contained` TINYINT(1) NOT NULL DEFAULT 0,
  `is_flashover` TINYINT(1) NOT NULL DEFAULT 0,
  `sprinkler_activated` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_fst_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fst_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: smoke_states
CREATE TABLE `smoke_states` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `zone_id` VARCHAR(36) NOT NULL,
  `smoke_density_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `layer_height_meters` DECIMAL(4,2) NOT NULL DEFAULT 3.00,
  `toxicity_co_ppm` INT NOT NULL DEFAULT 0,
  `visibility_meters` DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  `is_route_blocked` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_smk_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_smk_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: evacuation_routes
CREATE TABLE `evacuation_routes` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `route_name` VARCHAR(150) NOT NULL,
  `start_zone_id` VARCHAR(36) NOT NULL,
  `destination_point_id` VARCHAR(36) NOT NULL,
  `route_type` ENUM('horizontal_refugio', 'vertical_escada_pressurizada', 'saida_direta_externa') NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `congestion_level_percent` INT NOT NULL DEFAULT 0,
  `travel_time_est_seconds` INT NOT NULL DEFAULT 120,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ert_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. AVALIAÇÃO, PONTUAÇÕES, RELATÓRIOS E AUDITORIA
-- -----------------------------------------------------------------------------

-- Tabela: evaluations
CREATE TABLE `evaluations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL UNIQUE,
  `overall_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `grade_classification` VARCHAR(50) NOT NULL, -- Excelente, Satisfatório, Risco Elevado, Inaceitável
  `decision_time_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `life_protection_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `patient_safety_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `coordination_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `resource_usage_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `communication_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `continuity_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `evaluator_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_eval_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: scores
CREATE TABLE `scores` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `evaluation_id` VARCHAR(36) NOT NULL,
  `metric_code` VARCHAR(50) NOT NULL,
  `metric_title` VARCHAR(150) NOT NULL,
  `weight` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `points_earned` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `points_max` DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  CONSTRAINT `fk_scr_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: reports
CREATE TABLE `reports` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `simulation_session_id` VARCHAR(36) NOT NULL,
  `report_number` VARCHAR(50) NOT NULL UNIQUE,
  `participant_name` VARCHAR(150) NOT NULL,
  `instructor_name` VARCHAR(150) NOT NULL,
  `hospital_name` VARCHAR(255) NOT NULL,
  `scenario_title` VARCHAR(255) NOT NULL,
  `executive_summary` TEXT NOT NULL,
  `evacuated_patients_count` INT NOT NULL DEFAULT 0,
  `critical_patients_saved` INT NOT NULL DEFAULT 0,
  `total_time_seconds` INT NOT NULL DEFAULT 0,
  `pdf_url` VARCHAR(500) NULL,
  `digital_signature_hash` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rep_session` FOREIGN KEY (`simulation_session_id`) REFERENCES `simulation_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: audit_logs
CREATE TABLE `audit_logs` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_name` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(36) NULL,
  `ip_address` VARCHAR(45) NULL,
  `details_json` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action_type`),
  INDEX `idx_audit_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reativar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INSERÇÃO DE DADOS INICIAIS (SEEDS)
-- =============================================================================

INSERT INTO `patient_types` (`code`, `title`, `description`, `requires_staff_count`, `prep_time_minutes`, `movement_speed_ms`, `priority_level`) VALUES
('P0', 'Autônomo', 'Paciente deambula sozinho, orienta-se e segue instruções verbais.', 0, 0, 1.20, 5),
('P1', 'Mobilidade Reduzida', 'Deambula com muleta/andador ou requer apoio físico leve de 1 profissional.', 1, 1, 0.70, 4),
('P2', 'Cadeirante', 'Necessita de cadeira de rodas ou Evac-Chair para escadas, auxiliado por 1 a 2 brigadistas.', 2, 2, 0.90, 3),
('P3', 'Acamado', 'Incapaz de sentar; requer transferência em maca de transporte ou leito rolante por 2 a 3 pessoas.', 3, 3, 0.50, 2),
('P4', 'Suporte de Vida', 'Dependência de ventilador pulmonar portátil, oxigênio contínuo e bombas de infusão; requer médico/enfermeiro + 2 brigadistas.', 4, 5, 0.35, 1);

INSERT INTO `roles` (`id`, `code`, `name`, `description`) VALUES
('r-1', 'admin', 'Administrador do Sistema', 'Acesso irrestrito a configurações, dados mestres e logs.'),
('r-2', 'instrutor', 'Instrutor Chefe de Emergência', 'Cria cenários, injeta incidentes, supervisiona e avalia participantes.'),
('r-3', 'participante', 'Comandante de Incidente / Aluno', 'Opera o simulador HEDS, toma decisões táticas e executa a resposta C3.'),
('r-4', 'visualizador', 'Observador / Auditor', 'Visualização de telemetria sem interferência.');

-- Fim do Schema MySQL 8+ / InnoDB
