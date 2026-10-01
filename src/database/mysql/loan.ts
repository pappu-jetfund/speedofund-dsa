import { getKnexInstance } from '@/utils/mysql';

class LoanModel {
  private table = 'loan';

  get LoanKnex() {
    return getKnexInstance()(this.table);
  }
}

export const loanModel = new LoanModel();
