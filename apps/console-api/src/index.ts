import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(swagger, { openapi: { info: { title: 'Control Plane API', version: '0.0.1' } } });
await app.register(swaggerUi, { routePrefix: '/docs' });

const health = z.object({ status: z.literal('ok') });
app.get('/health', async () => ({ status: 'ok' }));

app.get('/openapi.json', async () => app.swagger());

const port = Number(process.env.PORT ?? 3001);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
