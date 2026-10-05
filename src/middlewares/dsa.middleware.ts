import { NextFunction, Request, Response } from 'express';
import { dsaApiLogsModel } from '../database/mysql/dsaApiLogs';
import { logger } from '@/utils/logger';

class DSAMiddleware {
  saveDsaApiLog = (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', async () => {
      if (!res.locals.api_type) return;

      logger.info(
        `[DSAMiddleware] saveApiLogs apiType=${res.locals.api_type}, dsaId=${res.locals.dsaId}, statusCode=${res.statusCode}`,
      );
      await dsaApiLogsModel.insert({
        apiType: res.locals.api_type,
        dsaId: res.locals.dsaId,
        statusCode: res.statusCode,
        msg: res.locals.msg,
        success: res.locals.success,
      });
    });
    next();
  };
}

export default new DSAMiddleware();
