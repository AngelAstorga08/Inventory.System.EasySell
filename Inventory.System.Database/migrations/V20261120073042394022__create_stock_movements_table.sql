-- Path: Inventory.System.Database/migrations/V20261120073042394022__create_stock_movements_table.sql
-- Author: AngelAstorga08
-- Created at: 2026-11-20T07:30:42Z

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INT NOT NULL REFERENCES products(id),
    user_id INT NOT NULL REFERENCES users(id),
    sale_id UUID REFERENCES sales(id),
    movement_type VARCHAR NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_stock_movements_previous_stock_nonnegative CHECK (previous_stock >= 0),
    CONSTRAINT ck_stock_movements_new_stock_nonnegative CHECK (new_stock >= 0),
    CONSTRAINT ck_stock_movements_stock_changed CHECK (previous_stock <> new_stock)
);
