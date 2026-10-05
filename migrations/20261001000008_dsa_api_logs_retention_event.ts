import type { Knex } from 'knex';

// Requires MySQL Event Scheduler to be enabled: SET GLOBAL event_scheduler = ON;
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE EVENT IF NOT EXISTS cleanup_dsa_api_logs
    ON SCHEDULE EVERY 1 DAY
    DO DELETE FROM dsa_api_logs WHERE createdAt < NOW() - INTERVAL 90 DAY
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP EVENT IF EXISTS cleanup_dsa_api_logs');
}
