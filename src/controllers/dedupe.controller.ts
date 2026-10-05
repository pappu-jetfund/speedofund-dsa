import { DSA_API } from '@/constants/dsa.constants';
import { ILeadBulkRequest } from '@/interfaces/lead.interface';
import attributionService from '@/services/attribution.service';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

class DedupeController {
  private sendResponse(res: Response, status: number, data: any, message: string): Response {
    return res.status(status).json({ status, success: status < 400, message, data });
  }

  checkDedupeV2 = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const payload: ILeadBulkRequest = req.body;
      const utm: string = req.body.utmSource || 'app_v1';

      logger.info(`[DedupeController] Check Dedupe Payload: ${JSON.stringify(payload)}`);

      const response = await attributionService.checkDedupeV2(payload, utm, payload.isHash);

      const apiKey = res.locals.resolvedApiKey;
      if (apiKey) {
        res.locals.msg = response.logMsg;
        res.locals.dsaId = apiKey.id;
        res.locals.success = response.message === 'Dedup Success';
        res.locals.api_type = payload.isHash ? DSA_API.SHA_DedupeAPI : DSA_API.DedupeAPI;
      }

      return this.sendResponse(res, 200, {}, response.message);
    } catch (error) {
      logger.error({ err: error, utm: req.body?.utmSource || 'app_v1' }, 'Dedupe V2 check failed');
      next(error);
    }
  };
}

export default new DedupeController();
