import { env } from '../config/default';
import { logger } from './logger';
import knex, { Knex } from 'knex';
import retry from 'retry';

let dbConnection: Knex | null = null;

async function createWithRetries(): Promise<Knex> {
  const operation = retry.operation({ retries: 5, factor: 2, minTimeout: 2000, maxTimeout: 10000 });

  return new Promise<Knex>((resolve, reject) => {
    operation.attempt(async (attempt) => {
      const instance = knex({
        client: 'mysql2',
        connection: {
          host: env.dbHost,
          port: env.dbPort,
          user: env.dbUsername,
          password: env.dbPassword,
          database: env.dbDatabase,
        },
        pool: { min: 2, max: 10, idleTimeoutMillis: 30000 },
        acquireConnectionTimeout: 10000,
      });

      try {
        await instance.raw('SELECT 1');
        logger.info({ database: env.dbDatabase, host: env.dbHost, attempt }, 'MySQL connected');
        resolve(instance);
      } catch (err: any) {
        try { await instance.destroy(); } catch (_) {}
        if (operation.retry(err)) {
          logger.warn(`MySQL reconnect attempt ${attempt}`);
        } else {
          reject(err);
        }
      }
    });
  });
}

export async function init() {
  const instance = await createWithRetries();
  dbConnection = instance;
  process.once('SIGINT', async () => { await dbConnection?.destroy(); dbConnection = null; });
  process.once('SIGTERM', async () => { await dbConnection?.destroy(); dbConnection = null; });
}

export const getKnexInstance = (): Knex => {
  if (!dbConnection) throw new Error('MySQL not initialized');
  return dbConnection;
};
