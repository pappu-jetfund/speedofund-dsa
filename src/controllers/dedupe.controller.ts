import { DSA_API } from '@/constants/dsa.constants';
import { apiKeyModel } from '@/database/mysql/apiKey';
import { ILeadBulkRequest } from '@/interfaces/lead.interface';
import attributionService from '@/services/attribution.service';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

const maskMobile = (mobile: string): string =>
  mobile ? `${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}` : '';

const maskPancard = (pan: string): string =>
  pan ? `${pan.slice(0, 3)}XXXXX${pan.slice(-2)}` : '';

class DedupeController {
  private sendResponse(res: Response, status: number, data: any, message: string): Response {
    return res.status(status).json({ status, success: status < 400, message, data });
  }

  checkDedupeV2 = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const payload: ILeadBulkRequest = req.body;
      const utm: string = req.body.utmSource || 'app_v1';

      const maskedPayload = {
        mobile: maskMobile(payload.mobile),
        pancard: maskPancard(payload.pancard),
      };

      if (payload.isHash) {
        logger.info(`[DedupeController] SHA Check Dedupe Payload: ${JSON.stringify(payload)}`);
      } else {
        logger.info(`[DedupeController] Masked Check Dedupe Payload: ${JSON.stringify(maskedPayload)}`);
      }

      const response = await attributionService.checkDedupeV2(payload, utm, payload.isHash);

      const apiKey = await apiKeyModel.findOne({ client_name: utm });
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
