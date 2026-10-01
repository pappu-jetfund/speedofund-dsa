import { env } from './config/default';
import { logger } from './utils/logger';
import { init as initMySQL } from './utils/mysql';
import connectMongo from './utils/mongo';

async function bootstrap() {
  try {
    await initMySQL();
    connectMongo();

    const app = (await import('./app')).default;

    app.listen(env.port, () => {
      logger.info(`Attribution service running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start attribution service');
    process.exit(1);
  }
}

bootstrap();
