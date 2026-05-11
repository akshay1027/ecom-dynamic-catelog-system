'use strict';

exports.up = async (knex) => {
  await knex.raw('CREATE INDEX idx_products_category        ON products(category)');
  await knex.raw('CREATE INDEX idx_products_type            ON products(type)');
  await knex.raw('CREATE INDEX idx_products_brand_id        ON products(brand_id)');
  await knex.raw('CREATE INDEX idx_products_price           ON products(price)');
  await knex.raw('CREATE INDEX idx_products_attributes_gin  ON products USING GIN(attributes)');
  await knex.raw('CREATE INDEX idx_variants_product_id      ON product_variants(product_id)');
  await knex.raw('CREATE INDEX idx_variants_options_gin     ON product_variants USING GIN(options)');
  await knex.raw('CREATE INDEX idx_attr_registry_category   ON attribute_registry(category)');
};

exports.down = async (knex) => {
  await knex.raw('DROP INDEX IF EXISTS idx_attr_registry_category');
  await knex.raw('DROP INDEX IF EXISTS idx_variants_options_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_variants_product_id');
  await knex.raw('DROP INDEX IF EXISTS idx_products_attributes_gin');
  await knex.raw('DROP INDEX IF EXISTS idx_products_price');
  await knex.raw('DROP INDEX IF EXISTS idx_products_brand_id');
  await knex.raw('DROP INDEX IF EXISTS idx_products_type');
  await knex.raw('DROP INDEX IF EXISTS idx_products_category');
};
