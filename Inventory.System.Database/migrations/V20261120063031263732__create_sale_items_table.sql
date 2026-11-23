-- Path: Inventory.System.Database/migrations/V20261120063031263732__create_sale_items_table.sql
-- Author: AngelAstorga08
-- Created at: 2026-11-20T06:30:31Z

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_sale_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT ck_sale_items_price_nonnegative CHECK (price >= 0)
);
