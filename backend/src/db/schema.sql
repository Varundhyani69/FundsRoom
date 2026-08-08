-- ============================================================
-- ERP + CRM Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS erp_crm_db;
USE erp_crm_db;

-- ------------------------------------------------------------
-- Users (authentication + roles)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'sales', 'warehouse', 'accounts') NOT NULL DEFAULT 'sales',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  mobile          VARCHAR(15) NOT NULL,
  email           VARCHAR(150),
  business_name   VARCHAR(200),
  gst_number      VARCHAR(20),
  customer_type   ENUM('retail', 'wholesale', 'distributor') NOT NULL DEFAULT 'retail',
  address         TEXT,
  status          ENUM('lead', 'active', 'inactive') NOT NULL DEFAULT 'lead',
  follow_up_date  DATE,
  notes           TEXT,
  created_by      INT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Customer Follow-up Notes (separate log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_followups (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  note        TEXT NOT NULL,
  follow_up_date DATE,
  created_by  INT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  sku             VARCHAR(100) NOT NULL UNIQUE,
  category        VARCHAR(100),
  unit_price      DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  current_stock   INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 0,
  warehouse       VARCHAR(150),
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_by      INT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Stock Movement Log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  quantity      INT NOT NULL,
  movement_type ENUM('IN', 'OUT') NOT NULL,
  reason        VARCHAR(255),
  reference_id  INT,                       -- challan id or purchase order id
  reference_type VARCHAR(50),              -- 'challan', 'manual', 'purchase'
  created_by    INT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Sales Challans (header)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challans (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  challan_number  VARCHAR(30) NOT NULL UNIQUE,
  customer_id     INT NOT NULL,
  total_quantity  INT NOT NULL DEFAULT 0,
  total_amount    DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  status          ENUM('draft', 'confirmed', 'cancelled') NOT NULL DEFAULT 'draft',
  notes           TEXT,
  created_by      INT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Challan Line Items (product snapshot stored here)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challan_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  challan_id      INT NOT NULL,
  product_id      INT NOT NULL,
  -- snapshot of product at time of challan creation
  product_name    VARCHAR(200) NOT NULL,
  product_sku     VARCHAR(100) NOT NULL,
  unit_price      DECIMAL(12, 2) NOT NULL,
  quantity        INT NOT NULL,
  line_total      DECIMAL(14, 2) NOT NULL,
  FOREIGN KEY (challan_id) REFERENCES challans(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
