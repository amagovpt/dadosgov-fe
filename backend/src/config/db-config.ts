import { PoolConfig } from 'pg';
import { envParser } from '../lib/envParser';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_APP_NAME } =
  envParser;

export const dbAnalyticalConfig = {
  host: DB_HOST,
  port: parseInt(String(DB_PORT), 10),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // return an error after 5 seconds if connection could not be established
} as PoolConfig;

export const dbApplicationConfig = {
  host: DB_HOST,
  port: parseInt(String(DB_PORT), 10),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_APP_NAME,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // return an error after 5 seconds if connection could not be established
} as PoolConfig;
