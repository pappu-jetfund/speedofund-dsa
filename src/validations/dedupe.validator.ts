import Joi, { ObjectSchema } from 'joi';
import { ILeadBulk } from '@/interfaces/customer.interface';

export const LeadBulkSchema: ObjectSchema<ILeadBulk> = Joi.object<ILeadBulk>({
  mobile: Joi.number().required(),
  pancard: Joi.string().required(),
}).unknown(true);

export const LeadBulkSchemaV2: ObjectSchema<ILeadBulk> = Joi.object<ILeadBulk>({
  mobile: Joi.string()
    .when('isHash', {
      is: true,
      then: Joi.string().length(64).hex().required(),
      otherwise: Joi.string().pattern(/^\d{10}$/).required(),
    }),
  pancard: Joi.string()
    .when('isHash', {
      is: true,
      then: Joi.string().length(64).hex().required(),
      otherwise: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
    }),
  isHash: Joi.boolean().optional().default(false),
}).unknown(true);
