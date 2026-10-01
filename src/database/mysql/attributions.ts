import { IAttributions, TSelectAttribution } from '@/interfaces/attributions.interface';
import { KnexFindParams, UpdateQuery, WhereQuery } from '@/types/model.types';
import { logger } from '@/utils/logger';
import { getKnexInstance } from '@/utils/mysql';

export default class AttributionsModel {
  private table = 'user_attributions';

  get AttributionsKnex() {
    return getKnexInstance()(this.table);
  }

  async findOne(params: KnexFindParams<IAttributions, TSelectAttribution>): Promise<IAttributions> {
    const { order, select = ['*'], where, whereIn, whereNot, whereNotNull, paginate } = params;
    let query = getKnexInstance()(this.table);

    if (where) {
      if (Array.isArray(where)) {
        where.forEach((element: any) => {
          const { column, operator, value } = element;
          if (operator) query.where(column, operator, value);
          else query.where(column, value);
        });
      } else {
        query.where(where);
      }
    }

    query.select(...select);

    if (whereIn) whereIn.forEach(({ column, value }) => query.whereIn(column, value));
    if (whereNot) query.whereNot(whereNot);
    if (whereNotNull) whereNotNull.forEach((column) => query.whereNotNull(column));
    if (order) query.orderBy(order);
    if (paginate) query.limit(paginate.perPage).offset(paginate.page);

    return await query.first();
  }

  public async findOneAndUpdate(
    where: WhereQuery<IAttributions>,
    update: UpdateQuery<IAttributions>,
  ): Promise<number> {
    return await getKnexInstance().table(this.table).where(where).update(update);
  }

  public async insert(data: Partial<IAttributions>): Promise<number | null> {
    try {
      const result = await getKnexInstance()(this.table).insert(data);
      return result[0];
    } catch (error) {
      logger.error({ err: error }, 'Error in attributions.ts insert function');
      return null;
    }
  }
}

export const attributionsModel = new AttributionsModel();
