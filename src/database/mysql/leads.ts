import { getKnexInstance } from '@/utils/mysql';

export default class LeadModel {
  private table = 'leads';

  get LeadsKnex() {
    return getKnexInstance()(this.table);
  }
}
