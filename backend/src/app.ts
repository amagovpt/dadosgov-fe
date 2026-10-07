import 'reflect-metadata';
import express, { RequestHandler } from 'express';
import * as dotenv from 'dotenv';
import http from 'http';
import logger from 'morgan';
import fs from 'fs';
import path from 'path';
import type { GraphQLSchema } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { stitchSchemas } from '@graphql-tools/stitch';
import { createProxyServer } from 'httpxy';
import routes from './interfaces/routes';
import cors from './lib/plugins/cors';
import errorHandler from '@/middleware/errorHandler';
import { getRemoteSchema } from '@infrastructure/cms/remote-schema';
import { loggingMiddleware } from '@lib/plugins/logger';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';
import { envParser } from '@lib/envParser';
import { getAllSchemas } from './presentation/schemas/schema';
import { bdAnalyticalClient } from '@infrastructure/db/bd-client';
import { responseCache } from '@lib/plugins/response-cache';

const { CMS_URL } = envParser;

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Logger to file
const logDir = envParser.LOG_DIR;
fs.mkdirSync(logDir, { recursive: true });

//Connect to PostgreSQL database
(async () => {
  try {
    await bdAnalyticalClient.query('SELECT 1');
  } catch (error) {
    console.error('Error connecting to the PostgreSQL database:', error);
  }
})();

const proxy = createProxyServer({
  target: CMS_URL,
  changeOrigin: true,
  xfwd: true, // adiciona os headers X-Forwarded-*
  secure: false,
});

proxy.on('error', (err, _req, res) => {
  console.error('[proxy]', err.message);
  if (res && 'headersSent' in res && !res.headersSent) {
    res.statusCode = 502;
    res.end('Bad gateway');
  }
});

export const cmsProxyAssets: RequestHandler = (req, res, next) => {
  req.url = `/api/assets/dados-gov${req.url}`; 
  proxy.web(req, res).catch(next);
};

app.use(
  logger('common', {
    stream: fs.createWriteStream(path.join(logDir, 'access.log'), {
      flags: 'a',
    }),
  }),
);

// Logger to console
app.use(
  logger('dev', {
    skip: (req) => {
      const skipPaths = ['/healthcheck', '/metrics', '/favicon.ico'];
      return skipPaths.some((path) => req.url === path || req.path === path);
    },
  }),
);

// Middleware setup
app.use(cors);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Trust proxy (rate-limiting, secure cookies)
app.set('trust proxy', 1);

// Custom request logger
app.use(loggingMiddleware);

// Routes
app.use('/api', routes);

async function makeGatewayShema() {
  return stitchSchemas({
    subschemas: [await getRemoteSchema(), await getAllSchemas()],
    typeDefs: 'type Query { heartbeat: String! }',
    resolvers: {
      Query: {
        heartbeat: () => 'OK',
      },
    },
  });
}

let cachedSchema: GraphQLSchema | null = null;

const schemaReady = makeGatewayShema().then((s) => {
  cachedSchema = s;
});

schemaReady.then(() => {
  const intervalMs = envParser.SCHEMA_POLL_INTERVAL_MS;
  setInterval(async () => {
    try {
      cachedSchema = await makeGatewayShema();
      console.info('[SCHEMA] Refreshed successfully');
    } catch (err) {
      console.error('[SCHEMA] Refresh failed, keeping previous schema:', err);
    }
  }, intervalMs);
});

app.use('/api/assets', cmsProxyAssets);

// GraphQL Yoga server

const yoga = createYoga({
  schema: async () => {
    if (!cachedSchema) await schemaReady;
    return cachedSchema!;
  },
  graphqlEndpoint: '/graphql',
  logging: true,
  graphiql:
    process.env.NODE_ENV === 'production'
      ? false
      : {
          endpoint: '/graphql',
        },
  plugins: [
    useDisableIntrospection({
      // Set production env to allow introspection for local development, and disable in prod
      isDisabled: () => process.env.NODE_ENV === 'production',
    }),
    responseCache,
  ],
  context: ({ request }) => ({ request }),
});

app.use('/graphql', yoga);

// 404 Handler
app.use((req, res) => {
  console.warn(`404 - Not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: 'Not found',
  });
});

// Error handling middleware
app.use(errorHandler);

export { server };
