export interface IAttributions {
  id?: number;
  customerID: number;
  source?: string;
  medium?: string;
  campaign?: string;
  createdDate?: string | Date;
  expiryDate?: string | Date;
  att?: string;
  atdt?: string;
  camp?: string;
  gaid?: string;
  apv?: string;
  trackingid?: string;
}

export type TSelectAttribution = keyof IAttributions;
