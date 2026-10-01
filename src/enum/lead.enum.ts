export enum LeadStatus {
  FRESH_LEAD = 'Fresh Lead',
  DOCUMENT_RECEIVED = 'Document Received',
  APPROVED = 'Approved',
  DISBURSAL_SHEET_SEND = 'Disbursal Sheet Send',
  DISBURSED = 'Disbursed',
  CLOSED = 'Closed',
  PART_PAYMENT = 'Part Payment',
  SETTLEMENT = 'Settlement',
  INCOMPLETE = 'Incomplete',
  INCOMPLETE_USER = 'Incomplete User',
  BLACK_LISTED = 'Blacklisted',
  APPROVED_PROCESS = 'Approved Process',
}

export const ATTRIBUTION_LEAD_STATUSES = [
  LeadStatus.APPROVED,
  LeadStatus.DISBURSAL_SHEET_SEND,
  LeadStatus.PART_PAYMENT,
  LeadStatus.SETTLEMENT,
  LeadStatus.CLOSED,
  LeadStatus.DISBURSED,
  LeadStatus.BLACK_LISTED,
];
