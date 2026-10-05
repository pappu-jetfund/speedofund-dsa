import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('loan', (t) => {
    t.increments('id').primary();
    t.integer('leadID').unsigned().notNullable();
    t.integer('customerID').unsigned().notNullable();
    t.string('status', 50).notNullable();
    t.timestamps(true, true);

    t.index('customerID');
    t.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('loan');
}
