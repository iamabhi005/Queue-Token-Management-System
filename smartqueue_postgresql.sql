-- ============================================================
-- SmartQueue – PostgreSQL Database Schema & Seed Data
-- Queue & Token Management System
-- Generated from CSV exports on 2026-10-30
-- ============================================================

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS token_sequences CASCADE;
DROP TABLE IF EXISTS counters CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom ENUM types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS token_status CASCADE;

-- ============================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF', 'CUSTOMER');
CREATE TYPE token_status AS ENUM ('WAITING', 'SERVING', 'COMPLETED', 'SKIPPED');

-- ============================================================
-- 2. TABLE DEFINITIONS
-- ============================================================

-- ─────────────── USERS ───────────────
CREATE TABLE users (
    user_id         VARCHAR(24)     PRIMARY KEY,
    full_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    role            user_role       NOT NULL DEFAULT 'CUSTOMER',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  users IS 'Stores admin, staff, and customer accounts';
COMMENT ON COLUMN users.user_id IS 'MongoDB ObjectId preserved as string identifier';


-- ─────────────── SERVICES ───────────────
CREATE TABLE services (
    service_id              VARCHAR(24)     PRIMARY KEY,
    service_name            VARCHAR(100)    NOT NULL UNIQUE,
    description             TEXT,
    avg_service_time_min    INTEGER         NOT NULL CHECK (avg_service_time_min >= 1),
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE services IS 'Service categories offered (e.g., Banking, Consultation)';


-- ─────────────── COUNTERS ───────────────
CREATE TABLE counters (
    counter_id      VARCHAR(24)     PRIMARY KEY,
    counter_name    VARCHAR(100)    NOT NULL UNIQUE,
    service_id      VARCHAR(24)     NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE counters IS 'Physical counter stations assigned to a service department';

CREATE INDEX idx_counters_service ON counters(service_id);


-- ─────────────── TOKEN SEQUENCES ───────────────
CREATE TABLE token_sequences (
    sequence_id         VARCHAR(24)     PRIMARY KEY,
    service_id          VARCHAR(24)     NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    date_code           DATE            NOT NULL,
    last_sequence       INTEGER         NOT NULL DEFAULT 0,
    UNIQUE (service_id, date_code)
);

COMMENT ON TABLE token_sequences IS 'Atomic counter for generating unique token numbers per service per day';


-- ─────────────── TOKENS ───────────────
CREATE TABLE tokens (
    token_id        VARCHAR(24)     PRIMARY KEY,
    token_number    VARCHAR(20)     NOT NULL,
    customer_name   VARCHAR(100)    NOT NULL,
    service_id      VARCHAR(24)     NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
    counter_id      VARCHAR(24)     REFERENCES counters(counter_id) ON DELETE SET NULL,
    status          token_status    NOT NULL DEFAULT 'WAITING',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    called_at       TIMESTAMP,
    completed_at    TIMESTAMP
);

COMMENT ON TABLE tokens IS 'Core entity – each row represents one customer queue token';

CREATE INDEX idx_tokens_status     ON tokens(status);
CREATE INDEX idx_tokens_service    ON tokens(service_id);
CREATE INDEX idx_tokens_counter    ON tokens(counter_id);
CREATE INDEX idx_tokens_number     ON tokens(token_number);
CREATE INDEX idx_tokens_created    ON tokens(created_at);


-- ─────────────── ACTIVITY LOGS ───────────────
CREATE TABLE activity_logs (
    log_id          VARCHAR(24)     PRIMARY KEY,
    action          VARCHAR(50)     NOT NULL,
    target_table    VARCHAR(50)     NOT NULL,
    performed_by    VARCHAR(150)    NOT NULL,
    details         TEXT,
    logged_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE activity_logs IS 'Audit trail of all system actions (login, token creation, etc.)';

CREATE INDEX idx_logs_action    ON activity_logs(action);
CREATE INDEX idx_logs_time      ON activity_logs(logged_at);


-- ============================================================
-- 3. SEED DATA (from CSV exports)
-- ============================================================

-- ─────────────── INSERT USERS (6 rows) ───────────────
INSERT INTO users (user_id, full_name, email, role, created_at) VALUES
('6ad9a1589bc3463c0e97306a', 'System Administrator',  'admin@smartqueue.com',              'ADMIN',    '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e97306d', 'Sarah Jenkins',          'staff@smartqueue.com',              'STAFF',    '2026-10-22 05:38:32'),
('6ad9a17defbd0eb0f3834641', 'Jane Customer',           'jane@example.com',                  'CUSTOMER', '2026-10-22 05:39:09'),
('6ad9cd766544c7ce9ef218cd', 'Admin',                   'admin@example.com',                 'ADMIN',    '2026-10-22 08:46:46'),
('6ad9e05339a65be96ac7cfef', 'Jane Customer',           'jane_1792663635707@example.com',    'CUSTOMER', '2026-10-22 10:07:15'),
('6ad9e4ecc62ec6b5d05d08ce', 'Jane Customer',           'jane_1792664811935@example.com',    'CUSTOMER', '2026-10-22 10:26:52');


-- ─────────────── INSERT SERVICES (7 rows) ───────────────
INSERT INTO services (service_id, service_name, description, avg_service_time_min, is_active, created_at) VALUES
('6ad9a1589bc3463c0e97306f', 'General Banking & Cashier',           'Cash deposits, withdrawals, drafts and teller requests',           8,  TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e973071', 'Account & Card Services',             'Account opening, debit/credit cards, and KYC verification',        12, TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e973073', 'Loan & Wealth Advisory',              'Personal loans, home loans, and investment advisory',               20, TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e973075', 'OPD Doctor Consultation',             'General physician checkup and triage consultation',                 15, TRUE, '2026-10-22 05:38:32'),
('6ad9a17eefbd0eb0f38346b6', 'Passport & Visa Verification',       'Document verification and biometric capture',                       18, TRUE, '2026-10-22 05:39:10'),
('6ad9e05439a65be96ac7d068', 'Special Verification 1792663636648',  'Document verification and biometric capture',                       18, TRUE, '2026-10-22 10:07:16'),
('6ad9e4ecc62ec6b5d05d0942', 'Special Verification 1792664812968',  'Document verification and biometric capture',                       18, TRUE, '2026-10-22 10:26:52');


-- ─────────────── INSERT COUNTERS (7 rows) ───────────────
INSERT INTO counters (counter_id, counter_name, service_id, is_active, created_at) VALUES
('6ad9a1589bc3463c0e973077', 'Counter 1',                '6ad9a1589bc3463c0e97306f', TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e973079', 'Counter 2',                '6ad9a1589bc3463c0e973071', TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e97307b', 'Counter 3',                '6ad9a1589bc3463c0e973073', TRUE, '2026-10-22 05:38:32'),
('6ad9a1589bc3463c0e97307d', 'Counter 4',                '6ad9a1589bc3463c0e973075', TRUE, '2026-10-22 05:38:32'),
('6ad9a17eefbd0eb0f38346bb', 'Counter 9 - VIP FastTrack','6ad9a1589bc3463c0e973071', TRUE, '2026-10-22 05:39:10'),
('6ad9e05439a65be96ac7d06d', 'Station 1792663636652',    '6ad9a1589bc3463c0e973071', TRUE, '2026-10-22 10:07:16'),
('6ad9e4ecc62ec6b5d05d0947', 'Station 1792664812973',    '6ad9a1589bc3463c0e973071', TRUE, '2026-10-22 10:26:52');


-- ─────────────── INSERT TOKEN SEQUENCES (2 rows) ───────────────
INSERT INTO token_sequences (sequence_id, service_id, date_code, last_sequence) VALUES
('6ad9a1589bc3463c0e97307f', '6ad9a1589bc3463c0e97306f', '2026-10-22', 9),
('6ad9a1589bc3463c0e973082', '6ad9a1589bc3463c0e973071', '2026-10-22', 44);


-- ─────────────── INSERT TOKENS (53 rows) ───────────────
INSERT INTO tokens (token_id, token_number, customer_name, service_id, counter_id, status, created_at, called_at, completed_at) VALUES
('6ad9a1589bc3463c0e97308a', 'AC-001',     'Priya Sharma',                 '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 04:58:32', '2026-10-22 05:13:32', '2026-10-22 05:26:32'),
('6ad9a1589bc3463c0e973084', 'GB-001',     'Marcus Vance',                 '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 05:18:32', '2026-10-22 05:33:32', '2026-10-22 11:34:17'),
('6ad9a1589bc3463c0e973086', 'GB-002',     'Amina Al-Mansoor',             '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 05:23:32', '2026-10-22 05:39:10', '2026-10-22 11:34:16'),
('6ad9a1589bc3463c0e973088', 'GB-003',     'Liam O''Connor',               '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 05:28:32', '2026-10-22 10:07:16', '2026-10-22 11:34:16'),
('6ad9a1589bc3463c0e97308c', 'AC-002',     'Eleanor Sterling',             '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:30:32', '2026-10-22 11:15:29', NULL),
('6ad9a17eefbd0eb0f383464c', 'A&CS-003',   'Robert Frost',                 '6ad9a1589bc3463c0e973071', NULL,                       'COMPLETED', '2026-10-22 05:39:10', NULL,                   '2026-10-22 05:39:10'),
('6ad9a17eefbd0eb0f3834656', 'A&CS-004',   'Concurrent User 1',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:15:31', NULL),
('6ad9a17eefbd0eb0f3834659', 'A&CS-005',   'Concurrent User 2',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:15:49', NULL),
('6ad9a17eefbd0eb0f3834661', 'A&CS-006',   'Concurrent User 3',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:15:56', NULL),
('6ad9a17eefbd0eb0f3834663', 'A&CS-007',   'Concurrent User 4',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:39', NULL),
('6ad9a17eefbd0eb0f383466a', 'A&CS-008',   'Concurrent User 5',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:50', NULL),
('6ad9a17eefbd0eb0f3834677', 'A&CS-009',   'Concurrent User 8',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:50', NULL),
('6ad9a17eefbd0eb0f3834679', 'A&CS-010',   'Concurrent User 9',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:51', NULL),
('6ad9a17eefbd0eb0f383467b', 'A&CS-012',   'Concurrent User 7',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:51', NULL),
('6ad9a17eefbd0eb0f383467f', 'A&CS-011',   'Concurrent User 6',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:51', NULL),
('6ad9a17eefbd0eb0f3834687', 'A&CS-013',   'Concurrent User 10',           '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 05:39:10', '2026-10-22 11:16:51', NULL),
('6ad9a17eefbd0eb0f38346ab', 'A&CS-014',   'No Show Customer',             '6ad9a1589bc3463c0e973071', NULL,                       'SKIPPED',   '2026-10-22 05:39:10', NULL,                   '2026-10-22 05:39:10'),
('6ad9cf326544c7ce9ef218d3', 'GB&C-004',   'John Doe',                     '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 08:54:10', '2026-10-22 10:26:52', '2026-10-22 11:34:14'),
('6ad9d2859731c6066964fe43', 'GB&C-005',   'Alice Test',                   '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 09:08:21', '2026-10-22 11:16:12', '2026-10-22 11:34:13'),
('6ad9df9b5dfb688553f409ee', 'GB&C-006',   'Abhi Patel',                   '6ad9a1589bc3463c0e97306f', '6ad9a1589bc3463c0e973077', 'COMPLETED', '2026-10-22 10:04:11', '2026-10-22 11:16:29', '2026-10-22 11:34:12'),
('6ad9e05439a65be96ac7cfff', 'A&CS-015',   'Robert Frost',                 '6ad9a1589bc3463c0e973071', NULL,                       'COMPLETED', '2026-10-22 10:07:16', NULL,                   '2026-10-22 10:07:16'),
('6ad9e05439a65be96ac7d007', 'A&CS-016',   'Concurrent User 1',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:51', NULL),
('6ad9e05439a65be96ac7d00e', 'A&CS-017',   'Concurrent User 2',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:51', NULL),
('6ad9e05439a65be96ac7d013', 'A&CS-018',   'Concurrent User 3',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', NULL),
('6ad9e05439a65be96ac7d01a', 'A&CS-020',   'Concurrent User 5',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', NULL),
('6ad9e05439a65be96ac7d01c', 'A&CS-019',   'Concurrent User 4',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', NULL),
('6ad9e05439a65be96ac7d027', 'A&CS-021',   'Concurrent User 9',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', NULL),
('6ad9e05439a65be96ac7d02a', 'A&CS-022',   'Concurrent User 8',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', '2026-10-22 11:45:07'),
('6ad9e05439a65be96ac7d033', 'A&CS-024',   'Concurrent User 10',           '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:07:16', '2026-10-22 11:16:52', '2026-10-22 11:45:07'),
('6ad9e05439a65be96ac7d035', 'A&CS-025',   'Concurrent User 7',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:07:16', '2026-10-22 11:34:27', '2026-10-22 11:34:35'),
('6ad9e05439a65be96ac7d037', 'A&CS-023',   'Concurrent User 6',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:07:16', '2026-10-22 11:34:41', '2026-10-22 11:34:47'),
('6ad9e05439a65be96ac7d05d', 'A&CS-026',   'No Show Customer',             '6ad9a1589bc3463c0e973071', NULL,                       'SKIPPED',   '2026-10-22 10:07:16', NULL,                   '2026-10-22 10:07:16'),
('6ad9e0de5dfb688553f40a33', 'A&CS-027',   'abhi',                         '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:09:34', '2026-10-22 11:34:50', '2026-10-22 11:34:51'),
('6ad9e4ecc62ec6b5d05d08d9', 'A&CS-028',   'Robert Frost',                 '6ad9a1589bc3463c0e973071', NULL,                       'COMPLETED', '2026-10-22 10:26:52', NULL,                   '2026-10-22 10:26:52'),
('6ad9e4ecc62ec6b5d05d08e2', 'A&CS-029',   'Concurrent User 1',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:26:52', '2026-10-22 11:34:54', '2026-10-22 11:34:58'),
('6ad9e4ecc62ec6b5d05d08e5', 'A&CS-030',   'Concurrent User 2',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:26:52', '2026-10-22 11:34:59', '2026-10-22 11:35:00'),
('6ad9e4ecc62ec6b5d05d08ea', 'A&CS-031',   'Concurrent User 3',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'COMPLETED', '2026-10-22 10:26:52', '2026-10-22 11:35:01', '2026-10-22 11:35:09'),
('6ad9e4ecc62ec6b5d05d08f3', 'A&CS-032',   'Concurrent User 4',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:37:37', '2026-10-22 11:45:07'),
('6ad9e4ecc62ec6b5d05d08f8', 'A&CS-033',   'Concurrent User 5',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:44:20', '2026-10-22 11:45:00'),
('6ad9e4ecc62ec6b5d05d08fc', 'A&CS-034',   'Concurrent User 6',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:44:32', '2026-10-22 11:44:59'),
('6ad9e4ecc62ec6b5d05d0903', 'A&CS-035',   'Concurrent User 9',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:44:45', '2026-10-22 11:44:58'),
('6ad9e4ecc62ec6b5d05d090b', 'A&CS-036',   'Concurrent User 7',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:44:52', '2026-10-22 11:44:57'),
('6ad9e4ecc62ec6b5d05d090d', 'A&CS-037',   'Concurrent User 10',           '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SKIPPED',   '2026-10-22 10:26:52', '2026-10-22 11:45:04', '2026-10-22 11:45:06'),
('6ad9e4ecc62ec6b5d05d0915', 'A&CS-038',   'Concurrent User 8',            '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:26:52', '2026-10-22 11:45:08', NULL),
('6ad9e4ecc62ec6b5d05d0937', 'A&CS-039',   'No Show Customer',             '6ad9a1589bc3463c0e973071', NULL,                       'SKIPPED',   '2026-10-22 10:26:52', NULL,                   '2026-10-22 10:26:52'),
('6ad9e5495dfb688553f40b60', 'A&CS-040',   'hkhjk',                        '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 10:28:25', '2026-10-22 11:45:11', NULL),
('6ad9f2d15dfb688553f40f55', 'A&CS-041',   'Test User',                    '6ad9a1589bc3463c0e973071', '6ad9a1589bc3463c0e973079', 'SERVING',   '2026-10-22 11:26:09', '2026-10-22 11:45:11', NULL),
('6ad9f53e5dfb688553f41000', 'GB&C-007',   'abhis',                        '6ad9a1589bc3463c0e97306f', NULL,                       'WAITING',   '2026-10-22 11:36:30', NULL,                   NULL),
('6ad9fdb25dfb688553f41099', 'A&CS-042',   'Abhishek Patel',               '6ad9a1589bc3463c0e973071', '6ad9a17eefbd0eb0f38346bb', 'SERVING',   '2026-10-22 12:12:34', '2026-10-22 12:21:30', NULL),
('6ad9ff6a5dfb688553f410af', 'A&CS-043',   'abhi',                         '6ad9a1589bc3463c0e973071', '6ad9a17eefbd0eb0f38346bb', 'COMPLETED', '2026-10-22 12:19:54', '2026-10-22 12:21:37', '2026-10-22 12:21:50'),
('6ad9ffab5dfb688553f410b6', 'A&CS-044',   'satyam',                       '6ad9a1589bc3463c0e973071', '6ad9a17eefbd0eb0f38346bb', 'COMPLETED', '2026-10-22 12:20:59', '2026-10-22 12:21:53', '2026-10-22 12:22:05'),
('6ad9fffb5dfb688553f410d8', 'GB&C-008',   'bnmbz',                        '6ad9a1589bc3463c0e97306f', NULL,                       'WAITING',   '2026-10-22 12:22:19', NULL,                   NULL),
('6ada13ddd1872833aa426092', 'GB&C-009',   'Abhishek Patel Database Test',  '6ad9a1589bc3463c0e97306f', NULL,                       'WAITING',   '2026-10-22 13:47:09', NULL,                   NULL);


-- ─────────────── INSERT ACTIVITY LOGS (2 rows) ───────────────
INSERT INTO activity_logs (log_id, action, target_table, performed_by, details, logged_at) VALUES
('6ada13ddd1872833aa426094', 'TOKEN_CREATED', 'tokens', 'Abhishek Patel Database Test', '{"tokenId":"6ada13ddd1872833aa426092","tokenNumber":"GB&C-009","customerName":"Abhishek Patel Database Test","service":"General Banking & Cashier"}', '2026-10-22 13:47:09'),
('6ada13d5d1872833aa42608e', 'LOGIN',         'users',  'admin@smartqueue.com',         '{"userId":"6ad9a1589bc3463c0e97306a","email":"admin@smartqueue.com","role":"ADMIN"}',                                                                   '2026-10-22 13:47:01');


-- ============================================================
-- 4. USEFUL SAMPLE QUERIES
-- ============================================================

-- 4.1 View all tokens with service and counter names (JOIN)
-- SELECT
--     t.token_number,
--     t.customer_name,
--     s.service_name,
--     c.counter_name,
--     t.status,
--     t.created_at
-- FROM tokens t
-- JOIN services s ON t.service_id = s.service_id
-- LEFT JOIN counters c ON t.counter_id = c.counter_id
-- ORDER BY t.created_at;

-- 4.2 Count tokens by status
-- SELECT status, COUNT(*) AS total
-- FROM tokens
-- GROUP BY status
-- ORDER BY total DESC;

-- 4.3 Average wait time per service (completed tokens only)
-- SELECT
--     s.service_name,
--     COUNT(t.token_id) AS completed_tokens,
--     ROUND(AVG(EXTRACT(EPOCH FROM (t.called_at - t.created_at)) / 60), 1) AS avg_wait_minutes,
--     ROUND(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.called_at)) / 60), 1) AS avg_service_minutes
-- FROM tokens t
-- JOIN services s ON t.service_id = s.service_id
-- WHERE t.status = 'COMPLETED' AND t.called_at IS NOT NULL
-- GROUP BY s.service_name;

-- 4.4 Tokens currently waiting in queue
-- SELECT token_number, customer_name, s.service_name, t.created_at
-- FROM tokens t
-- JOIN services s ON t.service_id = s.service_id
-- WHERE t.status = 'WAITING'
-- ORDER BY t.created_at;

-- 4.5 Daily token count report
-- SELECT
--     DATE(created_at) AS date,
--     COUNT(*) AS total_tokens,
--     COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
--     COUNT(*) FILTER (WHERE status = 'SKIPPED') AS skipped,
--     COUNT(*) FILTER (WHERE status = 'SERVING') AS currently_serving,
--     COUNT(*) FILTER (WHERE status = 'WAITING') AS still_waiting
-- FROM tokens
-- GROUP BY DATE(created_at)
-- ORDER BY date;


-- ============================================================
-- DONE! Database ready with 6 tables and all CSV data loaded.
-- ============================================================

