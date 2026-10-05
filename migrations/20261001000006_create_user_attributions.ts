import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_attributions', (t) => {
    t.increments('id').primary();
    t.integer('customerID').unsigned().notNullable();
    t.string('source', 100).nullable();
    t.string('medium', 100).nullable();
    t.string('campaign', 255).nullable();
    t.dateTime('createdDate').notNullable().defaultTo(knex.fn.now());
    t.dateTime('expiryDate').notNullable();


    t.index('customerID');
    t.index('expiryDate');
    t.index(['customerID', 'expiryDate']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_attributions');
}
