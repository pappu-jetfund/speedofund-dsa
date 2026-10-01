import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbHost: process.env.MYSQL_HOST || 'localhost',
  dbPort: Number(process.env.MYSQL_PORT) || 3306,
  dbUsername: process.env.MYSQL_USER || '',
  dbPassword: process.env.MYSQL_PASSWORD || '',
  dbDatabase: process.env.MYSQL_DATABASE || '',
  databaseUrlMongo: process.env.DATABASE_URL_MONGO || '',
  defaultUtmSource: process.env.DEFAULT_UTM_SOURCE || 'app_v1',
  logDir: process.env.LOG_DIR || '../logs',
};
