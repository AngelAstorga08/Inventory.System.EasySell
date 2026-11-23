-- Path: Inventory.System.Database/migrations/V20261117030139533841__create_products_table.sql
-- Author: AngelAstorga08
-- Created at: 2026-11-17T03:01:39Z

CREATE TABLE products (
    id serial PRIMARY KEY,
    name varchar(100) NOT NULL,
    unit_price decimal(10, 2) NOT NULL,
    stock_quantity int NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    barcode varchar(50) NOT NULL UNIQUE,

    CONSTRAINT ck_products_stock_nonnegative
        CHECK (stock_quantity >= 0),

    CONSTRAINT ck_products_price_nonnegative
        CHECK (unit_price >= 0)
);
