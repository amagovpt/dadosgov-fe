import { bdAnalyticalClient } from '@infrastructure/db/bd-client';
import {
  IEuDimensaoResilienciaRepository,
  ResiliencyInNumbers,
  BigNumberMoreResilientCountryEconomy,
} from '@domain/fundo-europeu/prr/dimensao-resiliencia';
import AppError from '@utils/appError';
import {
  resiliencyInNumberQuery,
  bigNumberMoreResilientCountryEconomyQuery,
  investmentInDetailsQuery,
  reformsIndetailsQuery,
} from './dimensao-resiliencia.queries';
import { InvestmentInDetails, ReformsInDetails } from '@/@types/dimensions-types';

export class DimensaoResilienciaRepository implements IEuDimensaoResilienciaRepository {
  async getResiliencyInNumbers(): Promise<ResiliencyInNumbers> {
    try {
      const data = await bdAnalyticalClient.query(resiliencyInNumberQuery);

      if (data.rows.length === 0) {
        return {} as ResiliencyInNumbers;
      }

      const result = data.rows[0];

      return result as ResiliencyInNumbers;
    } catch (error) {
      throw new AppError(
        `Error fetching resiliency in numbers: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBigNumberMoreResilientCountryEconomy(): Promise<BigNumberMoreResilientCountryEconomy> {
    try {
      const data = await bdAnalyticalClient.query(
        bigNumberMoreResilientCountryEconomyQuery,
      );

      if (data.rows.length === 0) {
        return {} as BigNumberMoreResilientCountryEconomy;
      }
      const result = data.rows[0];
      return result as BigNumberMoreResilientCountryEconomy;
    } catch (error) {
      throw new AppError(
        `Error fetching big number more resilient country economy: ${error}`,
      ).toGraphQLError();
    }
  }

  async getInvestmentInDetails(): Promise<InvestmentInDetails> {
    try {
      const data = await bdAnalyticalClient.query(investmentInDetailsQuery);

      if (data.rows.length === 0) {
        return {} as InvestmentInDetails;
      }

      const result = data.rows[0];

      return result as InvestmentInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching investment in details: ${error}`,
      ).toGraphQLError();
    }
  }

  async getReformsInDetails(): Promise<ReformsInDetails> {
    try {
      const data = await bdAnalyticalClient.query(reformsIndetailsQuery);

      if (data.rows.length === 0) {
        return {} as ReformsInDetails;
      }
      const result = data.rows[0];
      return result as ReformsInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching reforms by dimension: ${error}`,
      ).toGraphQLError();
    }
  }
}
