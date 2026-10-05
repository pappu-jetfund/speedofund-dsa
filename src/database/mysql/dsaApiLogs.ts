import { getKnexInstance } from '@/utils/mysql';
import { logger } from '@/utils/logger';

export interface IDsaApiLog {
  id?: number;
  apiType: string;
  dsaId: number;
  statusCode: number;
  msg?: string | null;
  success?: boolean;
  createdAt?: Date;
}

export type ISaveApiLogData = Omit<IDsaApiLog, 'id' | 'createdAt'>;

class DsaApiLogsModel {
  private table = 'dsa_api_logs';

  async insert(data: ISaveApiLogData): Promise<number | null> {
    try {
      const result = await getKnexInstance()(this.table).insert({
        ...data,
        createdAt: new Date(),
      });
      return result[0];
    } catch (error) {
      logger.error({ err: error }, 'Error inserting dsa_api_log');
      return null;
    }
  }
}

export const dsaApiLogsModel = new DsaApiLogsModel();
