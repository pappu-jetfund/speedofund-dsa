import { env } from '@/config/default';
import AttributionsModel from '@/database/mysql/attributions';
import LeadModel from '@/database/mysql/leads';
import { loanModel } from '@/database/mysql/loan';
import { referrerModel } from '@/database/mysql/referrer';
import { ATTRIBUTION_LEAD_STATUSES, LeadStatus } from '@/enum/lead.enum';
import { ICustomer } from '@/interfaces/customer.interface';
import { ILeadBulkRequest } from '@/interfaces/lead.interface';
import { logger } from '@/utils/logger';
import { getKnexInstance } from '@/utils/mysql';

class AttributionService {
  private readonly leadModel = new LeadModel();
  private readonly attributionsModel = new AttributionsModel();
  private readonly loanModel = loanModel;
  private readonly referrerModel = referrerModel;

  /**
   * Dedupe check with attribution lookup — used by POST /customers/check_dedupe.
   * Returns success/fail without inserting any attribution record.
   */
  async checkDedupeV2(
    payload: ILeadBulkRequest,
    utm: string,
    isHash: boolean = false,
  ): Promise<{ success: boolean; message: string; logMsg: string }> {
    const knex = getKnexInstance();

    const customer: ICustomer = await knex('customer as cx')
      .where(isHash ? 'cx.mobile_hash' : 'cx.mobile', String(payload.mobile))
      .orWhere(isHash ? 'cx.pancard_hash' : 'cx.pancard', String(payload.pancard))
      .first();

    if (!customer) {
      return { success: true, message: 'Dedup Success', logMsg: 'Customer not found' };
    }

    logger.info(`Customer found with same mobile or pancard, customerID: ${customer.customerID}`);

    const [lead, loan] = await Promise.all([
      this.leadModel.LeadsKnex.where('customerID', customer.customerID)
        .whereIn('status', ATTRIBUTION_LEAD_STATUSES)
        .select('leadID', 'status')
        .first(),
      this.loanModel.LoanKnex.where('customerID', customer.customerID)
        .where('status', LeadStatus.DISBURSED)
        .select('leadID')
        .first(),
    ]);

    logger.info(`Lead found: ${lead ? 'Yes' : 'No'}, Loan found: ${loan ? 'Yes' : 'No'}`);

    if (lead || loan) {
      return {
        success: false,
        message: 'Dedup Fail',
        logMsg: `Lead found: ${lead ? 'Yes' : 'No'}, Loan found: ${loan ? 'Yes' : 'No'}`,
      };
    }

    logger.info(
      `***** No active lead or loan found for customer ${customer.customerID}, checking attributions for ${utm} *****`,
    );

    const checkAttribution = await this.attributionsModel.AttributionsKnex.where(
      'customerID',
      customer.customerID,
    )
      .select('id', 'customerID', 'source', 'expiryDate')
      .orderBy('id', 'desc')
      .first();

    if (!checkAttribution) {
      const lastLead = await this.leadModel.LeadsKnex.where('customerID', customer.customerID)
        .orderBy('createdDate', 'desc')
        .first();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (lastLead && new Date(lastLead.createdDate) > thirtyDaysAgo) {
        return {
          success: false,
          message: 'Dedup Fail',
          logMsg: `Last lead created at: ${lastLead.createdDate}`,
        };
      }
      return {
        success: true,
        message: 'Dedup Success',
        logMsg: `Last lead created at: ${lastLead ? lastLead.createdDate : 'No lead found'}`,
      };
    }

    logger.info(
      `Active attribution found customerID=${customer.customerID}, attributionID=${checkAttribution?.id}, source=${checkAttribution?.source}, expiryDate=${checkAttribution?.expiryDate}`,
    );

    if (checkAttribution.expiryDate > new Date()) {
      if (checkAttribution.source !== utm) {
        return {
          success: false,
          message: 'Dedup Fail',
          logMsg: `Active attribution found. Existing UTM: ${checkAttribution.source}, Requested UTM: ${utm}`,
        };
      }
      return {
        success: true,
        message: 'Dedup Success',
        logMsg: `Active attribution found for same UTM: ${utm}`,
      };
    }

    logger.info(
      `***** Attribution expired for customer ${customer.customerID}, UTM: ${utm} *****`,
    );
    return { success: true, message: 'Dedup Success', logMsg: 'Customer found, but attribution has expired.' };
  }

