import { env } from '../config/default';
import { logger } from './logger';
import { connect, set } from 'mongoose';

export default function connectMongo() {
  if (env.nodeEnv !== 'production') set('debug', false);
  set('strictQuery', false);
  connect(env.databaseUrlMongo)
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => {
      logger.error({ err }, 'MongoDB connection failed');
      process.exit(-1);
    });
}
