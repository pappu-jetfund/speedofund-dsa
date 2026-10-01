import { getKnexInstance } from '@/utils/mysql';

class ReferrerModel {
  private table = 'referrer';

  get ReferrerKnex() {
    return getKnexInstance()(this.table);
  }
}

export const referrerModel = new ReferrerModel();
