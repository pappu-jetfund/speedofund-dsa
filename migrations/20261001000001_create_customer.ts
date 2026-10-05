import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('customer', (t) => {
    t.increments('customerID').primary();
    t.bigInteger('mobile').notNullable();
    t.string('pancard', 20).nullable();
    t.string('mobile_hash', 64).nullable();
    t.string('pancard_hash', 64).nullable();
    t.timestamps(true, true);

    t.index('mobile');
    t.index('pancard');
    t.index('mobile_hash');
    t.index('pancard_hash');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('customer');
}
