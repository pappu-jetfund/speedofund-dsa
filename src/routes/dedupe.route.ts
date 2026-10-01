import dedupeController from '@/controllers/dedupe.controller';
import { decryptEncryptionByJWE, leadCheckMiddleware } from '@/middlewares/auth.middleware';
import dsaMiddleware from '@/middlewares/dsa.middleware';
import validatePayload from '@/middlewares/validation.middleware';
import { Routes } from '@/interfaces/routes.interface';
import { LeadBulkSchemaV2 } from '@/validations/dedupe.validator';
import { Router, text } from 'express';
import rateLimit from 'express-rate-limit';

const DsaRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 4500,
  message: { status: 429, success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

class DedupeRoute implements Routes {
  public path = '/customers';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/check_dedupe`,
      DsaRateLimit,
      text({ type: 'application/jose', limit: '1mb' }),
      decryptEncryptionByJWE,
      leadCheckMiddleware,
      validatePayload({ body: LeadBulkSchemaV2 }),
      dsaMiddleware.saveDsaApiLog,
      dedupeController.checkDedupeV2,
    );
  }
}

export default new DedupeRoute();
