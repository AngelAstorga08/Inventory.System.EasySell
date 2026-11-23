-- Path: Inventory.System.Database/migrations/V20261117030433011214__create_sales_table.sql
-- Author: AngelAstorga08
-- Created at: 2026-11-17T03:04:32Z

CREATE TABLE IF NOT EXISTS sales (
    id UUID primary key DEFAULT gen_random_uuid(),
    user_id int not null references users(id),
    sale_number varchar(50) not null unique,
    payment_method SMALLINT not null,
    total_amount decimal(10, 2) not null,
    amount_received decimal(10, 2) not null,
    change_given decimal(10, 2) not null,
    created_at timestamptz NOT NULL default current_timestamp,

    CONSTRAINT ck_sales_total_amount_nonnegative
        CHECK (total_amount >= 0),

    CONSTRAINT ck_sales_amount_received_nonnegative
        CHECK (amount_received >= 0),

    CONSTRAINT ck_sales_change_given_nonnegative
        CHECK (change_given >= 0),

    CONSTRAINT ck_sales_amount_received_covers_total
        CHECK (amount_received >= total_amount),
        
    CONSTRAINT ck_sales_change_given_matches_amounts
        CHECK (change_given = amount_received - total_amount)
);