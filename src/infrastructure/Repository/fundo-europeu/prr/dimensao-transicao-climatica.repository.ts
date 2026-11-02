import { bdAnalyticalClient } from '@infrastructure/db/bd-client';
import {
  IEuDimensionClimateTransitionRepository,
  TransitionClimaticInNumbers,
  bigNumbersSustainableDevelopment,
} from '@domain/fundo-europeu/prr/dimensao-transicao-climatica';
import AppError from '@utils/appError';
import {
  bigNumbersSustainableDevelopmentQuery,
  transitionClimaticInNumbersQuery,
  investmentInDetailClimateTransitionQuery,
  reformsInDetailsClimateTransitionQuery,
} from './dimensao-transicao-climatica.queries';
import {
  InvestmentInDetails,
  ReformsInDetails,
} from '@/@types/dimensions-types';

export class DimensaoTransicaoClimaticaRepository implements IEuDimensionClimateTransitionRepository {
  async getTransitionClimaticInNumbers(): Promise<TransitionClimaticInNumbers> {
    try {
      const data = await bdAnalyticalClient.query(
        transitionClimaticInNumbersQuery,
      );

      if (data.rows.length === 0) {
        return {} as TransitionClimaticInNumbers;
      }
      const result = data.rows[0];

      return result as TransitionClimaticInNumbers;
    } catch (error) {
      throw new AppError(
        `Error fetching Transition Climatic In Numbers: ${error}`,
      ).toGraphQLError();
    }
  }

  async getBigNumbersSustainableDevelopment(): Promise<bigNumbersSustainableDevelopment> {
    try {
      const data = await bdAnalyticalClient.query(
        bigNumbersSustainableDevelopmentQuery,
      );

      if (data.rows.length === 0) {
        return {} as bigNumbersSustainableDevelopment;
      }
      const result = data.rows[0];
      return result as bigNumbersSustainableDevelopment;
    } catch (error) {
      throw new AppError(
        `Error fetching Big Numbers Sustainable Development: ${error}`,
      ).toGraphQLError();
    }
  }

  async getInvestmentInDetailsClimateTransition(): Promise<InvestmentInDetails> {
    try {
      const data = await bdAnalyticalClient.query(
        investmentInDetailClimateTransitionQuery,
      );

      if (data.rows.length === 0) {
        return {} as InvestmentInDetails;
      }
      const result = data.rows[0];
      return result as InvestmentInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching Investment In Details Climate Transition: ${error}`,
      ).toGraphQLError();
    }
  }

  async getReformsInDetailsClimateTransition(): Promise<ReformsInDetails> {
    try {
      const data = await bdAnalyticalClient.query(
        reformsInDetailsClimateTransitionQuery,
      );

      if (data.rows.length === 0) {
        return {} as ReformsInDetails;
      }
      const result = data.rows[0];
      return result as ReformsInDetails;
    } catch (error) {
      throw new AppError(
        `Error fetching Reforms By Dimension Climate Transition: ${error}`,
      ).toGraphQLError();
    }
  }
}
