import { NextFunction, Request, Response } from 'express';
import { DsaApiLogsModel, ISaveApiLogData } from '../database/mongo/DsaApiLogs';
import { logger } from '@/utils/logger';

class DSAMiddleware {
  private readonly dsaApiLogsModel = DsaApiLogsModel;

  async saveApiLogs(logData: ISaveApiLogData): Promise<void> {
    try {
      logger.info(
        `[DSAMiddleware] saveApiLogs apiType=${logData?.apiType}, dsaId=${logData?.dsaId}, statusCode=${logData?.statusCode}`,
      );
      const logEntry = new this.dsaApiLogsModel(logData);
      await logEntry.save();
    } catch (error) {
      logger.error({ err: error }, '[DSAMiddleware] Error saving API logs');
    }
  }

  saveDsaApiLog = (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', async () => {
      await this.saveApiLogs({
        apiType: res.locals.api_type,
        dsaId: res.locals?.dsaId,
        statusCode: res.statusCode,
        msg: res.locals.msg,
        success: res.locals.success,
      });
    });
    next();
  };
}

export default new DSAMiddleware();
