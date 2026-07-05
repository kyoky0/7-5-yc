import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import companiesRoutes from './routes/companies.js';
import matchRoutes from './routes/match.js';
import discloseRoutes from './routes/disclose.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.decorate('prisma', prisma);

await app.register(companiesRoutes);
await app.register(matchRoutes);
await app.register(discloseRoutes);

// Serve client build if exists
try {
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'client', 'dist'),
    prefix: '/',
  });
} catch {
  // Client not built yet — fine for dev
}

app.get('/api/health', async () => ({
  status: 'ok',
  localLLM: process.env.USE_LOCAL_LLM !== 'false',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma4-e4b',
}));

const port = parseInt(process.env.PORT || '3000', 10);
await app.listen({ port, host: '0.0.0.0' });
console.log(`Agora server running on http://localhost:${port}`);
