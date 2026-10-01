import { IApiKey } from '@/interfaces/api.interface';
import { WhereQuery } from '@/types/model.types';
import { getKnexInstance } from '@/utils/mysql';

class ApiKeyModel {
  private table = 'api_keys';

  async findOne(where: WhereQuery<IApiKey>): Promise<IApiKey | undefined> {
    return await getKnexInstance()(this.table).where(where).select('*').first();
  }
}

export const apiKeyModel = new ApiKeyModel();
