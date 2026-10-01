import { Knex } from 'knex';

export type WhereQuery<T> =
  | Partial<T>
  | ((query: Knex.QueryBuilder) => any)
  | AlternateWhere<T>[];

export type UpdateQuery<T> = Partial<T>;
export type SelectFields<T> = T[] | ['*'];

type SortItem<T> = T | { column: T; order?: 'asc' | 'desc'; nulls?: 'first' | 'last' };
export type SortCriteria<T> = SortItem<T>[];
export type InsertData<T> = T;

export type AlternateWhere<T> = {
  column: keyof T;
  operator?: string;
  value: T[keyof T];
};

export type WhereIn<T> = { column: T; value: string[] | number[] | boolean[] };
export type Paginate = { page: number; perPage: number };

export type KnexFindParams<TModel, TSelectModel extends keyof TModel> = {
  where?: WhereQuery<TModel>;
  select?: SelectFields<TSelectModel>;
  order?: SortCriteria<TSelectModel>;
  whereIn?: WhereIn<TSelectModel>[];
  whereNotNull?: (TSelectModel)[];
  whereNot?: WhereQuery<TModel>;
  paginate?: Paginate;
};
