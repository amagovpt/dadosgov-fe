import { bdAnalyticalClient } from '@infrastructure/db/bd-client';
import AppError from '@utils/appError';
import {
  BigNumbersDigitalAtTheServiceOfPeople,
  DigitalTransitionInNumbers,
  IEuDimensionDigitalTransitionRepository,
} from '@domain/fundo-europeu/prr/dimensao-transicao-digital';
import {
  InvestmentInDetails,
  ReformsInDetails,
} from '@/@types/dimensions-types';
import {
  bigNumbersDigitalAtTheServiceOfPeopleQuery,
  digitalTransitionInNumbersQuery,
  investmentInDetailsQuery,
  reformInDetailsQuery,
} from './dimensao-transicao-digital.queries';

export class DigitalTransitionDimensionRepository implements IEuDimensionDigitalTransitionRepository {
  async getDigitalTransitionInNumbers(): Promise<DigitalTransitionInNumbers> {
    try {
      const data = await bdAnalyticalClient.query(
        digitalTransitionInNumbersQuery,
      );

      if (data.rows.length === 0) {
        return {} as DigitalTransitionInNumbers;
      }
      const result = data.rows[0];

      return result.json_data as DigitalTransitionInNumbers;
    } catch (error) {
      throw new AppError(
        `Error fetching Digital Transition In Numbers: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBigNumbersDigitalAtTheServiceOfPeople(): Promise<BigNumbersDigitalAtTheServiceOfPeople> {
    try {
      const data = await bdAnalyticalClient.query(
        bigNumbersDigitalAtTheServiceOfPeopleQuery,
      );

      if (data.rows.length === 0) {
        return {} as BigNumbersDigitalAtTheServiceOfPeople;
      }
      const result = data.rows[0];
      return result.json_data as BigNumbersDigitalAtTheServiceOfPeople;
    } catch (error) {
      throw new AppError(
        `Error fetching Big Numbers Digital At The Service Of People: ${error}`,
      ).toGraphQLError();
    }
  }

  async getInvestmentInDetails(): Promise<InvestmentInDetails> {
    try {
      const data = await bdAnalyticalClient.query(investmentInDetailsQuery);

      if (data.rows.length === 0) {
        return {
          data: [],
          sourceInfo: [],
        } as InvestmentInDetails;
      }

      const result = data.rows[0];

      return result as InvestmentInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching Investment In Details: ${error}`,
      ).toGraphQLError();
    }
  }

  async getReformsInDetails(): Promise<ReformsInDetails> {
    try {
      const data = await bdAnalyticalClient.query(reformInDetailsQuery);

      if (data.rows.length === 0) {
        return {
          data: [],
          sourceInfo: [],
        } as ReformsInDetails;
      }

      const result = data.rows[0];

      return result as ReformsInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching Reforms In Details: ${error}`,
      ).toGraphQLError();
    }
  }
}
