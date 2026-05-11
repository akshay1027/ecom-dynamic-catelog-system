'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('brands', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('logo_url').notNullable().defaultTo('');
    t.text('description').notNullable().defaultTo('');
    t.text('website').notNullable().defaultTo('');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    CREATE UNIQUE INDEX idx_brands_name_lower ON brands (LOWER(name));
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('brands');
};
