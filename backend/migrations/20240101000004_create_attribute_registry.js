'use strict';

exports.up = async (knex) => {
  await knex.schema.createTable('attribute_registry', (t) => {
    t.text('category').notNullable();
    t.text('key').notNullable();
    t.text('type').notNullable();
    t.specificType('values', 'TEXT[]');
    t.decimal('min_val', 20, 6);
    t.decimal('max_val', 20, 6);
    t.boolean('is_variant_dimension').notNullable().defaultTo(false);
    t.primary(['category', 'key']);
  });

  await knex.raw(`
    ALTER TABLE attribute_registry
    ADD CONSTRAINT chk_attr_type CHECK (type IN ('string', 'number', 'boolean'));
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('attribute_registry');
};
