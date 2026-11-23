-- Path: Inventory.System.Database/migrations/V20261112231758040039__create_users_table.sql
-- Author: AngelAstorga08
-- Created at: 2026-11-12T23:17:58Z

CREATE TABLE IF NOT EXISTS users (
    id serial primary key,
    username varchar(50) not null unique,
    name varchar(100) not null,
    last_name varchar(100) not null,
    role SMALLINT not null,
    email varchar(100) not null unique,
    is_active boolean not null default true,
    password_hash varchar(255) not null,
    created_at timestamptz NOT NULL default current_timestamp,
    updated_at timestamptz NOT NULL default current_timestamp
);
