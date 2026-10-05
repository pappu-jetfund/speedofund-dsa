import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('referrer', (t) => {
    t.increments('id').primary();
    t.bigInteger('mobile').notNullable();
    t.string('referrer', 100).nullable();
    t.json('ad_info').nullable();
    t.dateTime('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('mobile');
    t.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('referrer');
}
