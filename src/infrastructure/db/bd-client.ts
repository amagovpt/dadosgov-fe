import { dbAnalyticalConfig, dbApplicationConfig } from '@/config/db-config';
import { Pool } from 'pg';

const bdAnalyticalClient = new Pool(dbAnalyticalConfig);

const bdApplicationClient = new Pool(dbApplicationConfig);

export { bdAnalyticalClient,  bdApplicationClient};
