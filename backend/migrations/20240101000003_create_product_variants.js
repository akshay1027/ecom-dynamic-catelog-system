'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('product_variants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.jsonb('options').notNullable().defaultTo('{}');
    t.integer('stock').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE product_variants
      ADD CONSTRAINT chk_variant_stock_nonneg CHECK (stock >= 0)
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('product_variants');
};
