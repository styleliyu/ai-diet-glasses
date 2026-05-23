CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    weight DOUBLE NULL DEFAULT 65.0,
    goal_type VARCHAR(32) NOT NULL DEFAULT 'maintain',
    use_target INT NOT NULL DEFAULT 0,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS food_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    calorie VARCHAR(32) NULL,
    total_calorie INT NOT NULL DEFAULT 0,
    estimated_weight INT NOT NULL DEFAULT 0,
    protein VARCHAR(32) NULL,
    fat VARCHAR(32) NULL,
    carbs VARCHAR(32) NULL,
    advice TEXT NULL,
    image_url VARCHAR(1024) NULL,
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_food_records_username_time (username, create_time),
    INDEX idx_food_records_username_food_time (username, food_name, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password, email, weight, goal_type, use_target)
VALUES ('demo_user', '123456', 'demo_user@example.com', 65.0, 'maintain', 0)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    email = VALUES(email),
    weight = VALUES(weight),
    goal_type = VALUES(goal_type),
    use_target = VALUES(use_target);
