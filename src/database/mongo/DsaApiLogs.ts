import { model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'DsaApiLogs';
export const COLLECTION_NAME = 'dsaApiLogs';

export interface IDsaApiLogs {
  id?: string;
  apiType: string;
  dsaId: number;
  statusCode: number;
  msg?: string | null;
  success?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDsaApiLogs>(
  {
    apiType: { type: String, required: true },
    dsaId: { type: Number, required: true },
    statusCode: { type: Number, required: true },
    msg: { type: Schema.Types.Mixed, default: null },
    success: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

// Auto-delete after 90 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const DsaApiLogsModel = model<IDsaApiLogs>(DOCUMENT_NAME, schema, COLLECTION_NAME);

export type ISaveApiLogData = Omit<IDsaApiLogs, 'id' | 'createdAt' | 'updatedAt'>;
