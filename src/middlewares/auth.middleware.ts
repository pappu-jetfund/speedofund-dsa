import { NextFunction, Request, Response } from 'express';
import { createPrivateKey } from 'crypto';
import { apiKeyModel } from '@/database/mysql/apiKey';
import { logger } from '@/utils/logger';

const logAuthFailure = (req: Request, reason: string, statusCode: number) => {
  logger.warn(
    `Auth failed method=${req.method}, url=${req.originalUrl || req.url}, statusCode=${statusCode}, reason=${reason}`,
  );
};

let _jose: typeof import('jose') | null = null;
const getJose = async (): Promise<typeof import('jose')> => {
  if (!_jose) {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    _jose = await dynamicImport('jose');
  }
  return _jose!;
};

const sendUnauthorized = (res: Response, message: string, statusCode = 401): void => {
  res.status(statusCode).json({ status: statusCode, success: false, message });
};

function loadPrivatePem(): string {
  const val = process.env.SERVER_EC_PRIVATE_PEM_PATH;
  if (!val) throw new Error('SERVER_EC_PRIVATE_PEM_PATH not configured');
  const raw = String(val).trim();
  if (raw.startsWith('-----BEGIN') && raw.includes('PRIVATE KEY-----')) {
    // Inline PEM — normalize escaped newlines
    return raw.replace(/\\n/g, '\n');
  }
  // Treat as file path
  const fs = require('fs');
  return fs.readFileSync(raw, 'utf8');
}

const serverKeyObject = createPrivateKey({ key: loadPrivatePem(), format: 'pem', type: 'sec1' });

export const decryptEncryptionByJWE = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const jwe =
      typeof req.body === 'string' && req.body.length ? req.body : (req as any).rawBody?.toString('utf8');

    if (!jwe || jwe.split('.').length !== 5) {
      logAuthFailure(req, 'invalid_jwe_compact_payload', 400);
      sendUnauthorized(res, 'Invalid JWE compact payload', 400);
      return;
    }

    const { compactDecrypt } = await getJose();
    const { plaintext, protectedHeader } = await compactDecrypt(jwe, serverKeyObject);
    const { alg, enc, client_id } = (protectedHeader || {}) as any;

    logger.info(
      `JWE decrypted method=${req.method}, url=${req.originalUrl}, clientId=${client_id}, alg=${alg}, enc=${enc}`,
    );

    const apiKey = await apiKeyModel.findOne({ client_id });
    if (!apiKey) {
      logAuthFailure(req, 'jwe_client_not_found', 401);
      sendUnauthorized(res, 'Wrong Credentials Decryption');
      return;
    }

    if (client_id !== apiKey.client_id) {
      logAuthFailure(req, 'jwe_client_mismatch', 401);
      sendUnauthorized(res, 'Wrong Credentials');
      return;
    }

    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('application/jose')) {
      logAuthFailure(req, 'unsupported_jwe_content_type', 415);
      sendUnauthorized(res, 'Expected Content-Type: application/jose', 415);
      return;
    }

    if (alg !== 'ECDH-ES' || enc !== 'A256GCM') {
      logAuthFailure(req, 'unsupported_jwe_header', 400);
      sendUnauthorized(res, 'Unsupported JWE header', 400);
      return;
    }

    const envelope = JSON.parse(new TextDecoder().decode(plaintext)) as {
      iat: number;
      exp: number;
      data: any;
    };

    const now = Math.floor(Date.now() / 1000);
    if (envelope.exp && now > envelope.exp) {
      logAuthFailure(req, 'jwe_token_expired', 401);
      sendUnauthorized(res, 'Token expired');
      return;
    }

    req.body = envelope.data || envelope;
    req.body.utmSource = apiKey.client_name || '';
    next();
  } catch (error) {
    logger.error({ err: error }, 'decryptEncryptionByJWE failed');
    sendUnauthorized(res, 'Unauthorized Request');
  }
};

export const leadCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      logAuthFailure(req, 'missing_or_invalid_basic_authorization_header', 401);
      sendUnauthorized(res, 'Unauthorized Request');
      return;
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [key, secret] = credentials.split(':');

    const getApiKeys = await apiKeyModel.findOne({ client_id: key, api_key: secret });
    if (!getApiKeys) {
      logAuthFailure(req, 'invalid_lead_credentials', 401);
      sendUnauthorized(res, 'Wrong Credentials');
      return;
    }

    req.body.utmSource = getApiKeys.client_name;
    res.locals.resolvedApiKey = getApiKeys;
    next();
  } catch (error) {
    logger.error({ err: error }, `leadCheckMiddleware failed method=${req.method}`);
    sendUnauthorized(res, 'Unauthorized Request');
  }
};
