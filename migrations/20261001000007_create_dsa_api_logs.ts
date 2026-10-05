import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('dsa_api_logs', (t) => {
    t.increments('id').primary();
    t.string('apiType', 100).notNullable();
    t.integer('dsaId').unsigned().notNullable();
    t.smallint('statusCode').notNullable();
    t.text('msg').nullable();
    t.boolean('success').notNullable().defaultTo(false);
    t.dateTime('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index(['dsaId', 'createdAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('dsa_api_logs');
}
