import type { Knex } from 'knex';

// All possible lead statuses used across the codebase
const LEAD_STATUSES = [
  'Fresh Lead',
  'Document Received',
  'Approved',
  'Disbursal Sheet Send',
  'Disbursed',
  'Closed',
  'Part Payment',
  'Settlement',
  'Incomplete',
  'Incomplete User',
  'Blacklisted',
  'Approved Process',
];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('leads', (t) => {
    t.increments('leadID').primary();
    t.integer('customerID').unsigned().notNullable();
    t.enum('status', LEAD_STATUSES).notNullable();
    t.dateTime('createdDate').notNullable().defaultTo(knex.fn.now());

    t.index('customerID');
    t.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('leads');
}
