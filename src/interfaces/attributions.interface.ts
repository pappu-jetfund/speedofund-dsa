export interface IAttributions {
  id?: number;
  customerID: number;
  source?: string;
  medium?: string;
  campaign?: string;
  createdDate?: string | Date;
  expiryDate?: string | Date;

}

export type TSelectAttribution = keyof IAttributions;
