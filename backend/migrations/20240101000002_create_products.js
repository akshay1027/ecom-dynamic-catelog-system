'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('description').notNullable().defaultTo('');
    t.decimal('price', 12, 2).notNullable();
    t.specificType('currency', 'CHAR(3)').notNullable();
    t.text('category').notNullable();
    t.text('type').notNullable();
    t.jsonb('images').notNullable().defaultTo('[]');
    t.integer('stock').notNullable().defaultTo(0);
    t.specificType('tags', 'TEXT[]').notNullable().defaultTo('{}');
    t.jsonb('attributes').notNullable().defaultTo('{}');
    t.uuid('brand_id').notNullable().references('id').inTable('brands');
    t.text('brand_name').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE products
      ADD CONSTRAINT chk_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
      ADD CONSTRAINT chk_price_nonneg CHECK (price >= 0),
      ADD CONSTRAINT chk_stock_nonneg CHECK (stock >= 0)
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('products');
};
