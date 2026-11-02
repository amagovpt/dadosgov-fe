import { bdAnalyticalClient } from '@infrastructure/db/bd-client';
import {
  IEuDimensoesRepository,
  Dimensions,
} from '@domain/fundo-europeu/prr/dimensoes';
import AppError from '@utils/appError';
import { dimensoesQuery } from './dimensoes.queries';

export class DimensoesRepository implements IEuDimensoesRepository {
  async getDimensionsPRR(): Promise<Dimensions[]> {
    try {
      const data = await bdAnalyticalClient.query(dimensoesQuery);
      if (data.rows.length === 0) {
        return [] as Dimensions[];
      }
      const result = data.rows;
      return result as Dimensions[];
    } catch (error) {
      throw new AppError(
        `Error fetching dimensions data: ${error}`,
      ).toGraphQLError();
    }
  }
}
