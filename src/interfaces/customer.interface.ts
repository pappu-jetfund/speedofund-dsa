export interface ICustomer {
  customerID?: number;
  name?: string;
  mobile: number;
  pancard?: string;
  mobile_hash?: string;
  pancard_hash?: string;
  [key: string]: any;
}

export interface ILeadBulk {
  mobile: number | string;
  pancard: string;
  isHash?: boolean;
  [key: string]: any;
}

export interface IDedupeRequest {
  mobile: number | string;
  pancard: string;
  isHash?: boolean;
  [key: string]: any;
}
