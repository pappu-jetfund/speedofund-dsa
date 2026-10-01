import { NextFunction, Request, Response } from 'express';
import { ObjectSchema, Schema } from 'joi';

interface ValidationSchemas {
  body?: ObjectSchema;
  query?: Schema;
  params?: Schema;
}

const validatePayload =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { body, query, params } = schemas;

    if (body) {
      const { error, value } = body.validate(req.body, { abortEarly: false });
      if (error) {
        res.status(400).json({ status: 400, success: false, message: error.details[0].message });
        return;
      }
      req.body = value;
    }

    if (query) {
      const { error, value } = query.validate(req.query, { abortEarly: false });
      if (error) {
        res.status(400).json({ status: 400, success: false, message: error.details[0].message });
        return;
      }
      req.query = value;
    }

    if (params) {
      const { error, value } = params.validate(req.params, { abortEarly: false });
      if (error) {
        res.status(400).json({ status: 400, success: false, message: error.details[0].message });
        return;
      }
      req.params = value;
    }

    next();
  };

export default validatePayload;