  /**
   * Attribution check + insert — used after customer onboarding flows.
   * Returns success/fail and inserts a new attribution record if eligible.
   */
  checkCustomerAttributionsAPI = async (
    customerID: number,
    mobile: number,
    isDedup: boolean = false,
    medium: string = '',
    utm: string = env.defaultUtmSource,
  ): Promise<{ success: boolean; message: string; attributionID?: number | null }> => {
    try {
      const leadStatuses = [
        LeadStatus.FRESH_LEAD,
        LeadStatus.DOCUMENT_RECEIVED,
        LeadStatus.APPROVED,
        LeadStatus.DISBURSAL_SHEET_SEND,
        LeadStatus.DISBURSED,
        LeadStatus.CLOSED,
        LeadStatus.PART_PAYMENT,
        LeadStatus.SETTLEMENT,
        LeadStatus.APPROVED_PROCESS,
        LeadStatus.INCOMPLETE,
        LeadStatus.INCOMPLETE_USER,
        LeadStatus.BLACK_LISTED,
      ];

      const [lastLead, loanResult] = await Promise.all([
        this.leadModel.LeadsKnex.where('customerID', customerID)
          .whereIn('status', leadStatuses)
          .select('leadID', 'status')
          .first(),
        this.loanModel.LoanKnex.where('customerID', customerID)
          .where('status', LeadStatus.DISBURSED)
          .select('leadID')
          .first(),
      ]);

      let shouldInsertAttribution = !lastLead && !loanResult;

      if (shouldInsertAttribution) {
        const existingAttr = await this.attributionsModel.AttributionsKnex.where('customerID', customerID)
          .where('expiryDate', '>', new Date())
          .first();

        if (existingAttr) {
          shouldInsertAttribution = false;
        }
      }

      if (isDedup) {
        return {
          success: shouldInsertAttribution,
          message: shouldInsertAttribution ? 'Dedup Success' : 'Dedup Fail',
        };
      }

      if (shouldInsertAttribution) {
        const knex = getKnexInstance();
        const reff = await this.referrerModel.ReferrerKnex.select('referrer', 'ad_info')
          .where('mobile', mobile)
          .andWhere('created_at', '>=', knex.raw('NOW() - INTERVAL 30 DAY'))
          .orderBy('id', 'desc')
          .first();

        const source = reff?.referrer || utm;
        let adInfo: any[] = [];
        try { adInfo = JSON.parse(reff?.ad_info || '[]'); } catch (_) {}

        let att = '', atdt = '', camp = '', gaid = '', apv = '', trackingid = '';
        if (Array.isArray(adInfo) && adInfo.length > 0) {
          const first = adInfo[0];
          att = first?.att || '';
          atdt = first?.atdt || '';
          camp = first?.camp || '';
          gaid = first?.gaid || '';
          apv = first?.apv || '';
          trackingid = first?.trackingid || '';
        }

        const insertedID = await this.attributionsModel.insert({
          customerID,
          source,
          medium,
          campaign: '',
          createdDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          att,
          atdt,
          camp,
          gaid,
          apv,
          trackingid,
        });

        return { success: true, message: 'Attributed Successfully', attributionID: insertedID };
      }

      return { success: false, message: 'User already associated with us.', attributionID: null };
    } catch (error) {
      logger.error({ err: error }, 'Error in checkCustomerAttributionsAPI');
      return { success: false, message: 'An error occurred while checking or inserting attribution' };
    }
  };
}

export default new AttributionService();
