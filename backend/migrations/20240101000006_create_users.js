'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('email').notNullable();
    table.text('password_hash').notNullable();
    table.text('role').notNullable().defaultTo('viewer');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'viewer'))`);
  await knex.raw(`CREATE UNIQUE INDEX idx_users_email ON users (LOWER(email))`);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
};
