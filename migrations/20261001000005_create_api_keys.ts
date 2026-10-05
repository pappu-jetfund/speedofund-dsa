import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('api_keys', (t) => {
    t.increments('id').primary();
    t.string('api_key', 255).notNullable().unique();
    t.string('client_id', 100).notNullable();
    t.string('client_name', 100).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('rate_limit_per_minute').unsigned().notNullable().defaultTo(60);
    t.integer('rate_limit_per_hour').unsigned().notNullable().defaultTo(1000);
    t.integer('rate_limit_per_day').unsigned().notNullable().defaultTo(10000);
    t.json('allowed_ips').nullable();
    t.json('metadata').nullable();
    t.dateTime('blocked_until').nullable();
    t.text('blocked_reason').nullable();
    t.dateTime('last_used_at').nullable();
    t.timestamps(true, true);

    t.index('client_name');
    t.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('api_keys');
}
